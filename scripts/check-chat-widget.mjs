#!/usr/bin/env node
// Behavioral check of the Chelsea chat widget (sales row D4) in /shelfiq-widget.js. Serves the repo,
// stubs Turnstile and https://ourshelf.space/api/public/sales-chat, and asserts: nothing is sent on
// page load; opening starts a session; replies render as TEXT (an <img onerror> reply stays text);
// only shelfspace.pro links become links; the details card shows the server's disclosure verbatim
// above a "Submit" button and posts version + sha + label + the attribution; offers render and drive
// slots / book / call; OFF-path shows "Chris will reach out"; an endpoint failure shows the
// fallback link; the attribution block still writes ss-session-touch; no sideways scroll at 390 px.
// Usage: npm run check:chat-widget   (SHOTS=<dir> writes screenshots). Exits 1 on any failure.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium as pwChromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
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
const launch = () => pwChromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
let pass = 0, failN = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  PASS ' + m); } else { failN++; console.log('  FAIL ' + m); } };

const DISCLOSURE = { version: '2026-10-18-f', html: '<p class="sales-consent">By clicking Submit, you agree ShelfSpace Technologies Inc. may call you at the number you provide about your business, including automated or AI-voice calls that may be recorded, and may email you. Agreeing isn&#39;t a condition of buying anything. Opt out anytime by replying &quot;stop&quot; or telling Chelsea.</p>', sha256: 'abc123', buttonLabel: 'Submit' };
const GREETING = "Hi, I'm Chelsea, ShelfSpace's AI assistant.";
const TURNSTILE_STUB = `window.turnstile={_n:0,render:function(el,o){var id=++this._n;setTimeout(function(){o.callback('tok-'+id)},50);return id},reset:function(){}};`;

async function scenario(name, { offers = { booking: true, callNow: true }, fail = false, captureFail = false, reply = 'ShelfCollect sends reminders from your name. Read shelfspace.pro/accounts-receivable or evil.example.com/x', width = 1440, url = '/accounts-receivable.html?utm_source=li&fbclid=fb9&rep=JAKE_R3-x' } = {}) {
  console.log('\n# ' + name);
  const browser = await launch();
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await ctx.newPage();
  const posts = [];
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.route('**/turnstile/v0/api.js*', (r) => r.fulfill({ contentType: 'application/javascript', body: TURNSTILE_STUB }));
  await page.route('**/googletagmanager.com/**', (r) => r.fulfill({ body: '' }));
  await page.route('https://ourshelf.space/**', async (r) => {
    if (r.request().method() !== 'POST') return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"live":false,"capture":true}' });
    const b = JSON.parse(r.request().postData() || '{}');
    posts.push(b);
    if (fail) return r.abort();
    const send = (o) => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(o) });
    if (b.action === 'start') return send({ ok: true, token: 'sc1.t0.s', greeting: GREETING, disclosure: DISCLOSURE, turnstileSiteKey: 'key' });
    if (b.action === 'message') return send({ ok: true, token: 'sc1.t1.s', reply: b.message.includes('xss') ? '<img src=x onerror="window.__pwned=1">' : reply, showCard: b.message.includes('talk') });
    if (b.action === 'capture' && captureFail) return r.fulfill({ status: 400, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ ok: false, error: 'invalid', fields: ['phone'] }) });
    if (b.action === 'capture') return send({ ok: true, token: 'sc1.t2.s', reply: offers.booking || offers.callNow ? 'Got it, Chris. Want to pick a time with Chris now?' : 'Got it, Chris. Chris will reach out soon.', offers });
    if (b.action === 'slots' && b.after) return send({ ok: true, token: 'sc1.t3b.s', more: false, slots: [{ start: '2026-10-26T16:00:00.000Z', label: 'Monday, 10/26/2026 at 9:00 AM PDT' }] });
    if (b.action === 'slots') return send({ ok: true, token: 'sc1.t3.s', more: true, slots: [{ start: '2026-10-23T16:00:00.000Z', label: 'Friday, 10/23/2026 at 9:00 AM PDT' }] });
    if (b.action === 'book') return send({ ok: true, token: 'sc1.t4.s', reply: "You're booked for Friday, 10/23/2026 at 9:00 AM PDT." });
    if (b.action === 'call') return send({ ok: true, reply: 'Chelsea will call you at (***) ***-0721 in a minute.' });
    return send({ ok: false });
  });
  await page.goto(BASE + url);
  await page.waitForTimeout(400);
  return { browser, page, posts, errs };
}

