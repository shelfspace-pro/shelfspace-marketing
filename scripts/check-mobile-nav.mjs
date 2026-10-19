#!/usr/bin/env node
// Mobile nav behaviour check (real browser, phone viewport).
// Usage: npm run check:mobile-nav
//
// Serves the repo locally and, on each page below, opens the mobile menu and
// asserts: tapping a group's +/- toggle opens/closes that group and the menu
// STAYS OPEN; tapping outside the menu closes it. Guards the 10/18/2026 bug
// where ~130 pages' inline "close on any document click" handler shut the
// whole menu when you tapped a group's minus sign.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PAGES = [
  "/index.html",
  "/accounts-payable.html",
  "/accounts-receivable.html",
  "/pricing.html",
  "/blog/what-is-shelfspace.html",
];
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2" };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
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
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
// Block third-party requests (analytics, fonts) so the check is offline-safe.
await ctx.route((url) => !url.href.startsWith(BASE), (route) => route.abort());

let failed = 0;
const menuOpen = (page) => page.$eval(".nav-links", (el) => el.classList.contains("mobile-open"));
const groupOpen = (page, i) => page.$$eval(".nav-dropdown", (els, i) => els[i].classList.contains("nav-acc-open"), i);

for (const p of PAGES) {
  const page = await ctx.newPage();
  await page.goto(BASE + p, { waitUntil: "load" });
  const checks = [];
  const expect = (name, actual, want) => checks.push({ name, ok: actual === want, actual, want });

  if ((await page.$$(".nav-dropdown-toggle")).length === 0) {
    console.log(`❌ ${p}: no .nav-dropdown-toggle found — check is not exercising anything`);
    failed++;
    await page.close();
    continue;
  }

  await page.tap(".nav-hamburger");
  await page.waitForTimeout(400);
  expect("menu opens", await menuOpen(page), true);

  const toggle = page.locator(".nav-dropdown-toggle").first();
  const wasOpen = await groupOpen(page, 0);
  await toggle.tap();
  await page.waitForTimeout(300);
  expect("tap toggle: menu stays open", await menuOpen(page), true);
  expect("tap toggle: group flips", await groupOpen(page, 0), !wasOpen);

  await toggle.tap();
  await page.waitForTimeout(300);
  expect("tap toggle again (minus): menu stays open", await menuOpen(page), true);
  expect("tap toggle again: group back", await groupOpen(page, 0), wasOpen);

  // Tap the logo area — outside .nav-links, not the hamburger.
  await page.evaluate(() => document.querySelector(".nav-links").parentElement.parentElement.click());
  await page.waitForTimeout(300);
  expect("outside tap: menu closes", await menuOpen(page), false);

  const bad = checks.filter((c) => !c.ok);
  if (bad.length) {
    failed++;
    for (const c of bad) console.log(`❌ ${p}: ${c.name} (got ${c.actual}, want ${c.want})`);
  } else {
    console.log(`✅ ${p}: ${checks.length} checks`);
  }
  await page.close();
}

await browser.close();
server.close();
process.exit(failed ? 1 : 0);
