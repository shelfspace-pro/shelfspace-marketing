#!/usr/bin/env node
// Behavioral check of the /contact one-question-per-screen lead form (sales row D2, rebuilt
// closers.io-style 10/23/2026). Serves the repo, stubs Turnstile and the platform endpoints, and
// asserts what the page posts and shows: screen-by-screen validation (nothing posts before the mobile
// screen), the D1 contract, the calendar for brands/distributors (live or not), the Chelsea line only
// when live, the /api/interest fallback on every failure, the partner path, no sideways scroll.
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
  await walkStep1(page, { name: 'Chris D2test', email: 'chris+d2test@shelfspace.pro', company: 'D2 Test Brand (ShelfSpace sales test)', phone: '(360) 609-0721' }, seen);
  await page.click('#submitBtn');
  return { browser, page, seen, role };
}

// Screens 1–3 (Enter on name + company, the Continue button on email), then type the mobile number.
async function walkStep1(page, f, seen) {
  await page.fill('#name', f.name); await page.press('#name', 'Enter');
  await page.waitForSelector('#email', { state: 'visible' });
  await page.fill('#email', f.email); await page.click('.cx-q[data-q="email"] [data-next]');
  await page.waitForSelector('#company', { state: 'visible' });
  await page.fill('#company', f.company); await page.press('#company', 'Enter');
  await page.waitForSelector('#phone', { state: 'visible' });
  if (seen) ok(seen.lead.length === 0 && seen.interest.length === 0, 'nothing posted before the mobile screen');
  await page.fill('#phone', f.phone);
}
const bar = (page) => page.evaluate(() => document.getElementById('cxProgress').style.width);

async function doStep2(page, role, shotPrefix) {
  await page.waitForSelector('#qRole:not([hidden])', { timeout: 10000 });
  if (shotPrefix && SHOTS) await page.screenshot({ path: `${SHOTS}/${shotPrefix}-step2.png`, fullPage: false });
  if (role) await page.click(`label[for=role-${role}]`);
  await page.click('#roleBtn');
  if (role === 'brand' || role === 'distributor') {
    await page.waitForSelector('#qBand:not([hidden])');
    if (shotPrefix && SHOTS) await page.screenshot({ path: `${SHOTS}/${shotPrefix}-step3.png`, fullPage: false });
    await page.click('label[for=band-2]');
    await page.click('#step2Btn');
  }
}

const ok200 = (b) => b.step === 1 ? { status: 200, body: { ok: true, leadId: '11111111-2222-4333-8444-555555555555' } } : { status: 200, body: { ok: true } };

