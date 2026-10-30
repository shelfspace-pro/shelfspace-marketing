#!/usr/bin/env node
// check:blog-sync, part 2 (Z-E3b, 10/30/2026): blog.html's sections stay consistent.
//   - every curated section's static `section-count` equals its card count (crawlers and the pre-JS paint see it);
//   - every card in a section carries that section's data-category;
//   - ranks inside a section run 1..n with no gap or repeat (a release adds rank 1 and bumps the rest: a repeat
//     means two cards fight for one slot, a gap means a card was lost);
//   - every card in .blog-section-rest is rank 99;
//   - the curated-mode CSS hides EVERY rank past 3 (the old rule listed 4-20, so ranks 21+ leaked into the view).
// Part 1 is marketing/scripts/check-blog-sync.sh (orphans: filesystem <-> blog.html <-> llms.txt).
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const HIDE = '.blog-card[data-rank]:not([data-rank="1"], [data-rank="2"], [data-rank="3"])';

export function blogIndexErrors(html) {
  const errs = [];
  const sections = [...html.matchAll(/<section class="blog-section" data-section-cat="([^"]+)">([\s\S]*?)<\/section>/g)];
  if (sections.length < 3) errs.push(`only ${sections.length} curated sections found (region empty)`);
  for (const [, cat, body] of sections) {
    const cards = [...body.matchAll(/<a [^>]*class="blog-card"[^>]*>/g)].map((m) => m[0]);
    if (!cards.length) { errs.push(`${cat}: no cards`); continue; }
    const count = body.match(/<span class="section-count">(\d+)<\/span>/);
    if (!count) errs.push(`${cat}: no section-count`);
    else if (Number(count[1]) !== cards.length) errs.push(`${cat}: section-count ${count[1]} but ${cards.length} cards`);
    const wrong = cards.filter((c) => !c.includes(`data-category="${cat}"`));
    if (wrong.length) errs.push(`${cat}: ${wrong.length} card(s) carry another data-category`);
    const ranks = cards.map((c) => Number((c.match(/data-rank="(\d+)"/) || [])[1]));
    const want = cards.map((_, i) => i + 1);
    if (ranks.join(",") !== want.join(",")) {
      const seen = new Map(); ranks.forEach((r) => seen.set(r, (seen.get(r) || 0) + 1));
      const dup = [...seen].filter(([, n]) => n > 1).map(([r]) => r);
      errs.push(`${cat}: ranks must run 1..${cards.length} top to bottom${dup.length ? ` (repeated: ${dup.join(", ")})` : ""}`);
    }
  }
  const rs = html.indexOf('<div class="blog-section-rest">');
  if (rs < 0) errs.push("no .blog-section-rest");
  else {
    const rest = html.slice(rs, html.indexOf("</section>", rs));
    const bad = [...rest.matchAll(/<a [^>]*class="blog-card"[^>]*>/g)].filter((m) => !m[0].includes('data-rank="99"'));
    if (!/class="blog-card"/.test(rest)) errs.push(".blog-section-rest has no cards (region empty)");
    if (bad.length) errs.push(`.blog-section-rest: ${bad.length} card(s) not rank 99`);
  }
  const hides = html.split(HIDE).length - 1;
  if (hides !== 2) errs.push(`curated CSS must hide every rank past 3 with ${HIDE} (in the page CSS and the <noscript> block): found ${hides}`);
  return errs;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const html = readFileSync(join(ROOT, "blog.html"), "utf8");
  // self-test: each rule fires on a literal mutation of the real page
  const st = [];
  const expectBad = (name, h) => { if (!blogIndexErrors(h).length) st.push(`self-test: ${name} not caught`); };
  expectBad("a count off by one", html.replace(/(data-section-cat="Collections">[\s\S]*?<span class="section-count">)(\d+)/, (_m, a, n) => a + (Number(n) - 1)));
  expectBad("a repeated rank", html.replace(/(data-section-cat="Collections"[\s\S]*?data-rank=")2(")/, "$11$2"));
  expectBad("a rest card ranked 1", html.replace(/(blog-section-rest[\s\S]*?data-rank=")99(")/, "$11$2"));
  expectBad("the old 4-20 list", html.replace(HIDE, '.blog-card[data-rank="4"]'));
  const errs = blogIndexErrors(html);
  if (st.length || errs.length) { console.error(`check:blog-index FAILED\n- ${[...st, ...errs].join("\n- ")}`); process.exit(1); }
  console.log("check:blog-index OK (counts, categories, ranks 1..n, rest = 99, curated CSS hides rank 4+)");
}
