#!/usr/bin/env node
// Quote builder check (/quote, real browser). Month to month only since 10/20/2026: no 12-month
// agreement, no x1.25 month-to-month markup, no onboarding fee, no "Save 20%". Saved quote links
// made before that carry `term: "annual"` or `term: "monthly"` in the hash; they must still open,
// at today's month-to-month list price. Opens /quote with saved hashes and asserts the rendered
// price, plus the new ShelfCollect table and that no annual/onboarding copy is left on the page.
// Usage: npm run check:quote   (CHROME_PATH overrides the Chrome binary). Exits 1 on any failure.
// Runs on every push to main (.github/workflows/checks.yml).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png" };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split("?")[0]);
  let file = path.join(ROOT, p);
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  if (!fs.existsSync(file) && fs.existsSync(file + ".html")) file += ".html";
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const BASE = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await ctx.route((url) => !url.href.startsWith(BASE), (route) => route.abort());

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("  PASS " + m); } else { fail++; console.log("  FAIL " + m); } };
// Same encoding the page's saveHash() uses.
const hashOf = (state) => encodeURIComponent(Buffer.from(JSON.stringify(state), "utf8").toString("base64"));
// "No contract and no onboarding fee" is allowed; any onboarding fee AMOUNT, and any
// committed-term wording, is not.
const RETIRED = /12[- ]month|annual|Save 20%|waived|one[- ]time|\$[0-9,]+ onboarding|onboarding fee:? (of )?\$|agreement|way out|remaining payments/i;

// Copy summary goes to the clipboard; capture it instead.
await ctx.addInitScript(() => {
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: (t) => { window.__copied = t; return Promise.resolve(); } } });
});

async function open(state) {
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(BASE + "/quote" + (state ? "#" + hashOf(state) : ""), { waitUntil: "load" });
  const shown = await page.$eval("#quote", (el) => !el.hidden);
  let summary = "";
  if (shown) {
    await page.click("#copy-text");
    summary = await page.evaluate(() => window.__copied || "");
  }
  await page.waitForTimeout(100); // let a late script error surface
  const out = {
    errors,
    shown,
    summary,
    price: (await page.$eval("#qd-price", (el) => el.textContent)).trim(),
    terms: (await page.$eval("#qd-terms", (el) => el.textContent)).trim(),
    list: await page.$eval("#qd-list", (el) => el.innerText),
    body: await page.$eval("body", (el) => el.innerText),
    termInputs: (await page.$$('input[name="term"]')).length,
    collectChips: await page.$$eval("#collect-chips label", (els) => els.map((e) => e.textContent.trim())),
    payChips: await page.$$eval("#pay-chips label", (els) => els.map((e) => e.textContent.trim())),
  };
  await page.close();
  return out;
}