// 1. not live, brand → the calendar anyway (10/23/2026), no Chelsea line
{
  const s = await scenario('not live brand → calendar, no Chelsea line', { status: { live: false, capture: true }, lead: ok200, shotPrefix: 'desk' });
  await doStep2(s.page, 'brand', 'desk');
  await s.page.waitForSelector('#cxBooking:not([hidden])', { timeout: 10000 });
  SHOTS && await s.page.screenshot({ path: `${SHOTS}/desk-booking.png` });
  ok(await s.page.isHidden('#cxTalkLine'), 'Chelsea call line hidden while not live');
  await s.page.waitForTimeout(500);
  ok(s.seen.cal > 0, 'Cal.com embed loader requested while not live');
  ok(await bar(s.page) === '100%', 'progress bar full on the calendar');
  const p1 = s.seen.lead[0], p2 = s.seen.lead[1];
  ok(p1 && p1.step === 1 && p1.disclosure_version === '2026-10-23-short', 'step 1 posts the Continue disclosure version');
  ok(p1.disclosure_html_sha256 === 'cc39a9c775e52bb10878dedba4e8ba04beff966965ad0d4faa0eacd4cf0fc90a' && p1.button_label === 'Continue', 'step 1 posts registry sha + "Continue"');
  ok(p1.turnstile_token && p1.turnstile_token.startsWith('tok-0x4AAAAAACiquH5tTwIbSo5z'), 'step 1 token from the platform site key');
  ok(p1.website === '' && typeof p1.fill_ms === 'number' && p1.fill_ms >= 1500, 'honeypot empty + fill_ms sent');
  ok(p1.page_url.startsWith(BASE + '/contact'), 'page_url = this page');
  ok(p1.utm_source === 'li' && p1.utm_term === 't1' && p1.fbclid === 'fb1' && p1.cta_id === 'home-hero', 'UTMs / click id / cta captured');
  ok(p1.name === 'Chris D2test' && p1.email === 'chris+d2test@shelfspace.pro' && p1.phone === '(360) 609-0721' && p1.company && !('role' in p1) && !('path' in p1), 'all four answers, phone as typed, no role, no path');
  const allowed = new Set(['step','name','email','phone','company','role','turnstile_token','website','fill_ms','disclosure_version','disclosure_html_sha256','button_label','page_url','utm_source','utm_medium','utm_campaign','utm_term','utm_content','fbclid','li_fat_id','referrer','landing_path','cta_id','rep_code','path']);
  ok(Object.keys(p1).every(k => allowed.has(k)), 'step 1 keys ⊆ D1 strict schema: ' + Object.keys(p1).join(','));
  ok(p2 && p2.step === 2 && p2.leadId === '11111111-2222-4333-8444-555555555555' && p2.role === 'brand', 'step 2 posts leadId + role');
  ok(JSON.stringify(p2.states) === '[]' && p2.wholesale_band === '50k_250k' && !('timeline' in p2) && !('pain' in p2), 'step 2: the band, nothing else');
  const allowed2 = new Set(['step','leadId','website','role','states','wholesale_band','pain','timeline']);
  ok(Object.keys(p2).every(k => allowed2.has(k)), 'step 2 keys ⊆ D1 strict schema');
  ok(await s.page.isHidden('#formSuccess'), 'thanks hidden when booking');
  await s.page.waitForTimeout(800);
  const sl = await s.page.evaluate(() => document.querySelector('.cx-hero').scrollLeft);
  ok(sl === 0, 'hero not scrolled sideways (scrollLeft ' + sl + ')');
  ok(s.seen.interest.length === 0, 'fallback not used');
  ok(s.seen.consoleErr.length === 0, 'no console errors ' + s.seen.consoleErr.join(' | '));
  await s.browser.close();
}
// 2. live, brand → calendar (real Cal.com under the production CSP)
{
  const s = await scenario('live brand → calendar', { status: { live: true, capture: true }, lead: ok200, realCal: CAL_LIVE, shotPrefix: 'desk-live' });
  await doStep2(s.page, 'brand');
  await s.page.waitForSelector('#cxBooking:not([hidden])', { timeout: 10000 });
  ok(await s.page.isVisible('#cxTalkLine'), 'Chelsea call line shown on the calendar when live');
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
    ok(!/metadata/.test(href), 'no partner code → no booking metadata');
  }
  SHOTS && await s.page.screenshot({ path: `${SHOTS}/desk-live-booking.png` });
  const csp = s.seen.consoleErr.filter(e => /Content Security Policy|Refused/.test(e));
  ok(csp.length === 0, 'no CSP violations ' + csp.join(' | '));
  ok(await s.page.isHidden('#formSuccess'), 'thanks hidden when booking');
  await s.browser.close();
}
// 2b. a partner's booking link (sales row R3): ?rep=CODE → step 1 posts rep_code AND the calendar carries it
{
  const s = await scenario('partner link → coded booking', { status: { live: true, capture: true }, lead: ok200, url: '/contact.html?cta=home-hero&rep=JAKE_R3-x' });
  await doStep2(s.page, 'brand');
  await s.page.waitForSelector('#cxBooking:not([hidden])', { timeout: 10000 });
  ok(s.seen.lead[0] && s.seen.lead[0].rep_code === 'JAKE_R3-x', 'step 1 posts the partner code');
  const href = await s.page.getAttribute('#cxBookingLink', 'href');
  ok(/metadata%5Brep_code%5D=JAKE_R3-x/.test(href), 'booking link carries metadata[rep_code]: ' + href);
  await s.browser.close();
}
// 3. live, store → thanks
{
  const s = await scenario('live store → thanks', { status: { live: true, capture: true }, lead: ok200 });
  await doStep2(s.page, 'store');
  await s.page.waitForSelector('#formSuccess', { state: 'visible' });
  ok(await s.page.isHidden('#cxBooking') && s.seen.cal === 0, 'store gets no calendar');
  ok(!('wholesale_band' in s.seen.lead[1]) && s.seen.lead[1].role === 'store', 'store: role posted straight from the role screen, no band');
  ok((await s.page.textContent('#cxSuccessText')).includes('chris+d2test@shelfspace.pro'), 'thanks names the email');
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
  ok(s.seen.cal === 0, label + ': Cal.com never loaded');
  await s.browser.close();
}
// 5. capture switched off → straight to fallback, no lead post
{
  const s = await scenario('capture off → fallback only', { status: { live: false, capture: false }, lead: ok200 });
  await s.page.waitForSelector('#formSuccess', { state: 'visible', timeout: 20000 });
  ok(s.seen.lead.length === 0 && s.seen.interest.length === 1 && s.seen.interest[0].fallbackReason === 'capture_off', 'no lead post; fallback capture_off');
  await s.browser.close();
}
// 6. status unreachable → treated as not live: calendar still shows, no Chelsea line
{
  const s = await scenario('status unreachable → not live', { status: 'fail', lead: ok200 });
  await doStep2(s.page, 'brand');
  await s.page.waitForSelector('#cxBooking:not([hidden])', { timeout: 10000 });
  ok(await s.page.isHidden('#cxTalkLine'), 'call line hidden when status fails');
  await s.browser.close();
}
// 6b. role + band are required; Back from the band returns to the role screen
{
  const s = await scenario('role and band required', { status: { live: false, capture: true }, lead: ok200 });
  await s.page.waitForSelector('#qRole:not([hidden])', { timeout: 10000 });
  ok(await bar(s.page) === '71%', 'progress at screen 5 of 7 (' + await bar(s.page) + ')');
  await s.page.click('#roleBtn'); await s.page.waitForTimeout(200);
  ok(s.seen.lead.length === 1 && (await s.page.textContent('#step2Error')).includes('pick one'), 'no role → error, nothing posted');
  await s.page.click('label[for=role-distributor]'); await s.page.click('#roleBtn');
  await s.page.waitForSelector('#qBand:not([hidden])');
  await s.page.click('#step2Btn'); await s.page.waitForTimeout(200);
  ok(s.seen.lead.length === 1 && await s.page.isVisible('#qBand'), 'no band → stays, nothing posted');
  await s.page.click('#bandBack');
  ok(await s.page.isVisible('#qRole') && await s.page.isChecked('#role-distributor'), 'Back → role screen, answer kept');
  await s.browser.close();
}
// 7. partner path
{
  const s = await scenario('partner path', { status: { live: true, capture: true }, lead: ok200, url: '/contact.html?cta=for-bookkeepers-hero&path=partner' });
  await s.page.waitForSelector('#qPartner:not([hidden])');
  ok(await s.page.isHidden('#qRole') && await s.page.isHidden('#qBand'), 'partner: role + band screens skipped');
  await s.page.fill('#pain', 'We keep books for six stores');
  await s.page.click('#partnerBtn');
  await s.page.waitForSelector('#formSuccess', { state: 'visible' });
  const [p1, p2] = s.seen.lead;
  ok(p1.path === 'partner' && p1.role === 'other' && p1.cta_id === 'for-bookkeepers-hero', 'partner step 1: path + role other + cta');
  ok(p2.role === 'other' && p2.pain === 'Partner: We keep books for six stores' && p2.states.length === 0, 'partner step 2');
  ok(await s.page.isHidden('#cxBooking') && await s.page.isHidden('#cxTalkLine'), 'partner: no calendar, no Chelsea line');
  await s.browser.close();
}
// 8. validation: each screen refuses a bad answer before moving on; a short phone never posts
{
  console.log('\n# validation');
  const browser = await chromium.launch(); const page = await browser.newPage();
  await page.route('**/turnstile/v0/api.js*', r => r.fulfill({ contentType: 'application/javascript', body: TURNSTILE_STUB }));
  let posts = 0; await page.route('https://ourshelf.space/**', r => { if (r.request().method() === 'POST') posts++; return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"live":false,"capture":true}' }); });
  await page.goto(BASE + '/contact.html', { waitUntil: 'domcontentloaded' });
  ok(await page.isVisible('#name') && await page.isHidden('#email') && await page.isHidden('#phone'), 'only the name screen shows first');
  ok(await bar(page) === '14%', 'progress at screen 1 of 7 (' + await bar(page) + ')');
  await page.press('#name', 'Enter'); await page.waitForTimeout(150);
  ok(await page.isVisible('#name') && (await page.textContent('#formError')).includes('name'), 'empty name → stays, error');
  await page.fill('#name', 'A'); await page.press('#name', 'Enter');
  await page.fill('#email', 'not-an-email'); await page.press('#email', 'Enter'); await page.waitForTimeout(150);
  ok(await page.isVisible('#email') && (await page.textContent('#formError')).includes('email'), 'bad email → stays, error');
  await page.click('.cx-q[data-q="email"] [data-back]');
  ok(await page.isVisible('#name') && (await page.inputValue('#name')) === 'A', 'Back → name screen, answer kept');
  await page.press('#name', 'Enter');
  await page.fill('#email', 'a@b.co'); await page.press('#email', 'Enter');
  await page.press('#company', 'Enter'); await page.waitForTimeout(150);
  ok(await page.isVisible('#company') && (await page.textContent('#formError')).includes('company'), 'empty company → stays, error');
  await page.fill('#company', 'X'); await page.press('#company', 'Enter');
  ok(await page.isVisible('#phone') && await page.isVisible('.sales-consent') && await page.isVisible('#submitBtn'), 'mobile screen shows the consent under the question, above Continue');
  await page.fill('#phone', '12345');
  await page.click('#submitBtn'); await page.waitForTimeout(400);
  ok(posts === 0 && (await page.textContent('#formError')).includes('mobile'), 'short phone refused before any post');
  for (const bad of ['(360) 609-0721 ext 12', '0044 20 7946 0958', '360-609-0721x5']) {
    await page.fill('#phone', bad); await page.press('#phone', 'Enter'); await page.waitForTimeout(300);
    ok(posts === 0 && (await page.textContent('#formError')).includes('no extension'), 'refused before posting: ' + bad);
  }
  await browser.close();
}
// 8-busy. while the mobile-screen save is in flight the button still says "Continue" (never "Sending")
{
  console.log('\n# busy button');
  const browser = await chromium.launch(); const page = await browser.newPage();
  await page.route('**/turnstile/v0/api.js*', r => r.fulfill({ contentType: 'application/javascript', body: TURNSTILE_STUB }));
  await page.route('https://ourshelf.space/api/public/sales-status', r => r.fulfill({ contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"live":false,"capture":true}' }));
  let release; const held = new Promise(r => { release = r; });
  await page.route('https://ourshelf.space/api/public/sales-lead', async r => { await held; return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"ok":true,"leadId":"11111111-2222-4333-8444-555555555555"}' }); });
  await page.goto(BASE + '/contact.html', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(1700);
  await walkStep1(page, { name: 'B U', email: 'b@u.co', company: 'X', phone: '(360) 609-0721' });
  await page.click('#submitBtn');
  await page.waitForFunction(() => document.getElementById('submitBtn').disabled, null, { timeout: 5000 });
  const txt = (await page.textContent('#submitBtn')).trim();
  ok(txt === 'Continue' && !/send/i.test(txt), 'in flight: button still reads "Continue" (' + txt + ')');
  release();
  await page.waitForSelector('#qRole:not([hidden])', { timeout: 10000 });
  await browser.close();
}
// 8a. answers are remembered in this browser: a reload starts with them filled in (blocked storage never breaks the page)
{
  console.log('\n# remembered answers');
  const browser = await chromium.launch(); const ctx = await browser.newContext(); const page = await ctx.newPage();
  await page.route('**/turnstile/v0/api.js*', r => r.fulfill({ contentType: 'application/javascript', body: TURNSTILE_STUB }));
  await page.route('https://ourshelf.space/**', r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"live":false,"capture":true}' }));
  await page.goto(BASE + '/contact.html', { waitUntil: 'domcontentloaded' });
  await page.fill('#name', 'Remy Member'); await page.press('#name', 'Enter');
  await page.fill('#email', 'remy@brand.co'); await page.press('#email', 'Enter');
  await page.reload({ waitUntil: 'domcontentloaded' });
  ok((await page.inputValue('#name')) === 'Remy Member' && (await page.inputValue('#email')) === 'remy@brand.co', 'reload: name + email filled back in');
  ok((await page.inputValue('#company')) === '' && (await page.inputValue('#phone')) === '', 'reload: unanswered screens stay empty');
  const blocked = await browser.newContext(); const bp = await blocked.newPage();
  const errs = []; bp.on('pageerror', e => errs.push(e.message));
  await bp.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }); });
  await bp.route('**/turnstile/v0/api.js*', r => r.fulfill({ contentType: 'application/javascript', body: TURNSTILE_STUB }));
  await bp.route('https://ourshelf.space/**', r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"live":false,"capture":true}' }));
  await bp.goto(BASE + '/contact.html', { waitUntil: 'domcontentloaded' });
  await bp.fill('#name', 'A'); await bp.press('#name', 'Enter');
  ok(await bp.isVisible('#email') && errs.filter(e => !/gtag|googletagmanager/.test(e)).length === 0, 'blocked storage: the form still moves on, no errors ' + errs.join(' | '));
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
    await walkStep1(page, { name: 'A B', email: 'a@b.co', company: 'X', phone: '+44 20 7946 0958' });
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
  ok(await s.page.isVisible('#phone') && !(await s.page.isDisabled('#submitBtn')), 'mobile screen stays, button re-enabled');
  await s.browser.close();
}
// 9. phone width screenshots
{
  const s = await scenario('phone width', { status: { live: false, capture: true }, lead: ok200, width: 390, shotPrefix: 'phone' });
  await doStep2(s.page, 'store', 'phone');
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
