// check:index-template — the Days-to-Pay Index page template + every published Index page (SEO engine row E3).
//   node scripts/seo/check-index-template.mjs        self-test, then check the repo (exit 1 on any violation)
//
// What it holds (each line names the regression it catches):
//   unserved   the template lives under scripts/ and .vercelignore keeps scripts/ off the site (a template on
//              shelfspace.pro would be an indexable page full of {{SLOTS}})
//   slots      the template carries exactly the slots the platform release script fills: SLUG, CANONICAL,
//              META_DESCRIPTION and H1 may repeat, every other slot appears once (a lost slot = a page with
//              no methodology, or a preview banner that can never be switched off)
//   shell      the 10/27/2026 shell: seo-assets.css, the INDEX v1 style block, the sitewide footer columns
//              byte-identical to index.html's, the nav CTA tagged blog-{{SLUG}}-nav, no ShelfSpace price
//   releases   every blog/cannabis-days-to-pay-index-*.html: no preview banner, no robots noindex, a
//              methodology section (#methodology[data-claims-method]) and the CC BY 4.0 license link
// Every region asserts it read something (an empty region would pass every check).
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const TEMPLATE_REL = "scripts/seo/index-release/template.html";
export const SLOTS = ["TITLE", "META_DESCRIPTION", "CANONICAL", "SLUG", "ROBOTS", "JSONLD", "LABEL", "H1", "LEDE", "ASOF", "PREVIEW_BANNER", "GLANCE", "BODY", "FAQ"];
export const REPEATABLE = new Set(["SLUG", "CANONICAL", "META_DESCRIPTION", "H1"]);
const CC_BY = "https://creativecommons.org/licenses/by/4.0/";
export const RELEASE_RE = /^cannabis-days-to-pay-index-(spring|summer|fall|winter)-\d{4}\.html$/;

const footerCols = (html) => (html.match(/<div class="footer-col">[\s\S]*?<\/div>/g) || []).join("\n");