{
  const s = await scenario('happy path, outreach live for this visitor');
  ok(s.posts.length === 0, 'nothing is sent on page load');
  const touch = await s.page.evaluate(() => sessionStorage.getItem('ss-session-touch'));
  ok(!!touch && JSON.parse(touch).fbclid === 'fb9', 'the attribution block still writes ss-session-touch');
  ok(await s.page.locator('.cw-toggle').isVisible(), 'the Chelsea toggle shows');
  ok((await s.page.locator('.cw-toggle').innerText()).includes('Chelsea'), 'toggle names Chelsea');
  await s.page.click('.cw-toggle');
  await s.page.waitForSelector('.cw-msg.ai');
  ok(s.posts[0]?.action === 'start', 'opening starts a session');
  ok((await s.page.locator('.cw-msg.ai').first().innerText()) === GREETING, 'greeting from the server');
  await s.page.fill('.cw-input', 'How does it work?');
  await s.page.press('.cw-input', 'Enter');
  await s.page.waitForFunction(() => document.querySelectorAll('.cw-msg.ai').length >= 2);
  const m = s.posts.find((p) => p.action === 'message');
  ok(m && m.token === 'sc1.t0.s' && m.history.length === 1 && m.history[0].content === GREETING, 'message posts the token + the signed history');
  const links = await s.page.$$eval('.cw-msg.ai a', (as) => as.map((a) => a.href));
  ok(links.length === 1 && links[0] === 'https://shelfspace.pro/accounts-receivable', 'only the shelfspace.pro link is linked (' + links.join(',') + ')');
  await s.page.fill('.cw-input', 'xss please');
  await s.page.press('.cw-input', 'Enter');
  await s.page.waitForFunction(() => document.querySelectorAll('.cw-msg.ai').length >= 3);
  ok((await s.page.evaluate(() => window.__pwned)) === undefined && (await s.page.locator('.cw-msg.ai img').count()) === 0, 'an html reply renders as text');
  const m2 = s.posts.filter((p) => p.action === 'message')[1];
  ok(m2 && m2.token === 'sc1.t1.s' && m2.history.length === 3, 'the next message carries the new token + grown history');

  await s.page.fill('.cw-input', 'can I talk to someone');
  await s.page.press('.cw-input', 'Enter');
  await s.page.waitForSelector('#cwCard');
  ok(true, 'showCard opens the details card');
  const cardText = await s.page.locator('#cwCard').innerText();
  ok(cardText.includes('By clicking Submit, you agree ShelfSpace Technologies Inc.'), 'the disclosure is in the card');
  const order = await s.page.evaluate(() => {
    const c = document.getElementById('cwCard');
    const d = c.querySelector('.sales-consent');
    const b = c.querySelector('button[type=submit]');
    const phone = c.querySelector('input[name=phone]');
    return { discBeforeBtn: !!(d.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING), phoneBeforeDisc: !!(phone.compareDocumentPosition(d) & Node.DOCUMENT_POSITION_FOLLOWING), label: b.textContent };
  });
  ok(order.discBeforeBtn && order.phoneBeforeDisc && order.label === 'Submit', 'disclosure sits above a button labelled "Submit", in the same card as the phone');
  await s.page.fill('#cwCard input[name=name]', 'Chris Mitchem');
  await s.page.fill('#cwCard input[name=email]', 'chris+d4test@shelfspace.pro');
  await s.page.fill('#cwCard input[name=phone]', '(360) 609-0721');
  await s.page.fill('#cwCard input[name=company]', 'Chelsea Chat Test Brand');
  await s.page.selectOption('#cwCard select', 'brand');
  SHOTS && await s.page.screenshot({ path: `${SHOTS}/chat-card-desktop.png` });
  await s.page.click('#cwCard button[type=submit]');
  await s.page.waitForSelector('#cwOffers');
  const cap = s.posts.find((p) => p.action === 'capture');
  ok(cap && cap.disclosure_version === DISCLOSURE.version && cap.disclosure_html_sha256 === DISCLOSURE.sha256 && cap.button_label === 'Submit', 'capture posts version + sha + label');
  ok(cap && cap.turnstile_token === 'tok-1' && cap.website === '' && cap.fill_ms > 0 && cap.cta_id === 'chat-widget' && cap.role === 'brand', 'capture posts Turnstile token, empty honeypot, fill time, cta, role');
  ok(cap && cap.fbclid === 'fb9' && cap.utm_source === 'li' && /^http/.test(cap.page_url), 'capture posts the session attribution + page url');
  ok(cap && cap.rep_code === 'JAKE_R3-x', 'capture posts the partner code from the first page (sales row R3)');
  await s.page.click('#cwOffers button:has-text("Pick a time")');
  await s.page.waitForSelector('#cwSlots button');
  ok((await s.page.locator('#cwSlots button:has-text("More times")').count()) === 1, 'a "More times" button shows when the server says more days are open');
  await s.page.click('#cwSlots button:has-text("More times")');
  await s.page.waitForSelector('#cwSlots button:has-text("Monday")');
  const more = s.posts.filter((p) => p.action === 'slots')[1];
  ok(more && more.after === '2026-10-23T16:00:00.000Z' && more.token === 'sc1.t3.s', '"More times" asks for days after the last time shown, with the slots token');
  ok((await s.page.locator('#cwSlots').count()) === 1 && (await s.page.locator('#cwSlots button:has-text("Friday")').count()) === 0, 'the new page replaces the old times (only the page on screen is bookable)');
  ok((await s.page.locator('#cwSlots button:has-text("More times")').count()) === 0, 'no "More times" on the last page');
  await s.page.click('#cwSlots button:has-text("Monday")');
  await s.page.waitForFunction(() => [...document.querySelectorAll('.cw-msg.note')].some((n) => n.textContent.startsWith("You're booked")));
  const book = s.posts.find((p) => p.action === 'book');
  ok(book && book.token === 'sc1.t3b.s' && book.start === '2026-10-26T16:00:00.000Z' && typeof book.timeZone === 'string', 'book posts the latest slots token + the offered start + the zone');
  ok((await s.page.locator('#cwOffers button:has-text("Pick a time")').count()) === 0, 'booking hides the offers');
  ok(s.errs.length === 0, 'no page errors (' + s.errs.join('; ') + ')');
  SHOTS && await s.page.screenshot({ path: `${SHOTS}/chat-booked-desktop.png` });
  await s.browser.close();
}
{
  const s = await scenario('call me now', { offers: { booking: false, callNow: true } });
  await s.page.click('.cw-toggle');
  await s.page.waitForSelector('.cw-chip');
  await s.page.click('.cw-chip:has-text("Schedule a call")');
  await s.page.waitForSelector('#cwCard');
  await s.page.fill('#cwCard input[name=name]', 'Chris');
  await s.page.fill('#cwCard input[name=email]', 'chris+d4test@shelfspace.pro');
  await s.page.fill('#cwCard input[name=phone]', '3606090721');
  await s.page.fill('#cwCard input[name=company]', 'Test');
  await s.page.selectOption('#cwCard select', 'brand');
  await s.page.click('#cwCard button[type=submit]');
  await s.page.waitForSelector('#cwOffers button:has-text("Call me now")');
  ok((await s.page.locator('#cwOffers button:has-text("Pick a time")').count()) === 0, 'no booking offer when not offered');
  await s.page.click('#cwOffers button:has-text("Call me now")');
  await s.page.waitForFunction(() => [...document.querySelectorAll('.cw-msg.note')].some((n) => n.textContent.includes('***-0721')));
  ok(s.posts.some((p) => p.action === 'call' && p.token === 'sc1.t2.s'), 'call posts the captured token');
  await s.browser.close();
}
{
  const s = await scenario('outreach off → take a message', { offers: { booking: false, callNow: false } });
  await s.page.click('.cw-toggle');
  await s.page.waitForSelector('.cw-sched');
  await s.page.click('.cw-sched');
  await s.page.waitForSelector('#cwCard');
  ok((await s.page.locator('.cw-chip').count()) === 0, 'opening the card drops the chips');
  // Empty submit → asks for every field, posts nothing.
  await s.page.click('#cwCard button[type=submit]');
  ok((await s.page.locator('.cw-err').innerText()).includes('every field') && !s.posts.some((p) => p.action === 'capture'), 'an empty card asks for every field and posts nothing');
  await s.page.fill('#cwCard input[name=name]', 'Jane');
  await s.page.fill('#cwCard input[name=email]', 'jane@brandco.com');
  await s.page.fill('#cwCard input[name=phone]', '6162345678');
  await s.page.fill('#cwCard input[name=company]', 'Brand Co');
  await s.page.selectOption('#cwCard select', 'store');
  await s.page.click('#cwCard button[type=submit]');
  await s.page.waitForFunction(() => [...document.querySelectorAll('.cw-msg.note')].some((n) => n.textContent.includes('Chris will reach out')));
  ok((await s.page.locator('#cwOffers').count()) === 0, 'no booking / call buttons');
  await s.browser.close();
}
{
  const s = await scenario('capture refused (bad phone)', { captureFail: true });
  await s.page.click('.cw-toggle');
  await s.page.waitForSelector('.cw-sched');
  await s.page.click('.cw-sched');
  await s.page.waitForSelector('#cwCard');
  await s.page.fill('#cwCard input[name=name]', 'Jane');
  await s.page.fill('#cwCard input[name=email]', 'jane@brandco.com');
  await s.page.fill('#cwCard input[name=phone]', '555');
  await s.page.fill('#cwCard input[name=company]', 'Brand Co');
  await s.page.selectOption('#cwCard select', 'brand');
  await s.page.click('#cwCard button[type=submit]');
  await s.page.waitForFunction(() => (document.querySelector('.cw-err') || {}).textContent);
  ok((await s.page.locator('.cw-err').innerText()).includes('mobile number'), 'a refused capture names the field');
  ok((await s.page.locator('#cwCard').count()) === 1 && (await s.page.locator('#cwOffers').count()) === 0, 'the card stays, no offers after a refused capture');
  await s.browser.close();
}
{
  const s = await scenario('endpoint down', { fail: true });
  await s.page.click('.cw-toggle');
  await s.page.waitForSelector('.cw-msg.note a');
  ok((await s.page.locator('.cw-msg.note a').getAttribute('href')) === '/contact?cta=chat-widget-fallback', 'a failed start shows the Schedule-a-call fallback link');
  await s.browser.close();
}
{
  const s = await scenario('phone width', { width: 390 });
  // phones hide the launcher on the first screen so it never covers a hero; it must stay hidden there and appear once scrolled
  ok(await s.page.evaluate(() => getComputedStyle(document.querySelector('.cw-toggle')).pointerEvents === 'none'), 'phone: the launcher waits off the first screen');
  await s.page.evaluate(() => { document.body.style.minHeight = '3000px'; window.scrollTo(0, window.innerHeight * 2); });
  await s.page.waitForFunction(() => document.body.classList.contains('ss-past-hero'));
  await s.page.waitForTimeout(400);
  await s.page.click('.cw-toggle');
  await s.page.waitForSelector('.cw-msg.ai');
  await s.page.click('.cw-chip:has-text("Schedule a call")');
  await s.page.waitForSelector('#cwCard');
  SHOTS && await s.page.screenshot({ path: `${SHOTS}/chat-card-phone.png` });
  const sw = await s.page.evaluate(() => document.documentElement.scrollWidth);
  ok(sw <= 390, 'no horizontal scroll at 390px (scrollWidth ' + sw + ')');
  const box = await s.page.locator('.cw-window').boundingBox();
  ok(box && box.width <= 390 && box.x >= 0, 'the chat sheet fits the phone width');
  await s.browser.close();
}
{
  // /contact keeps its own Turnstile hook (the widget never overwrites window.onTurnstileLoad).
  const browser = await launch();
  const page = await (await browser.newContext()).newPage();
  await page.route('https://ourshelf.space/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"live":false,"capture":true}' }));
  await page.route('**/turnstile/v0/api.js*', (r) => r.fulfill({ contentType: 'application/javascript', body: '' }));
  await page.goto(BASE + '/contact.html');
  const hook = await page.evaluate(() => typeof window.onTurnstileLoad);
  ok(hook === 'function', '/contact keeps window.onTurnstileLoad');
  await browser.close();
}
const src = fs.readFileSync(path.join(ROOT, 'shelfiq-widget.js'), 'utf8');
ok(!/api\/shelfiq-chat/.test(src) && src.includes('https://ourshelf.space/api/public/sales-chat'), 'the widget posts only to the platform chat route');
ok(!fs.existsSync(path.join(ROOT, 'api/shelfiq-chat.js')), 'the old ShelfiQ chat function is gone');
console.log(`\nRESULT: ${pass} passed, ${failN} failed`);
server.close();
process.exit(failN ? 1 : 0);
