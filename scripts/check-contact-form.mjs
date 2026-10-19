#!/usr/bin/env node
// Behavioral check of the /contact two-step lead form (sales machine row D2). Serves the repo,
// stubs Turnstile and the platform endpoints, and asserts what the page posts and shows:
// the D1 contract, the go-live calendar gate, the /api/interest fallback on every failure,
// the partner path, and no sideways scroll at 1440 / 390 px.
// Usage: npm run check:contact-form   (CAL_LIVE=1 also loads the real Cal.com embed under the
// production CSP; SHOTS=<dir> writes screenshots). Exits 1 on any failure.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium as pwChromium } from 'playwright-core';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.pdf': 'application/pdf' };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]);
  let file = path.join(ROOT, p);
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  if (!fs.existsSync(file) && fs.existsSync(file + '.html')) file += '.html';
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port;
const SHOTS = process.env.SHOTS || '';
const CAL_LIVE = process.env.CAL_LIVE === '1';
const chromium = { launch: () => pwChromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true }) };
const vercel = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
const CSP = vercel.headers.find(h => h.headers.some(x => x.key === 'Content-Security-Policy')).headers.find(x => x.key === 'Content-Security-Policy').value;
let pass = 0, failN = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  PASS ' + m); } else { failN++; console.log('  FAIL ' + m); } };

const TURNSTILE_STUB = `window.turnstile={_n:0,render:function(el,o){var id=++this._n;setTimeout(function(){o.callback('tok-'+o.sitekey+'-'+id)},60);return id},reset:function(){}};setTimeout(function(){window.onTurnstileLoad&&window.onTurnstileLoad()},0);`;

async function scenario(name, { status, lead, interest, url = '/contact.html?utm_source=li&utm_term=t1&fbclid=fb1&cta=home-hero', role = 'brand', width = 1440, shotPrefix, realCal = false }) {
  console.log('\n# ' + name);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await ctx.newPage();
  const seen = { lead: [], interest: [], status: 0, cal: 0, consoleErr: [] };
  page.on('console', m => { if (m.type() === 'error') seen.consoleErr.push(m.text()); });
  page.on('pageerror', e => seen.consoleErr.push('pageerror ' + e.message));
  await page.route('**/turnstile/v0/api.js*', r => r.fulfill({ contentType: 'application/javascript', body: TURNSTILE_STUB }));
  await page.route('**/googletagmanager.com/**', r => r.fulfill({ body: '' }));
  await page.route('https://ourshelf.space/api/public/sales-status', r => { seen.status++; return status === 'fail' ? r.abort() : r.fulfill({ contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(status) }); });
  await page.route('https://ourshelf.space/api/public/sales-lead', async r => {
    const body = JSON.parse(r.request().postData() || '{}'); seen.lead.push(body);
    const res = lead(body);
    if (res === 'abort') return r.abort();
    return r.fulfill({ status: res.status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(res.body) });
  });
  await page.route('**/api/interest', async r => { seen.interest.push(JSON.parse(r.request().postData() || '{}')); return r.fulfill({ status: interest || 200, contentType: 'application/json', body: '{"ok":true}' }); });
  if (realCal) {
    // Apply the production CSP to the page itself so a blocked Cal.com load shows up here.
    await page.route(BASE + '/contact*', async r => { const resp = await r.fetch(); return r.fulfill({ response: resp, headers: { ...resp.headers(), 'content-security-policy': CSP } }); });
  } else {
    await page.route('https://app.cal.com/**', r => { seen.cal++; return r.fulfill({ contentType: 'application/javascript', body: '' }); });
  }
  await page.goto(BASE + url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1700); // past the 1.5 s too-fast floor
  if (shotPrefix && SHOTS) await page.screenshot({ path: `${SHOTS}/${shotPrefix}-step1.png`, fullPage: false });
  await page.fill('#name', 'Chris D2test');
  await page.fill('#email', 'chris+d2test@shelfspace.pro');
  await page.fill('#phone', '(360) 609-0721');
  await page.fill('#company', 'D2 Test Brand (ShelfSpace sales test)');
  const talkVisible = await page.isVisible('#cxTalkLine');
  await page.click('#submitBtn');
  return { browser, page, seen, talkVisible, role };
}

