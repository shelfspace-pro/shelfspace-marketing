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
// "No contract and no onboarding fee" is allowed; any onboarding fee AMOUNT is not.
const RETIRED = /12[- ]month|annual|Save 20%|waived|one time|\$[0-9,]+ onboarding|onboarding fee: \$/i;

async function open(state) {
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(BASE + "/quote" + (state ? "#" + hashOf(state) : ""), { waitUntil: "load" });
  const out = {
    errors,
    shown: await page.$eval("#quote", (el) => !el.hidden),
    price: (await page.$eval("#qd-price", (el) => el.textContent)).trim(),
    terms: (await page.$eval("#qd-terms", (el) => el.textContent)).trim(),
    body: await page.$eval("body", (el) => el.innerText),
    termInputs: (await page.$$('input[name="term"]')).length,
    collectChips: await page.$$eval("#collect-chips label", (els) => els.map((e) => e.textContent.trim())),
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
  ["ShelfCollect new under $100k band", { product: "collect", c: "c0", q: "SS-AAAAAG" }, "$750/month"],
  ["ShelfCollect new $100k–$250k band", { product: "collect", c: "c1", q: "SS-AAAAAH" }, "$1,000/month"],
];

console.log("# saved quote links open at the month-to-month price");
for (const [name, state, want] of CASES) {
  const r = await open(state);
  ok(r.errors.length === 0, `${name}: no script errors ${JSON.stringify(r.errors)}`);
  ok(r.shown && r.price === want, `${name}: ${JSON.stringify(r.price)} (want ${JSON.stringify(want)})`);
  ok(!RETIRED.test(r.body), `${name}: no 12-month / annual / onboarding / "Save 20%" copy on the page`);
  ok(/^Month to month/.test(r.terms), `${name}: terms line reads month to month (${JSON.stringify(r.terms)})`);
}

console.log("# the form");
const blank = await open(null);
ok(blank.termInputs === 0, `no agreement-term choice on the form (found ${blank.termInputs})`);
const WANT_CHIPS = ["Under $100k", "$100k–$250k", "$250k–$500k", "$500k–$1M", "$1M–$1.5M", "$1.5M–$2M", "Over $2M · Enterprise"];
ok(JSON.stringify(blank.collectChips) === JSON.stringify(WANT_CHIPS), `ShelfCollect table = ${JSON.stringify(blank.collectChips)}`);

await browser.close();
server.close();
console.log(`\n${pass} passed, ${fail} failed`);
if (pass === 0) { console.log("no checks ran"); process.exit(1); }
process.exit(fail ? 1 : 0);
