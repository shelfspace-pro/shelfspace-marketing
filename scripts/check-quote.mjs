#!/usr/bin/env node
// Quote builder check (/quote, real browser). Month to month only since 10/20/2026: no 12-month
// agreement, no x1.25 month-to-month markup, no onboarding fee, no "Save 20%". Saved quote links
// made before that carry `term: "annual"` or `term: "monthly"` in the hash; they must still open,
// at today's month-to-month list price. Opens /quote with saved hashes and asserts the rendered
// price, plus the new ShelfSpace table and that no annual/onboarding copy is left on the page.
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
  await page.waitForTimeout(1100); // let a late script error surface + the value count-up finish
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
    productInputs: (await page.$$('input[name="product"]')).length,
    valueTotal: (await page.$eval("#pv-count", (el) => el.textContent)).trim(),
    docValue: await page.$eval("#qd-value", (el) => el.innerText),
  };
  await page.close();
  return out;
}

// [name, saved hash state, expected #qd-price text]
const CASES = [
  // The fence: a saved 12-month link renders the month-to-month price (and so does an old m2m link).
  ["ShelfSpace $500k–$1M, saved term=annual", { product: "collect", term: "annual", c: "t2", q: "SS-AAAAAA" }, "$2,500/month"],
  ["ShelfSpace $500k–$1M, saved term=monthly (no x1.25)", { product: "collect", term: "monthly", c: "t2", q: "SS-AAAAAB" }, "$2,500/month"],
  ["ShelfSpace old 'Under $500k' (t1) lands on $250k–$500k", { product: "collect", term: "annual", c: "t1", q: "SS-AAAAAF" }, "$1,500/month"],
  ["ShelfSpace oldest '<$150k' letter (a) lands on $50k–$100k", { product: "collect", term: "annual", c: "a", q: "SS-AAAAAP" }, "$750/month"],
  // Every band of both tables.
  ["ShelfSpace under $50k (10/25/2026 entry band)", { product: "collect", c: "s0", q: "SS-AAAAAS" }, "$399/month"],
  ["ShelfSpace $50k–$100k", { product: "collect", c: "c0", q: "SS-AAAAAG" }, "$750/month"],
  ["ShelfSpace $100k–$250k", { product: "collect", c: "c1", q: "SS-AAAAAH" }, "$1,000/month"],
  ["ShelfSpace $250k–$500k", { product: "collect", c: "c2", q: "SS-AAAAAJ" }, "$1,500/month"],
  ["ShelfSpace $1M–$1.5M", { product: "collect", c: "c3", q: "SS-AAAAAK" }, "$3,500/month"],
  ["ShelfSpace $1.5M–$2M", { product: "collect", c: "c4", q: "SS-AAAAAL" }, "$4,500/month"],
  ["ShelfSpace Enterprise, saved term=annual", { product: "collect", term: "annual", c: "c5", q: "SS-AAAAAM" }, "Custom from $5,500/month"],
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
  ok(/What you get[\s\S]*What you pay/.test(r.docValue), `${name}: the quote (and its PDF) carries the first-year value block`);
  ok(!/monthly sales monthly sales/.test(r.summary), `${name}: summary has no doubled range text`);
}

console.log("# the form");
const blank = await open(null);
ok(blank.errors.length === 0, `blank form: no script errors ${JSON.stringify(blank.errors)}`);
ok(!blank.shown, "blank form: no quote until a range is picked");
ok(!RETIRED.test(blank.body), "blank form (empty state): no retired copy");
ok(blank.termInputs === 0, `no agreement-term choice on the form (found ${blank.termInputs})`);
const WANT_COLLECT = ["Under $50k", "$50k–$100k", "$100k–$250k", "$250k–$500k", "$500k–$1M", "$1M–$1.5M", "$1.5M–$2M", "Over $2M · Enterprise"];
ok(JSON.stringify(blank.collectChips) === JSON.stringify(WANT_COLLECT), `ShelfSpace table = ${JSON.stringify(blank.collectChips)}`);

// ShelfPay retired from /quote (10/27/2026): brand-only. An old ShelfPay link opens a blank brand quote.
console.log("# ShelfPay is gone");
ok(blank.productInputs === 0, `no ShelfPay/ShelfSpace service choice on the form (found ${blank.productInputs})`);
ok(!/ShelfPay/.test(blank.body), "blank form: the word ShelfPay is nowhere on the page");
const oldPay = await open({ product: "pay", name: "", g: "t2", n: 3, c: "", q: "", dn: "", dp: 0 });
ok(oldPay.errors.length === 0 && !oldPay.shown && !/ShelfPay|stores? after the first/.test(oldPay.body), "old ShelfPay link: opens a blank brand quote, no ShelfPay copy");

// The value card matches /pricing's slider: $500k a month = $301,000 a year (the published stack).
console.log("# first-year value matches /pricing");
const v500 = await open({ product: "collect", c: "t2", s: 500000, q: "SS-AAAAAV" });
ok(v500.valueTotal === "$301,000", `$500k/mo value card = ${JSON.stringify(v500.valueTotal)} (want "$301,000")`);
ok(v500.price === "$2,500/month" && /\$301,000[\s\S]*\$30,000/.test(v500.docValue), `$500k/mo quote doc: get $301,000, pay $30,000 (${JSON.stringify(v500.docValue)})`);

await browser.close();
server.close();
console.log(`\n${pass} passed, ${fail} failed`);
if (pass === 0) { console.log("no checks ran"); process.exit(1); }
process.exit(fail ? 1 : 0);