async function doStep2(page, role, shotPrefix) {
  await page.waitForSelector('#cxStep2:not([hidden])', { timeout: 10000 });
  if (shotPrefix && SHOTS) await page.screenshot({ path: `${SHOTS}/${shotPrefix}-step2.png`, fullPage: false });
  if (role) await page.click(`label[for=role-${role}]`);
  await page.click('label[for=st-MI]');
  await page.selectOption('#cxMoreStates', 'OH');
  if (role === 'brand' || role === 'distributor') await page.click('label[for=band-2]');
  await page.click('label[for=tl-1]');
  await page.fill('#pain', 'Stores pay late <b>');
  await page.click('#step2Btn');
}

const ok200 = (b) => b.step === 1 ? { status: 200, body: { ok: true, leadId: '11111111-2222-4333-8444-555555555555' } } : { status: 200, body: { ok: true } };

// 1. not live, brand
{
  const s = await scenario('not live → thanks, no calendar', { status: { live: false, capture: true }, lead: ok200, shotPrefix: 'desk' });
  ok(!s.talkVisible, 'Chelsea call line hidden while not live');
  await doStep2(s.page, 'brand', 'desk');
  await s.page.waitForSelector('#formSuccess', { state: 'visible' });
  SHOTS && await s.page.screenshot({ path: `${SHOTS}/desk-thanks.png` });
  const p1 = s.seen.lead[0], p2 = s.seen.lead[1];
  ok(p1 && p1.step === 1 && p1.disclosure_version === '2026-10-18-f', 'step 1 posts the disclosure version');
  ok(p1.disclosure_html_sha256 === '1072b51767aa3389a01512a8cbdee287f71a886f870a7e4dcbe00f9acfd2cc9f' && p1.button_label === 'Submit', 'step 1 posts registry sha + "Submit"');
  ok(p1.turnstile_token && p1.turnstile_token.startsWith('tok-0x4AAAAAACiquH5tTwIbSo5z'), 'step 1 token from the platform site key');
  ok(p1.website === '' && typeof p1.fill_ms === 'number' && p1.fill_ms >= 1500, 'honeypot empty + fill_ms sent');
  ok(p1.page_url.startsWith(BASE + '/contact'), 'page_url = this page');
  ok(p1.utm_source === 'li' && p1.utm_term === 't1' && p1.fbclid === 'fb1' && p1.cta_id === 'home-hero', 'UTMs / click id / cta captured');
  ok(p1.phone === '(360) 609-0721' && p1.company && !('role' in p1) && !('path' in p1), 'phone as typed, no role, no path');
  const allowed = new Set(['step','name','email','phone','company','role','turnstile_token','website','fill_ms','disclosure_version','disclosure_html_sha256','button_label','page_url','utm_source','utm_medium','utm_campaign','utm_term','utm_content','fbclid','li_fat_id','referrer','landing_path','cta_id','rep_code','path']);
  ok(Object.keys(p1).every(k => allowed.has(k)), 'step 1 keys ⊆ D1 strict schema: ' + Object.keys(p1).join(','));
  ok(p2 && p2.step === 2 && p2.leadId === '11111111-2222-4333-8444-555555555555' && p2.role === 'brand', 'step 2 posts leadId + role');
  ok(JSON.stringify(p2.states) === '["MI","OH"]' && p2.wholesale_band === '50k_250k' && p2.timeline === 'now' && p2.pain === 'Stores pay late <b>', 'step 2 qualifiers');
  const allowed2 = new Set(['step','leadId','website','role','states','wholesale_band','pain','timeline']);
  ok(Object.keys(p2).every(k => allowed2.has(k)), 'step 2 keys ⊆ D1 strict schema');
  ok(await s.page.isHidden('#cxBooking') && s.seen.cal === 0, 'no calendar, Cal.com never loaded');
  ok((await s.page.textContent('#cxSuccessText')).includes('chris+d2test@shelfspace.pro'), 'thanks names the email');
  await s.page.waitForTimeout(800);
  const sl = await s.page.evaluate(() => document.querySelector('.cx-hero').scrollLeft);
  ok(sl === 0, 'hero not scrolled sideways after the thanks (scrollLeft ' + sl + ')');
  ok(s.seen.interest.length === 0, 'fallback not used');
  ok(s.seen.consoleErr.length === 0, 'no console errors ' + s.seen.consoleErr.join(' | '));
  await s.browser.close();
}
// 2. live, brand → calendar (real Cal.com under the production CSP)
{
  const s = await scenario('live brand → calendar', { status: { live: true, capture: true }, lead: ok200, realCal: CAL_LIVE, shotPrefix: 'desk-live' });
  ok(s.talkVisible, 'Chelsea call line shown when live');
  await doStep2(s.page, 'brand');
  await s.page.waitForSelector('#cxBooking:not([hidden])', { timeout: 10000 });
  if (CAL_LIVE) {
    const fr = await s.page.waitForSelector('#cxCalInline iframe', { timeout: 20000 }).catch(() => null);
    ok(!!fr, 'Cal.com iframe mounted');
    await s.page.waitForTimeout(6000);
    if (fr) { const src = await fr.getAttribute('src'); ok(/shelfspace\/shelfcollect-demo/.test(src) && /email=chris%2Bd2test/.test(src), 'iframe prefilled: ' + src.slice(0, 140)); }
  } else {
    await s.page.waitForTimeout(500);
    ok(s.seen.cal > 0, 'Cal.com embed loader requested');
    const href = await s.page.getAttribute('#cxBookingLink', 'href');
    ok(/shelfcollect-demo\?name=Chris\+D2test&email=chris%2Bd2test/.test(href), 'booking link prefilled: ' + href);
  }
  SHOTS && await s.page.screenshot({ path: `${SHOTS}/desk-live-booking.png` });
  const csp = s.seen.consoleErr.filter(e => /Content Security Policy|Refused/.test(e));
  ok(csp.length === 0, 'no CSP violations ' + csp.join(' | '));
  ok(await s.page.isHidden('#formSuccess'), 'thanks hidden when booking');
  await s.browser.close();
}
// 3. live, store → thanks
{
  const s = await scenario('live store → thanks', { status: { live: true, capture: true }, lead: ok200 });
  await doStep2(s.page, 'store');
  await s.page.waitForSelector('#formSuccess', { state: 'visible' });
  ok(await s.page.isHidden('#cxBooking') && s.seen.cal === 0, 'store gets no calendar');
  ok(!('wholesale_band' in s.seen.lead[1]), 'store sends no wholesale band');
  await s.browser.close();
}
// 4. lead system 500 → /api/interest fallback
for (const [label, fn] of [['500', () => ({ status: 500, body: { ok: false } })], ['403', () => ({ status: 403, body: { ok: false, error: 'turnstile' } })], ['429', () => ({ status: 429, body: { ok: false } })], ['400', () => ({ status: 400, body: { ok: false } })], ['network', () => 'abort']]) {
  const s = await scenario('lead system ' + label + ' → fallback', { status: { live: true, capture: true }, lead: fn });
  await s.page.waitForSelector('#formSuccess', { state: 'visible', timeout: 40000 });
  const f = s.seen.interest[0];
  ok(f && f.fallback === true && f.role === 'Unknown' && f.businessName === 'D2 Test Brand (ShelfSpace sales test)' && f.phone === '(360) 609-0721', label + ': interest got the lead');
  ok(f && f['cf-turnstile-response'].startsWith('tok-0x4AAAAAACiEpqqSU9lohNi-'), label + ': fallback token from the interest site key');
  ok(f && f.fallbackReason === (label === 'network' ? 'network' : 'http_' + label), label + ': reason ' + (f && f.fallbackReason));
  ok(await s.page.isHidden('#cxStep2') && await s.page.isHidden('#cxBooking'), label + ': no step 2, no calendar');
  await s.browser.close();
}
// 5. capture switched off → straight to fallback, no lead post
{
  const s = await scenario('capture off → fallback only', { status: { live: false, capture: false }, lead: ok200 });
  await s.page.waitForSelector('#formSuccess', { state: 'visible', timeout: 20000 });
  ok(s.seen.lead.length === 0 && s.seen.interest.length === 1 && s.seen.interest[0].fallbackReason === 'capture_off', 'no lead post; fallback capture_off');
  await s.browser.close();
}
// 6. status unreachable → treated as not live
{
  const s = await scenario('status unreachable → not live', { status: 'fail', lead: ok200 });
  ok(!s.talkVisible, 'call line hidden');
  await doStep2(s.page, 'brand');
  await s.page.waitForSelector('#formSuccess', { state: 'visible' });
  ok(await s.page.isHidden('#cxBooking') && s.seen.cal === 0, 'no calendar when status fails');
  await s.browser.close();
}
// 7. partner path
{
  const s = await scenario('partner path', { status: { live: true, capture: true }, lead: ok200, url: '/contact.html?cta=for-bookkeepers-hero&path=partner' });
  ok(!s.talkVisible, 'partner: no Chelsea call line');
  await s.page.waitForSelector('#cxStep2:not([hidden])');
  ok(await s.page.isHidden('#cxQualify'), 'partner: qualifiers hidden');
  await s.page.fill('#pain', 'We keep books for six stores');
  await s.page.click('#step2Btn');
  await s.page.waitForSelector('#formSuccess', { state: 'visible' });
  const [p1, p2] = s.seen.lead;
  ok(p1.path === 'partner' && p1.role === 'other' && p1.cta_id === 'for-bookkeepers-hero', 'partner step 1: path + role other + cta');
  ok(p2.role === 'other' && p2.pain === 'Partner: We keep books for six stores' && p2.states.length === 0, 'partner step 2');
  ok(await s.page.isHidden('#cxBooking'), 'partner: no calendar even when live');
  await s.browser.close();
}
// 8. validation: short phone blocked client-side
{
  console.log('\n# validation');
  const browser = await chromium.launch(); const page = await browser.newPage();
  await page.route('**/turnstile/v0/api.js*', r => r.fulfill({ contentType: 'application/javascript', body: TURNSTILE_STUB }));
  let posts = 0; await page.route('https://ourshelf.space/**', r => { if (r.request().method() === 'POST') posts++; return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"live":false,"capture":true}' }); });
  await page.goto(BASE + '/contact.html', { waitUntil: 'domcontentloaded' });
  await page.fill('#name', 'A'); await page.fill('#email', 'a@b.co'); await page.fill('#phone', '12345'); await page.fill('#company', 'X');
  await page.click('#submitBtn'); await page.waitForTimeout(400);
  ok(posts === 0 && (await page.textContent('#formError')).includes('mobile'), 'short phone refused before any post');
  for (const bad of ['(360) 609-0721 ext 12', '0044 20 7946 0958', '360-609-0721x5']) {
    await page.fill('#phone', bad); await page.click('#submitBtn'); await page.waitForTimeout(300);
    ok(posts === 0 && (await page.textContent('#formError')).includes('no extension'), 'refused before posting: ' + bad);
  }
  await browser.close();
}
// 8b. attribution: a campaign on the /contact URL replaces the session touch wholesale (never a blend)
{
  console.log('\n# attribution');
  const browser = await chromium.launch(); const ctx = await browser.newContext(); const page = await ctx.newPage();
  await page.addInitScript(() => { try { sessionStorage.setItem('ss-session-touch', JSON.stringify({ utmSource: 'li', utmMedium: 'social', landing: '/ai-calls?utm_source=li', referrer: 'https://www.linkedin.com/', at: '2026-10-19T00:00:00Z' })); } catch (e) {} });
  await page.route('**/turnstile/v0/api.js*', r => r.fulfill({ contentType: 'application/javascript', body: TURNSTILE_STUB }));
  await page.route('**/googletagmanager.com/**', r => r.fulfill({ body: '' }));
  const posts = [];
  await page.route('https://ourshelf.space/**', r => { if (r.request().method() === 'POST') posts.push(JSON.parse(r.request().postData() || '{}')); return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: r.request().method() === 'POST' ? '{"ok":true,"leadId":"11111111-2222-4333-8444-555555555555"}' : '{"live":false,"capture":true}' }); });
  for (const [label, url, want] of [['url campaign wins', '/contact.html?utm_campaign=q4', { utm_campaign: 'q4' }], ['session touch when url has none', '/contact.html?cta=x1', { utm_source: 'li', utm_medium: 'social', landing_path: '/ai-calls?utm_source=li' }]]) {
    posts.length = 0;
    await page.goto(BASE + url, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(1700);
    await page.fill('#name', 'A B'); await page.fill('#email', 'a@b.co'); await page.fill('#phone', '+44 20 7946 0958'); await page.fill('#company', 'X');
    await page.click('#submitBtn'); await page.waitForSelector('#cxStep2:not([hidden])', { timeout: 10000 });
    const p = posts[0] || {};
    const got = { utm_source: p.utm_source, utm_medium: p.utm_medium, utm_campaign: p.utm_campaign, landing_path: p.landing_path };
    const exp = { utm_source: undefined, utm_medium: undefined, utm_campaign: undefined, landing_path: '/contact.html?utm_campaign=q4', ...want };
    ok(JSON.stringify(got) === JSON.stringify(exp), label + ': ' + JSON.stringify(got));
    ok(p.phone === '+44 20 7946 0958', label + ': +country number accepted');
    if (label === 'url campaign wins') ok(!('referrer' in p), 'url touch: no stored referrer blended in (' + p.referrer + ')');
  }
  await browser.close();
}
// 8c. the lead system refuses the number (400 fields:[phone]) → field error, NOT the email backup
{
  const s = await scenario('phone refused by the lead system', { status: { live: false, capture: true }, lead: (b) => ({ status: 400, body: { ok: false, error: 'invalid', fields: ['phone'] } }) });
  await s.page.waitForFunction(() => getComputedStyle(document.getElementById('formError')).display === 'block', null, { timeout: 30000 });
  ok((await s.page.textContent('#formError')).includes('country code') && s.seen.interest.length === 0, 'phone 400 → asks for another number, no fallback');
  ok(await s.page.isVisible('#cxStep1') && !(await s.page.isDisabled('#submitBtn')), 'step 1 stays, button re-enabled');
  await s.browser.close();
}
// 9. phone width screenshots
{
  const s = await scenario('phone width', { status: { live: false, capture: true }, lead: ok200, width: 390, shotPrefix: 'phone' });
  await doStep2(s.page, 'brand', 'phone');
  await s.page.waitForSelector('#formSuccess', { state: 'visible' });
  SHOTS && await s.page.screenshot({ path: `${SHOTS}/phone-thanks.png` });
  const sw = await s.page.evaluate(() => document.documentElement.scrollWidth);
  ok(sw <= 390, 'no horizontal scroll at 390px (scrollWidth ' + sw + ')');
  await s.browser.close();
}
{
  const s = await scenario('phone live booking', { status: { live: true, capture: true }, lead: ok200, width: 390, realCal: CAL_LIVE });
  await doStep2(s.page, 'brand');
  if (CAL_LIVE) await s.page.waitForSelector('#cxCalInline iframe', { timeout: 20000 }).catch(() => null);
  await s.page.waitForTimeout(6000);
  SHOTS && await s.page.screenshot({ path: `${SHOTS}/phone-live-booking.png` });
  const sw = await s.page.evaluate(() => document.documentElement.scrollWidth);
  ok(sw <= 390, 'booking: no horizontal scroll at 390px (scrollWidth ' + sw + ')');
  await s.browser.close();
}
console.log(`\nRESULT: ${pass} passed, ${failN} failed`);
server.close();
process.exit(failN ? 1 : 0);
