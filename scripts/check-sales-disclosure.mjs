#!/usr/bin/env node
// Fence for the /contact two-step lead form (sales machine row D2). Exits 1 on any drift.
//
// What it protects, and the mutation each check exists to catch:
//  1. The consent paragraph is byte-identical to the platform registry (sha256 pinned below and
//     in the page's DISCLOSURE_SHA256). Drift → every lead is saved WITHOUT call consent, silently.
//  2. The paragraph sits inside step 1 (the mobile-number screen), ABOVE the submit button, and that
//     button says "Continue" (visible text AND the data-label the page posts) — the disclosure says
//     "By clicking Continue" (platform version 2026-10-23-short).
//  3. Step 1 posts to the ABSOLUTE ourshelf.space URL, never through this site's /api rewrite
//     (the rewrite would make every visitor share one IP for the lead system's rate limits).
//  4. The booking calendar shows for brands/distributors only (never partners, never the email
//     backup), in one place. Since 10/23/2026 it no longer waits for go-live.
//  5. /api/interest never writes to the visitor (it used to reply as Chris; only Chelsea, through
//     the lead system's gates, may write to a prospect).
// Usage: node scripts/check-sales-disclosure.mjs [path/to/contact.html] [path/to/interest.js]
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const PINNED_VERSION = '2026-10-23-short';
const PINNED_SHA256 = 'cc39a9c775e52bb10878dedba4e8ba04beff966965ad0d4faa0eacd4cf0fc90a';
const LEAD_API = 'https://ourshelf.space/api/public/sales-lead';

const htmlPath = process.argv[2] || 'contact.html';
const apiPath = process.argv[3] || 'api/interest.js';
const html = readFileSync(htmlPath, 'utf8');
const api = readFileSync(apiPath, 'utf8');
const fails = [];
const fail = (m) => fails.push(m);

function region(src, startMarker, endMarker, label) {
  const a = src.indexOf(startMarker);
  const b = a < 0 ? -1 : src.indexOf(endMarker, a + startMarker.length);
  if (a < 0 || b < 0) { fail(`${label}: region markers not found (${startMarker} … ${endMarker})`); return ''; }
  const r = src.slice(a, b);
  if (r.length < startMarker.length + 20) fail(`${label}: region is empty`);
  return r;
}

// 1. consent paragraph
const paras = html.match(/<p class="sales-consent">[^<]*<\/p>/g) || [];
if (paras.length !== 1) fail(`expected exactly 1 <p class="sales-consent">, found ${paras.length}`);
const shaOf = (s) => createHash('sha256').update(s, 'utf8').digest('hex');
if (paras.length === 1 && shaOf(paras[0]) !== PINNED_SHA256) fail(`consent paragraph sha ${shaOf(paras[0])} != registry ${PINNED_SHA256}`);
const pageSha = (html.match(/var DISCLOSURE_SHA256 = '([0-9a-f]{64})';/) || [])[1];
if (pageSha !== PINNED_SHA256) fail(`page DISCLOSURE_SHA256 ${pageSha} != registry ${PINNED_SHA256}`);
const pageVer = (html.match(/var DISCLOSURE_VERSION = '([^']+)';/) || [])[1];
if (pageVer !== PINNED_VERSION) fail(`page DISCLOSURE_VERSION ${pageVer} != ${PINNED_VERSION}`);