// [name, saved hash state, expected #qd-price text]
const CASES = [
  // The fence: a saved 12-month link renders the month-to-month price (and so does an old m2m link).
  ["ShelfCollect $500k–$1M, saved term=annual", { product: "collect", term: "annual", c: "t2", q: "SS-AAAAAA" }, "$2,500/month"],
  ["ShelfCollect $500k–$1M, saved term=monthly (no x1.25)", { product: "collect", term: "monthly", c: "t2", q: "SS-AAAAAB" }, "$2,500/month"],
  ["ShelfPay under $500k + 2 extra stores, saved term=annual", { product: "pay", term: "annual", g: "t1", n: 3, q: "SS-AAAAAC" }, "$2,000/month"],
  ["ShelfPay under $500k + 2 extra stores, saved term=monthly (no x1.25)", { product: "pay", term: "monthly", g: "t1", n: 3, q: "SS-AAAAAD" }, "$2,000/month"],
  ["ShelfPay $1M–$2M, saved term=monthly, 10% discount", { product: "pay", term: "monthly", g: "t3", n: 1, dn: "Spring", dp: 10, q: "SS-AAAAAE" }, "$3,600/month"],
  ["ShelfCollect old 'Under $500k' (t1) lands on $250k–$500k", { product: "collect", term: "annual", c: "t1", q: "SS-AAAAAF" }, "$1,500/month"],
  ["ShelfCollect oldest '<$150k' letter (a) lands on under $100k", { product: "collect", term: "annual", c: "a", q: "SS-AAAAAP" }, "$750/month"],
  // Every band of both tables.
  ["ShelfCollect under $100k", { product: "collect", c: "c0", q: "SS-AAAAAG" }, "$750/month"],
  ["ShelfCollect $100k–$250k", { product: "collect", c: "c1", q: "SS-AAAAAH" }, "$1,000/month"],
  ["ShelfCollect $250k–$500k", { product: "collect", c: "c2", q: "SS-AAAAAJ" }, "$1,500/month"],
  ["ShelfCollect $1M–$1.5M", { product: "collect", c: "c3", q: "SS-AAAAAK" }, "$3,500/month"],
  ["ShelfCollect $1.5M–$2M", { product: "collect", c: "c4", q: "SS-AAAAAL" }, "$4,500/month"],
  ["ShelfCollect Enterprise, saved term=annual", { product: "collect", term: "annual", c: "c5", q: "SS-AAAAAM" }, "Custom from $5,500/month"],
  ["ShelfPay $500k–$1M", { product: "pay", g: "t2", n: 1, q: "SS-AAAAAN" }, "$2,500/month"],
  ["ShelfPay $1M–$2M", { product: "pay", g: "t3", n: 1, q: "SS-AAAAAQ" }, "$4,000/month"],
  ["ShelfPay $2M–$4M", { product: "pay", g: "t4", n: 1, q: "SS-AAAAAR" }, "$6,500/month"],
  ["ShelfPay Enterprise + 3 stores, saved term=annual", { product: "pay", term: "annual", g: "t5", n: 4, q: "SS-AAAAAS" }, "Custom from $8,000/month"],
];

console.log("# saved quote links open at the month-to-month price");
for (const [name, state, want] of CASES) {
  const r = await open(state);
  ok(r.errors.length === 0, `${name}: no script errors ${JSON.stringify(r.errors)}`);
  ok(r.shown && r.price === want, `${name}: ${JSON.stringify(r.price)} (want ${JSON.stringify(want)})`);
  ok(!RETIRED.test(r.body), `${name}: no 12-month / annual / onboarding-fee / agreement / way-out copy on the page`);
  ok(r.summary.length > 0 && !RETIRED.test(r.summary), `${name}: copied summary has none either (${r.summary.length} chars)`);
  ok(/^Month to month/.test(r.terms), `${name}: terms line reads month to month (${JSON.stringify(r.terms)})`);
  ok(r.summary.includes("Month to month"), `${name}: copied summary says month to month`);
  if (state.product === "pay") ok(/Credit recovery[\s\S]*20%/.test(r.list), `${name}: 20% credit-recovery line present`);
  ok(!/monthly sales monthly sales/.test(r.summary), `${name}: summary has no doubled range text`);
}

console.log("# the form");
const blank = await open(null);
ok(blank.errors.length === 0, `blank form: no script errors ${JSON.stringify(blank.errors)}`);
ok(!blank.shown, "blank form: no quote until a range is picked");
ok(!RETIRED.test(blank.body), "blank form (empty state): no retired copy");
ok(blank.termInputs === 0, `no agreement-term choice on the form (found ${blank.termInputs})`);
const WANT_COLLECT = ["Under $100k", "$100k–$250k", "$250k–$500k", "$500k–$1M", "$1M–$1.5M", "$1.5M–$2M", "Over $2M · Enterprise"];
ok(JSON.stringify(blank.collectChips) === JSON.stringify(WANT_COLLECT), `ShelfCollect table = ${JSON.stringify(blank.collectChips)}`);
const WANT_PAY = ["Under $500k", "$500k–$1M", "$1M–$2M", "$2M–$4M", "Over $4M · Enterprise"];
ok(JSON.stringify(blank.payChips) === JSON.stringify(WANT_PAY), `ShelfPay table = ${JSON.stringify(blank.payChips)}`);

await browser.close();
server.close();
console.log(`\n${pass} passed, ${fail} failed`);
if (pass === 0) { console.log("no checks ran"); process.exit(1); }
process.exit(fail ? 1 : 0);
