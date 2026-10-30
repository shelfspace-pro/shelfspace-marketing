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
  // A LIVE rule: comments stripped, line endings and whitespace normalized, then a TOP-LEVEL rule (not inside an
  // @media / @supports block) whose selector list has HIDE as one whole item and whose body sets display: none — in
  // the page <style> AND in a <style> inside <noscript>. (A substring count once passed a commented-out rule.)
  const live = html.replace(/<!--[\s\S]*?-->/g, "").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/\r\n?/g, "\n");
  const styles = (h) => [...h.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join("\n");
  const noscript = styles((live.match(/<noscript>[\s\S]*?<\/noscript>/g) || []).join("\n"));
  const page = styles(live.replace(/<noscript>[\s\S]*?<\/noscript>/g, ""));
  const norm = (x) => x.replace(/\s+/g, " ").trim();
  const want = norm(HIDE);
  // split a selector list on TOP-LEVEL commas only (":not(a, b, c)" holds commas of its own)
  const items = (sel) => { const out = []; let d = 0, cur = ""; for (const ch of sel) { if (ch === "(") d++; if (ch === ")") d--; if (ch === "," && !d) { out.push(norm(cur)); cur = ""; } else cur += ch; } out.push(norm(cur)); return out; };
  const rule = (css) => {
    const c = css.replace(/\/\*[\s\S]*?\*\//g, " ");
    for (let k = 0, depth = 0, start = 0; k < c.length; k++) {
      if (c[k] === "{") {
        if (depth === 0) {
          const sel = norm(c.slice(start, k));
          let d = 1, e = k + 1; for (; e < c.length && d; e++) d += c[e] === "{" ? 1 : c[e] === "}" ? -1 : 0;
          const body = c.slice(k + 1, e - 1);
          if (!sel.startsWith("@") && items(sel).map((x) => x.replace(/\(\s+/g, "(").replace(/\s+\)/g, ")").replace(/\s*,\s*/g, ", ")).includes(want) && /(^|;|\s)display\s*:\s*none\b/.test(body)) return true;
          k = e - 1; start = e; continue;
        }
      } else if (c[k] === "}" && depth === 0) start = k + 1;
    }
    return false;
  };
  if (!rule(page)) errs.push(`curated CSS must hide every rank past 3: a top-level \`${HIDE} { display: none }\` rule in the page <style>`);
  if (!rule(noscript)) errs.push(`the <noscript> <style> must hide every rank past 3 with a top-level ${HIDE} … { display: none } rule`);
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
  expectBad("the page rule commented out", html.replace(HIDE + " {", `/* ${HIDE} { */ .zz-nothing {`));
  const ns = html.indexOf("<noscript>", html.indexOf(HIDE) + 1);
  expectBad("the noscript rule gone", html.slice(0, ns) + html.slice(ns).replace(HIDE + ",", ""));
  expectBad("the page rule inside @media", html.replace(HIDE + " {", `@media (max-width: 1px) { ${HIDE} {`).replace("/* Zero only the vertical", "} /* Zero only the vertical"));
  expectBad("the page rule only injected by a script", html.replace(HIDE + " {", ".zz-gone {").replace("</body>", `<script>document.head.insertAdjacentHTML("beforeend","<style>${HIDE}{display:none}</style>")</script></body>`));
  expectBad("the page rule prefixed to flat mode", html.replace(HIDE + " {", `body.blog-flat-mode ${HIDE} {`));
  expectBad("the page rule shows instead of hides", html.replace(/(\.blog-card\[data-rank\]:not\(\[data-rank="1"\], \[data-rank="2"\], \[data-rank="3"\]\) \{\s*)display: none !important;/, "$1display: block !important;"));
  // legitimate formatting must stay green
  for (const [name, h] of [["CRLF line endings", html.replace(/\n/g, "\r\n")], ["no space before {", html.replace(HIDE + " {", HIDE + "{")],
    ["selector mid-list", html.replace(HIDE + " {", HIDE + ", .zz-other {")], ["<noscript> then a newline", html.replace("<noscript><style>", "<noscript>\n<style>")]])
    if (h === html) st.push(`self-test: legitimate-formatting fixture (${name}) did not change the page (vacuous)`);
    else if (blogIndexErrors(h).length) st.push(`self-test: legitimate formatting (${name}) went red: ${blogIndexErrors(h)[0]}`);
  const errs = blogIndexErrors(html);
  if (st.length || errs.length) { console.error(`check:blog-index FAILED\n- ${[...st, ...errs].join("\n- ")}`); process.exit(1); }
  console.log("check:blog-index OK (counts, categories, ranks 1..n, rest = 99, curated CSS hides rank 4+)");
}
