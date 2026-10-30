#!/usr/bin/env node
// check:footer (Z-C3d, 10/30/2026): ONE canonical footer sitewide (CLAUDE.md § Footer).
//   - every page that has footer columns has the byte-identical set (no drift into variants);
//   - the tutorial generator and the Days-to-Pay Index template carry that same set;
//   - Resources holds "Free tools" -> /tools (so /tools is linked from every page), each column <= 7 links.
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SKIP = new Set(["node_modules", "email", "_pdf-source", "og-templates", "scripts"]);
const walk = (dir = "") => readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((e) => {
  const rel = dir ? `${dir}/${e.name}` : e.name;
  if (e.isDirectory()) return e.name.startsWith(".") || SKIP.has(e.name) ? [] : walk(rel);
  return e.name.endsWith(".html") ? [rel] : [];
});
export const footerCols = (html) => (html.match(/<div class="footer-col">[\s\S]*?<\/div>/g) || []).join("\n");

export function footerErrors(sources) {
  const errs = [];
  const variants = new Map();
  for (const [f, html] of sources) {
    const cols = footerCols(html);
    if (!cols) continue;
    if (!variants.has(cols)) variants.set(cols, []);
    variants.get(cols).push(f);
  }
  const n = [...variants.values()].reduce((a, v) => a + v.length, 0);
  if (n < 200) errs.push(`only ${n} files with footer columns (expected 200+): region empty`);
  if (variants.size !== 1) {
    const [main] = [...variants].sort((a, b) => b[1].length - a[1].length);
    for (const [, files] of variants) if (files !== main[1]) errs.push(`footer differs from the canonical one (${main[1].length} files) in: ${files.slice(0, 8).join(", ")}${files.length > 8 ? ` … ${files.length - 8} more` : ""}`);
  }
  const canon = [...variants].sort((a, b) => b[1].length - a[1].length)[0]?.[0] || "";
  const res = canon.match(/<div class="footer-col"><h3>Resources<\/h3>[\s\S]*?<\/div>/);
  if (!res) errs.push("no Resources column");
  else if (!res[0].includes('<li><a href="/tools">Free tools</a></li>')) errs.push('Resources column lacks <li><a href="/tools">Free tools</a></li> (Z-C3d)');
  for (const col of canon.match(/<div class="footer-col">[\s\S]*?<\/div>/g) || []) {
    const links = (col.match(/<li>/g) || []).length;
    if (links > 7) errs.push(`a footer column has ${links} links (max 7): ${col.slice(0, 80)}`);
  }
  return errs;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const sources = [...walk().map((f) => [f, readFileSync(join(ROOT, f), "utf8")]),
    ...["scripts/build-tutorials.mjs", "scripts/seo/index-release/template.html"].map((f) => [f, readFileSync(join(ROOT, f), "utf8")])];
  const errs = footerErrors(sources);
  if (!errs.length) {
    // self-test: the fence bites on a one-file variant and on a canonical footer without the /tools link
    const first = sources.findIndex(([, h]) => footerCols(h));
    const one = sources.map(([f, h], i) => [f, i === first ? h.replace('<div class="footer-col">', '<div class="footer-col"><a href="/x">X</a>') : h]);
    if (!footerErrors(one).length) errs.push("self-test: a one-file footer variant was not caught");
    const noTools = sources.map(([f, h]) => [f, h.replace('<li><a href="/tools">Free tools</a></li>', "")]);
    if (!footerErrors(noTools).length) errs.push("self-test: a sitewide footer without Free tools was not caught");
  }
  if (errs.length) { console.error(`check:footer FAILED\n- ${errs.join("\n- ")}`); process.exit(1); }
  console.log(`check:footer OK (${sources.filter(([, h]) => footerCols(h)).length} files, one footer, Resources has Free tools)`);
}
