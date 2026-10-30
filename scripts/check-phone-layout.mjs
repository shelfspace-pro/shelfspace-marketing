#!/usr/bin/env node
// check:phone: every page in the header nav at 320 / 375 / 390 / 430px, and EVERY other indexable page (blog, docs,
// tools, templates, tutorials, …; the sitemap's own list) at 320px, with every <details> opened (Z-C3a: the
// nav-only list never saw /tools, /templates/* or a blog post, and two template pages overflowed at 320px).
// PAGES=/a,/blog/b checks exactly those paths (any path, not only nav pages) at all four widths.
// A tap target (link, button, input, select) whose box runs past the screen edge FAILS. Sections clip
// horizontal overflow (overflow-x: clip), so scrollWidth stays at the screen width even when a control
// is cut off. That is how the AR calculator's "Adjust the assumptions" fields shipped half off-screen
// (10/22/2026). Sideways scrollers (carousels, marquees, code blocks) are allowed to run past the edge.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { webkit, chromium } from 'playwright-core';
import { indexablePages } from './seo/build-sitemap.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]);
  let file = path.join(ROOT, p);
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  if (p === '/') file = path.join(ROOT, 'index.html');
  if ((!fs.existsSync(file) || fs.statSync(file).isDirectory()) && fs.existsSync(file + '.html')) file += '.html';
  else if (fs.existsSync(file) && fs.statSync(file).isDirectory() && fs.existsSync(path.join(file, 'index.html'))) file = path.join(file, 'index.html');
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port;

// the pages the header nav points at, read from the homepage nav so a new nav item is checked automatically
const home = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const nav = home.slice(home.indexOf('<nav'), home.indexOf('</nav>'));
const navPages = ['/', ...new Set([...nav.matchAll(/href="(\/[a-z0-9-]+)(?:\?[^"]*)?"/g)].map((m) => m[1]))]
  .filter((p) => p === '/' || fs.existsSync(path.join(ROOT, p.slice(1) + '.html')));
const ALL = [320, 375, 390, 430];
const ONLY = process.env.PAGES ? process.env.PAGES.split(',').map((p) => p.trim()).filter(Boolean) : null;
// [path, widths]: nav pages at every width, every other indexable page with a file at 320 (the narrowest phone).
const jobs = ONLY ? ONLY.map((p) => [p, ALL]) : [
  ...navPages.map((p) => [p, ALL]),
  ...indexablePages().filter((p) => p.file && !navPages.includes(p.path)).map((p) => [p.path, [320]]),
];
const pages = jobs.map(([p]) => p);
if (!ONLY && jobs.length < 200) { console.log(`FAIL: only ${jobs.length} pages to check (expected 200+): enumeration broken`); process.exit(1); }

let browser;
try { browser = await webkit.launch(); } catch {
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
}
let pass = 0, failN = 0;
const tasks = jobs.flatMap(([pg, widths]) => widths.map((width) => [pg, width]));
async function check(pg, width) {
    const ctx = await browser.newContext({ viewport: { width, height: 800 }, isMobile: browser.browserType().name() !== 'chromium', hasTouch: true });
    const page = await ctx.newPage();
    const res = await page.goto(BASE + pg, { waitUntil: 'load' });
    // a page that didn't load would pass vacuously (a 404 has no controls to measure), so it fails
    if (!res || !res.ok()) { failN++; console.log(`  FAIL ${pg} @${width}px: HTTP ${res ? res.status() : 'no response'}`); await ctx.close(); return; }
    if (!(await page.locator('a').count())) { failN++; console.log(`  FAIL ${pg} @${width}px: page has no links (did it load?)`); await ctx.close(); return; }
    const off = await page.evaluate(() => {
      document.querySelectorAll('details').forEach((d) => { d.open = true; });
      const iw = window.innerWidth;
      const scrollsSideways = (el) => {
        for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
          const cs = getComputedStyle(a);
          // a sideways scroller, or a marquee (an INFINITE animation; a one-shot fadeUp scroll-in does not count)
          if (/(auto|scroll)/.test(cs.overflowX) || (cs.animationName !== 'none' && cs.animationIterationCount.includes('infinite'))) return true;
        }
        return false;
      };
      const shown = (el) => {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return false;
        for (let a = el; a && a !== document.documentElement; a = a.parentElement) {
          const cs = getComputedStyle(a);
          // opacity is ignored on purpose: scroll-in .reveal blocks sit at opacity 0 until seen, but keep their layout box
          if (cs.visibility === 'hidden' || cs.display === 'none' || a.getAttribute('aria-hidden') === 'true') return false;
        }
        return true;
      };
      return [...document.querySelectorAll('a, button, input, select, textarea, summary')]
        .filter((el) => !el.closest('nav') && shown(el))
        .filter((el) => { const r = el.getBoundingClientRect(); return r.right > iw + 1 || r.left < -1; })
        .filter((el) => !scrollsSideways(el))
        .slice(0, 5)
        .map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].join('.') || '-'} "${(el.innerText || el.value || el.getAttribute('aria-label') || '').trim().slice(0, 30)}" spans ${Math.round(el.getBoundingClientRect().left)}-${Math.round(el.getBoundingClientRect().right)}px`);
    });
    if (off.length) { failN++; console.log(`  FAIL ${pg} @${width}px: ${off.join(' | ')}`); } else pass++;
    await ctx.close();
}
// a small pool: one browser, several pages at once
let next = 0;
await Promise.all(Array.from({ length: Number(process.env.PHONE_CONCURRENCY || 6) }, async () => {
  while (next < tasks.length) { const [pg, w] = tasks[next++]; await check(pg, w); }
}));
await browser.close();
server.close();
console.log(`\nRESULT: ${pass} passed, ${failN} failed (${pages.length} pages, ${tasks.length} page-widths)`);
process.exit(failN ? 1 : 0);
