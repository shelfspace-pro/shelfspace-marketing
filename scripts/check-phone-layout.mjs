#!/usr/bin/env node
// check:phone: every page in the header nav, at 320 / 375 / 390 / 430px, with every <details> opened.
// A tap target (link, button, input, select) whose box runs past the screen edge FAILS. Sections clip
// horizontal overflow (overflow-x: clip), so scrollWidth stays at the screen width even when a control
// is cut off. That is how the AR calculator's "Adjust the assumptions" fields shipped half off-screen
// (10/22/2026). Sideways scrollers (carousels, marquees, code blocks) are allowed to run past the edge.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { webkit, chromium } from 'playwright-core';

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

// the pages the header nav points at, read from the homepage nav so a new nav item is checked automatically
const home = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const nav = home.slice(home.indexOf('<nav'), home.indexOf('</nav>'));
const pages = ['/', ...new Set([...nav.matchAll(/href="(\/[a-z0-9-]+)(?:\?[^"]*)?"/g)].map((m) => m[1]))]
  .filter((p) => p === '/' || fs.existsSync(path.join(ROOT, p.slice(1) + '.html')));
const ONLY = process.env.PAGES ? process.env.PAGES.split(',') : null;

let browser;
try { browser = await webkit.launch(); } catch {
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
}
let pass = 0, failN = 0;
for (const pg of pages.filter((p) => !ONLY || ONLY.includes(p))) {
  for (const width of [320, 375, 390, 430]) {
    const ctx = await browser.newContext({ viewport: { width, height: 800 }, isMobile: browser.browserType().name() !== 'chromium', hasTouch: true });
    const page = await ctx.newPage();
    await page.goto(BASE + pg, { waitUntil: 'load' });
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
        .filter((el) => !el.closest('nav, .cw-window, .cw-toggle') && shown(el))
        .filter((el) => { const r = el.getBoundingClientRect(); return r.right > iw + 1 || r.left < -1; })
        .filter((el) => !scrollsSideways(el))
        .slice(0, 5)
        .map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].join('.') || '-'} "${(el.innerText || el.value || el.getAttribute('aria-label') || '').trim().slice(0, 30)}" spans ${Math.round(el.getBoundingClientRect().left)}-${Math.round(el.getBoundingClientRect().right)}px`);
    });
    if (off.length) { failN++; console.log(`  FAIL ${pg} @${width}px: ${off.join(' | ')}`); } else pass++;
    await ctx.close();
  }
}
await browser.close();
server.close();
console.log(`\nRESULT: ${pass} passed, ${failN} failed (${pages.length} pages x 4 widths)`);
process.exit(failN ? 1 : 0);