// 2. placement + button label
const step1 = region(html, '<div id="cxStep1">', '<div id="cxStep2"', 'step 1');
const consentAt = step1.indexOf('<p class="sales-consent">');
const btnMatch = step1.match(/<button type="submit"[^>]*id="submitBtn"[^>]*>([\s\S]*?)<\/button>/);
if (consentAt < 0) fail('consent paragraph is not inside step 1');
if (!btnMatch) fail('submit button #submitBtn not found in step 1');
else {
  if (consentAt > step1.indexOf(btnMatch[0])) fail('consent paragraph is below the submit button');
  if (!/data-label="Continue"/.test(btnMatch[0])) fail('submit button data-label is not "Continue"');
  const visible = btnMatch[1].replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, '').trim();
  if (visible !== 'Continue') fail(`submit button text is "${visible}", not "Continue"`);
  const phoneQ = region(step1, '<div class="cx-q" data-q="phone"', '<div class="form-error" id="formError"', 'mobile screen');
  if (!phoneQ.includes('<p class="sales-consent">') || !phoneQ.includes('id="submitBtn"')) fail('consent + submit button are not both on the mobile-number screen');
}
if (!/button_label: btn\.getAttribute\('data-label'\)/.test(html)) fail('step 1 does not post the button label from data-label');

// 3. absolute post URL, no relative lead-system call
const leadApi = (html.match(/var LEAD_API = '([^']+)';/) || [])[1];
if (leadApi !== LEAD_API) fail(`LEAD_API is ${leadApi}, must be ${LEAD_API}`);
if (/['"]\/api\/public\/sales-lead/.test(html)) fail('a relative /api/public/sales-lead call goes through the rewrite');

// 4. booking gate
const fin = region(html, 'function finish(role) {', '\n  }\n', 'finish()');
if (!/var book = !isPartner && !lead\.viaFallback && \(role === 'brand' \|\| role === 'distributor'\);/.test(fin)) fail('finish() no longer gates the calendar on brand/distributor (not partner, not fallback)');
if ((html.match(/(?<!function )showBooking\(\)/g) || []).length !== 1) fail('showBooking() must be called from exactly one place (finish)');
if (!/if \(book\) showBooking\(\); else showThanks\(\);/.test(fin)) fail('finish() does not branch on the gate');
const st = region(html, 'function loadStatus() {', '\n  }\n', 'loadStatus()');
if (!/live: d\.live === true/.test(st)) fail('loadStatus() no longer requires live === true');

// 5. interest.js never writes to the visitor
const handler = region(api, 'export default async function handler', '\n}\n', 'interest handler');
const sends = handler.match(/await sendEmail\(\{[\s\S]*?\}\);/g) || [];
if (sends.length !== 1) fail(`interest.js handler makes ${sends.length} sends; must be exactly 1 (Chris's notification)`);
for (const s of sends) {
  if (!/to: NOTIFY_EMAIL/.test(s)) fail('an interest.js send is not addressed to NOTIFY_EMAIL');
}
if (/from: ['"`][^'"`]*chris@shelfspace\.pro/i.test(api)) fail('interest.js still sends From chris@shelfspace.pro');
// The backup must not silently drop a fast autofill the lead system would have kept (its floor is 1.5 s).
if (!/const MIN_FILL_MS_FALLBACK = 1500;/.test(api) || !/const minFill = body\.fallback === true \? MIN_FILL_MS_FALLBACK : MIN_FILL_MS;/.test(handler) || !/elapsedMs < minFill\)/.test(handler)) fail('interest.js fallback fill floor is not the 1.5 s floor');

// 6. www must land on the apex: the lead system's CORS preflight (platform proxy.ts) allows ONLY
//    https://shelfspace.pro, so a form served from www would fall back to email on every submit.
const vercel = JSON.parse(readFileSync(process.argv[4] || 'vercel.json', 'utf8'));
const wwwRedirect = (vercel.redirects || []).find((r) => (r.has || []).some((h) => h.type === 'host' && h.value === 'www.shelfspace.pro'));
if (!wwwRedirect || !/^https:\/\/shelfspace\.pro\//.test(wwwRedirect.destination) || wwwRedirect.source !== '/:path*') fail('vercel.json no longer redirects www.shelfspace.pro to the apex');

if (fails.length) {
  console.error('check-sales-disclosure: FAIL');
  for (const f of fails) console.error('  - ' + f);
  process.exit(1);
}
console.log('check-sales-disclosure: OK (consent sha ' + PINNED_SHA256.slice(0, 12) + '…, 1 send, gate intact)');