export function templateErrors(tpl, { indexHtml, vercelignore }) {
  const errs = [];
  if (!tpl) return ["template missing"];
  if (!/^scripts\//.test(TEMPLATE_REL) || !/^scripts\/\s*$/m.test(vercelignore || "")) errs.push("unserved: .vercelignore must keep scripts/ off the site");
  const found = new Map();
  for (const m of tpl.matchAll(/\{\{([A-Z0-9_]+)\}\}/g)) found.set(m[1], (found.get(m[1]) || 0) + 1);
  if (!found.size) errs.push("slots: no slots read");
  for (const s of SLOTS) {
    const n = found.get(s) || 0;
    if (REPEATABLE.has(s) ? n < 1 : n !== 1) errs.push(`slots: {{${s}}} appears ${n} times`);
  }
  for (const s of found.keys()) if (!SLOTS.includes(s)) errs.push(`slots: unknown slot {{${s}}}`);
  if (!tpl.includes('<link rel="stylesheet" href="/seo-assets.css">')) errs.push("shell: seo-assets.css not loaded");
  if (!tpl.includes("DAYS-TO-PAY INDEX v1")) errs.push("shell: INDEX v1 style block missing");
  if (!tpl.includes('href="/contact?cta=blog-{{SLUG}}-nav"')) errs.push("shell: nav CTA not tagged blog-{{SLUG}}-nav");
  if (!/<head>[\s\S]*\{\{ROBOTS\}\}[\s\S]*<\/head>/.test(tpl)) errs.push("shell: {{ROBOTS}} must sit in <head>");
  if (!/<body>\s*\{\{PREVIEW_BANNER\}\}/.test(tpl)) errs.push("shell: {{PREVIEW_BANNER}} must open <body>");
  const cols = footerCols(tpl);
  if (!cols) errs.push("shell: no footer columns read");
  else if (cols !== footerCols(indexHtml || "")) errs.push("shell: footer columns differ from index.html's (one footer sitewide)");
  if (/\$\s?\d/.test(tpl.replace(/<script[\s\S]*?<\/script>/g, ""))) errs.push("shell: a dollar figure in the template (no ShelfSpace price, ever)");
  if (/Shelf(Collect|Pay)/i.test(tpl)) errs.push("shell: a retired product name");
  return errs;
}

export function releasePageErrors(html, file) {
  const errs = [];
  if (/class="ix-preview"/.test(html)) errs.push(`${file}: releases: carries the PREVIEW banner`);
  if (/<meta[^>]+name="robots"[^>]+noindex/i.test(html)) errs.push(`${file}: releases: robots noindex on a published release`);
  if (!/<section id="methodology"[^>]*data-claims-method/.test(html)) errs.push(`${file}: releases: no #methodology[data-claims-method] section`);
  if (!html.includes(CC_BY)) errs.push(`${file}: releases: no CC BY 4.0 license link`);
  if (/\{\{[A-Z0-9_]+\}\}/.test(html)) errs.push(`${file}: releases: an unfilled slot`);
  return errs;
}

// ---------- self-test (literal fixtures; run before every check) ----------
export function selfTest(real) {
  const fails = [];
  const ctx = { indexHtml: real.indexHtml, vercelignore: real.vercelignore };
  const expectBad = (name, tpl, c = ctx) => { if (!templateErrors(tpl, c).length) fails.push(`self-test: "${name}" passed`); };
  expectBad("a slot dropped", real.tpl.replace("{{BODY}}", ""));
  expectBad("a slot doubled", real.tpl.replace("{{GLANCE}}", "{{GLANCE}}{{GLANCE}}"));
  expectBad("an unknown slot", real.tpl.replace("{{LEDE}}", "{{LEDE}}{{EXTRA}}"));
  expectBad("ROBOTS moved out of head", real.tpl.replace("{{ROBOTS}}", "").replace("<body>", "<body>{{ROBOTS}}"));
  expectBad("scripts/ served", real.tpl, { ...ctx, vercelignore: real.vercelignore.replace(/^scripts\/\s*$/m, "") });
  expectBad("a footer variant", real.tpl.replace('<div class="footer-col">', '<div class="footer-col"><a href="/x">X</a>'));
  expectBad("a price", real.tpl.replace("{{LEDE}}", "{{LEDE}} $499 a month"));
  const okPage = `<html><head></head><body><section id="methodology" class="ix-method" data-claims-method><a href="${CC_BY}">CC</a></section></body></html>`;
  if (releasePageErrors(okPage, "ok").length) fails.push("self-test: a clean release page failed");
  if (!releasePageErrors(okPage.replace("<body>", '<body><div class="ix-preview">P</div>'), "p").length) fails.push("self-test: a preview banner passed");
  if (!releasePageErrors(okPage.replace("<head>", '<head><meta name="robots" content="noindex, nofollow">'), "r").length) fails.push("self-test: noindex passed");
  if (!releasePageErrors(okPage.replace("data-claims-method", ""), "m").length) fails.push("self-test: a page without the method block passed");
  if (!releasePageErrors(okPage.replace(CC_BY, "https://example.org/"), "c").length) fails.push("self-test: a page without CC BY passed");
  return fails;
}

function main() {
  const read = (rel) => (existsSync(join(ROOT, rel)) ? readFileSync(join(ROOT, rel), "utf8") : "");
  const real = { tpl: read(TEMPLATE_REL), indexHtml: read("index.html"), vercelignore: read(".vercelignore") };
  const fails = selfTest(real);
  fails.push(...templateErrors(real.tpl, real));
  const releases = readdirSync(join(ROOT, "blog")).filter((f) => RELEASE_RE.test(f));
  for (const f of releases) fails.push(...releasePageErrors(read(`blog/${f}`), `blog/${f}`));
  if (fails.length) {
    for (const f of fails) console.error(`FAIL ${f}`);
    console.error(`check:index-template: ${fails.length} failure(s)`);
    process.exit(1);
  }
  console.log(`check:index-template: OK (template, ${releases.length} release page(s))`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
