// check:seo — on-page SEO fence for every indexable page (SEO engine row A3a).
//   node scripts/seo/check-seo.mjs                  self-test on fixtures, then scan the site: ANY violation fails
//   node scripts/seo/check-seo.mjs --root <dir> --json   scan another tree / dump every violation as JSON
//
// "Indexable" comes from siteIndex() in build-sitemap.mjs, so this, the sitemap and IndexNow agree.
// Checks (violation codes):
//   title-count / title-long / title-dup     exactly 1 <title> (svg titles ignored), <=60 chars, unique
//   desc-count / desc-missing / desc-long / desc-short / desc-dup   one non-empty meta description, 50..160, unique
//   canonical                                 exactly 1 rel=canonical and it is self (checked on noindex-free pages
//                                             BEFORE the indexable filter, so a missing one cannot hide the page)
//   h1-count                                  exactly 1 <h1>
//   jsonld-parse                              every application/ld+json block parses
//   faq-mismatch                              FAQPage Question.name / acceptedAnswer.text == visible <details><summary>
//                                             text (or the older .faq-question / .faq-answer-inner accordion)
//   orphan                                    >=1 inbound <a href> from another served page (not the homepage)
//   broken-link / broken-anchor               internal link resolves (cleanUrls, rewrites, redirects) / #id exists
//   img-alt                                   non-empty alt, or alt="" with aria-hidden="true" / role=presentation|none
// Warning only (never fails): link-redirect — a link to a redirect source, a *.html URL or a
// trailing-slash URL (each costs a hop).
//
// No baseline (SEO A3b, 10/28/2026): the site was fixed to zero and every violation fails. A baseline file
// (scripts/seo/check-seo-baseline.json) is refused outright, so the ratchet cannot quietly come back.
import { readFileSync, existsSync, statSync, readdirSync, mkdtempSync, cpSync } from "node:fs";
import { join, dirname, posix, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { ROOT, siteIndex, urlPath } from "./build-sitemap.mjs";

const ORIGIN = "https://shelfspace.pro";
const HERE = dirname(fileURLToPath(import.meta.url));
const BASELINE = join(HERE, "check-seo-baseline.json");
const FIXTURES = join(HERE, "fixtures", "check-seo");
export const LIMITS = { title: 60, descMax: 160, descMin: 50 };

// ---------- text helpers ----------
const NAMED = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", mdash: "—", ndash: "–", hellip: "…", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", middot: "·", copy: "©", reg: "®", trade: "™", times: "×", rarr: "→", larr: "←", bull: "•", deg: "°", frac12: "½", cent: "¢", euro: "€", pound: "£", sect: "§", para: "¶", eacute: "é", shy: "" };
export const decode = (s) => s
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
  .replace(/&([a-z][a-z0-9]*);/gi, (m, n) => (n in NAMED ? NAMED[n] : m));
// Visible text: tags out, entities decoded, whitespace collapsed, typographic quotes unified. A tag becomes a
// space, so `<a>x</a>.` reads "x ." — the space a tag leaves before closing punctuation (or after an opening
// bracket) is dropped, so plain schema text "x." equals it (SEO A3b).
export const norm = (s) => decode(String(s).replace(/<[^>]*>/g, " "))
  .replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"')
  .replace(/\s+/g, " ").replace(/ ([.,;:!?)\]])/g, "$1").replace(/([(\[]) /g, "$1").trim();
// An attribute may follow whitespace OR a CLOSING quote (`rel="canonical"href=…` is a parse error browsers recover from).
// Never an opening quote: in `title="alt=decoy"` the alt= is inside a value.
const attr = (tag, name) => { const m = tag.match(new RegExp(`(?:\\s|(?<=[^=\\s]["']))${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i")); return m ? (m[1] ?? m[2] ?? m[3]) : null; };
const stripComments = (h) => h.replace(/<!--[\s\S]*?-->/g, "");
const stripScripts = (h) => h.replace(/<script\b[\s\S]*?<\/script>/gi, "").replace(/<style\b[\s\S]*?<\/style>/gi, "").replace(/<template\b[\s\S]*?<\/template>/gi, "");

// ---------- the site model ----------
function loadSite(root) {
  const idx = siteIndex(root);
  const vercelIgnore = existsSync(join(root, ".vercelignore"))
    ? readFileSync(join(root, ".vercelignore"), "utf8").split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#")) : [];
  const ignored = (rel) => vercelIgnore.some((p) => p.endsWith("/") ? rel.startsWith(p) : rel === p);
  const files = new Set();
  (function all(dir) {
    for (const name of readdirSync(dir)) {
      if (name === "node_modules" || name === ".git") continue;
      const p = join(dir, name), rel = posix.normalize(p.slice(root.length + 1).split("\\").join("/"));
      if (statSync(p).isDirectory()) all(p); else if (!ignored(rel)) files.add(rel);
    }
  })(root);
  const toRe = (src) => new RegExp("^" + src.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\/:[a-z_]+\*/gi, "(?:/.*)?").replace(/:[a-z_]+\*/gi, ".*").replace(/:[a-z_]+/gi, "[^/]+") + "$");
  const rewrites = (idx.vercel.rewrites || []).map((r) => toRe(r.source));
  const redirects = (idx.vercel.redirects || []).filter((r) => !r.has).map((r) => toRe(r.source));
  const cache = new Map();
  const read = (f) => { if (!cache.has(f)) cache.set(f, readFileSync(join(root, f), "utf8")); return cache.get(f); };
  return { root, idx, files, rewrites, redirects, read, trailingSlashOff: idx.vercel.trailingSlash === false };
}

// A path on the site -> { kind: "file", file } | { kind: "rewrite" } | { kind: "redirect" } | { kind: "missing" }
function resolvePath(site, path) {
  let p = path.replace(/\/{2,}/g, "/");
  try { p = decodeURI(p); } catch {}
  if (site.redirects.some((r) => r.test(p))) return { kind: "redirect" };
  if (site.rewrites.some((r) => r.test(p))) return { kind: "rewrite" };
  // trailingSlash:false 308s /x/ to /x, and cleanUrls 308s /x.html to /x: a hop (warning) when the target exists,
  // a broken link when it does not.
  if (site.trailingSlashOff && p.length > 1 && p.endsWith("/")) { const t = resolvePath(site, p.replace(/\/+$/, "")); return t.kind === "file" ? { kind: "redirect", file: t.file } : t; }
  const rel = p.replace(/^\//, "");
  if (rel.endsWith(".html")) return site.files.has(rel) ? { kind: "redirect", file: rel } : { kind: "missing" };
  const base = rel.replace(/\/$/, "");
  for (const cand of rel === "" ? ["index.html"] : [rel, base + ".html", (base ? base + "/" : "") + "index.html"])
    if (cand && !cand.endsWith("/") && site.files.has(cand)) return { kind: "file", file: cand };
  return { kind: "missing" };
}

const safeDecode = (x) => { try { return decodeURIComponent(x); } catch { return x; } };
// Internal hrefs on a page -> [{ href, path, hash, hop }] (hop = http: or www., a 308 on Vercel)
function internalLinks(html, file) {
  const out = [];
  // trailingSlash:false serves docs/index.html at /docs (no slash), so a relative href resolves against "/".
  const pageUrl = new URL(ORIGIN + urlPath(file));
  for (const m of stripScripts(stripComments(html)).matchAll(/<a\b[^>]*>/gi)) {
    const href = attr(m[0], "href");
    if (href == null || href === "" || /^(mailto|tel|sms|javascript|data):/i.test(href)) continue;
    let u;
    try { u = new URL(decode(href), pageUrl); } catch { continue; }
    if (!/^https?:$/.test(u.protocol) || !/^(www\.)?shelfspace\.pro$/i.test(u.hostname)) continue; // external: ignored
    out.push({ href, path: u.pathname, hash: u.hash ? safeDecode(u.hash.slice(1)) : "", hop: u.protocol === "http:" || /^www\./i.test(u.hostname) });
  }
  return out;
}

const ids = (html) => new Set([...stripComments(html).matchAll(/<(?:[a-z][a-z0-9]*\b[^>]*\sid|a\b[^>]*\sname)\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>"']+))/gi)].map((m) => m[1] ?? m[2] ?? m[3]));

// FAQPage questions anywhere in a JSON-LD value (top level, arrays, @graph).
function faqQuestions(node, out = []) {
  if (Array.isArray(node)) { node.forEach((n) => faqQuestions(n, out)); return out; }
  if (!node || typeof node !== "object") return out;
  const types = [].concat(node["@type"] || []);
  if (types.includes("FAQPage")) for (const q of [].concat(node.mainEntity || [])) {
    const a = [].concat(q?.acceptedAnswer || [])[0];
    out.push({ q: norm(q?.name ?? ""), a: norm(a?.text ?? "") });
  }
  for (const k of Object.keys(node)) if (k !== "mainEntity" || !types.includes("FAQPage")) faqQuestions(node[k], out);
  return out;
}

// ---------- the scan ----------
export function scan(root = ROOT) {
  root = resolve(root);
  const site = loadSite(root);
  const v = new Map(); // file -> Map(code -> [detail])
  const warnings = [];
  const add = (file, code, detail = "") => { if (!v.has(file)) v.set(file, new Map()); const m = v.get(file); if (!m.has(code)) m.set(code, []); m.get(code).push(detail); };

  const candidates = site.idx.pageFiles();
  // Canonical: every page that is not deliberately excluded (internal, redirect, noindex) and does not
  // canonical to a DIFFERENT page must carry exactly one self canonical.
  for (const f of candidates) {
    const html = site.read(f);
    const reason = site.idx.exclusionReason(f, html);
    const tags = (stripComments(html).match(/<link\b[^>]*>/gi) || []).filter((t) => /(^|\s)canonical(\s|$)/i.test(attr(t, "rel") || "")).map((t) => [t]);
    const self = ORIGIN + (urlPath(f) === "/" ? "/" : urlPath(f));
    if (reason && !/canonical/.test(reason)) continue;
    if (tags.length > 1) { add(f, "canonical", `${tags.length} canonical tags`); continue; }
    if (!tags.length) { add(f, "canonical", "no canonical"); continue; }
    const href = attr(tags[0][0], "href");
    if (!href) { add(f, "canonical", "canonical href unreadable"); continue; }
    // Elsewhere on purpose (consolidating a stub into another page) is allowed; a near-miss of self is not.
    const loose = (h) => h.replace(/^http:/, "https:").replace("//www.", "//").replace(/\.html$/, "").replace(/\/index$/, "/").replace(/(.)\/$/, "$1");
    if (href !== self && loose(href) === loose(self)) add(f, "canonical", `not exactly self: ${href}`);
  }

  const pages = site.idx.indexablePages({ extras: false });
  const titles = new Map(), descs = new Map();
  for (const { file: f } of pages) {
    const raw = site.read(f);
    const html = stripComments(raw);
    const head = html.replace(/<svg\b[\s\S]*?<\/svg>/gi, "");
    const t = [...head.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)].map((m) => norm(m[1]));
    if (t.length !== 1) add(f, "title-count", `${t.length} <title>`);
    if (t[0] !== undefined) {
      if ([...t[0]].length > LIMITS.title) add(f, "title-long", `${[...t[0]].length} chars`);
      if (!titles.has(t[0])) titles.set(t[0], []); titles.get(t[0]).push(f);
    }
    const d = (html.match(/<meta\b[^>]*>/gi) || []).filter((t) => /^description$/i.test(attr(t, "name") || "")).map((t) => norm(attr(t, "content") || ""));
    if (d.length > 1) add(f, "desc-count", `${d.length} descriptions`);
    if (!d.length || !d[0]) add(f, "desc-missing", d.length ? "empty" : "none");
    else {
      const n = [...d[0]].length;
      if (n > LIMITS.descMax) add(f, "desc-long", `${n} chars`);
      if (n < LIMITS.descMin) add(f, "desc-short", `${n} chars`);
      if (!descs.has(d[0])) descs.set(d[0], []); descs.get(d[0]).push(f);
    }
    const body = stripScripts(html);
    const h1 = (body.match(/<h1\b/gi) || []).length;
    if (h1 !== 1) add(f, "h1-count", `${h1} <h1>`);

    const faqs = [];
    for (const m of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
      try { faqs.push(...faqQuestions(JSON.parse(m[1]))); } catch (e) { add(f, "jsonld-parse", String(e.message).slice(0, 80)); }
    }
    if (faqs.length) {
      const visible = new Map();
      for (const m of body.matchAll(/<details\b[^>]*>([\s\S]*?)<\/details>/gi)) {
        const s = m[1].match(/<summary\b[^>]*>([\s\S]*?)<\/summary>/i);
        if (s) visible.set(norm(s[1]), norm(m[1].replace(s[0], "")));
      }
      // The older accordion: <button class="faq-question">Q<svg/></button><div class="faq-answer"><div class="faq-answer-inner">A</div></div>
      for (const m of body.matchAll(/<button\b[^>]*class=["'][^"']*\bfaq-question\b[^"']*["'][^>]*>([\s\S]*?)<\/button>\s*<div\b[^>]*class=["'][^"']*\bfaq-answer\b[^"']*["'][^>]*>\s*<div\b[^>]*class=["'][^"']*\bfaq-answer-inner\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi))
        visible.set(norm(m[1].replace(/<svg\b[\s\S]*?<\/svg>/gi, "")), norm(m[2]));
      for (const { q, a } of faqs) {
        if (!visible.has(q)) add(f, "faq-mismatch", `no visible question for: ${q.slice(0, 60)}`);
        else if (visible.get(q) !== a) add(f, "faq-mismatch", `answer differs for: ${q.slice(0, 60)}`);
      }
    }

    for (const m of body.matchAll(/<img\b[^>]*>/gi)) {
      const alt = attr(m[0], "alt");
      const decorative = /\saria-hidden\s*=\s*["']?true/i.test(m[0]) || /\srole\s*=\s*["']?(presentation|none)\b/i.test(m[0]);
      if (alt === null || (alt.trim() === "" && !decorative)) add(f, "img-alt", attr(m[0], "src") || "?");
    }
  }
  for (const [t, fs] of titles) if (fs.length > 1) for (const f of fs) add(f, "title-dup", t.slice(0, 60));
  for (const [d, fs] of descs) if (fs.length > 1) for (const f of fs) add(f, "desc-dup", d.slice(0, 60));

  // Links: outbound checks on indexable pages; inbound counts from every served page.
  const indexable = new Set(pages.map((p) => p.file));
  const inbound = new Map([...indexable].map((f) => [f, 0]));
  const served = candidates.filter((f) => { const r = site.idx.exclusionReason(f, site.read(f)); return !r || !/internal|redirect/.test(r); });
  for (const f of served) {
    const html = site.read(f);
    for (const l of internalLinks(html, f)) {
      const r = resolvePath(site, l.path);
      if (r.file && r.file !== f && inbound.has(r.file)) inbound.set(r.file, inbound.get(r.file) + 1); // a 308 hop still reaches the page
      if (!indexable.has(f)) continue;
      if (r.kind === "missing") { add(f, "broken-link", l.href); continue; }
      if (r.kind === "redirect" || l.hop) warnings.push(`${f}: link-redirect ${l.href}`);
      if (r.file && l.hash && r.file.endsWith(".html") && l.hash !== "top" && !ids(site.read(r.file)).has(l.hash)) add(f, "broken-anchor", l.href);
    }
  }
  for (const [f, n] of inbound) if (n === 0 && f !== "index.html") add(f, "orphan", "no inbound link");

  return { pages: pages.length, violations: v, warnings };
}

const counts = (violations) => Object.fromEntries([...violations].sort(([a], [b]) => (a < b ? -1 : 1))
  .map(([f, m]) => [f, Object.fromEntries([...m].sort(([a], [b]) => (a < b ? -1 : 1)).map(([c, d]) => [c, d.length]))]));

// ---------- self-test: each check against literal fixture pages ----------
// fixtures/check-seo/good/ is a clean mini-site (must scan clean). Each fixtures/check-seo/cases/<name>/ holds
// literal pages copied OVER good/ plus expect.json { "violations": { file: [codes, one per hit] }, "warnings": [exact] }.
// The case must produce EXACTLY those codes — so a check that stops firing, or fires on the wrong page, goes red.
export function selfTest() {
  const fails = [];
  const good = join(FIXTURES, "good");
  const g = scan(good);
  if (g.pages < 3) fails.push(`good fixture: only ${g.pages} indexable pages (region empty)`);
  if (g.violations.size) fails.push(`good fixture is not clean: ${JSON.stringify(counts(g.violations))}`);
  const gs = scan(good + "/"); // --root with a trailing slash must scan the same tree
  if (gs.pages !== g.pages || gs.violations.size) fails.push(`good fixture scanned as "${good}/" differs: ${gs.pages} pages, ${JSON.stringify(counts(gs.violations))}`);
  const cases = readdirSync(join(FIXTURES, "cases")).sort();
  if (cases.length < 12) fails.push(`only ${cases.length} fixture cases (expected one per check)`);
  for (const c of cases) {
    const dir = join(FIXTURES, "cases", c);
    const expect = JSON.parse(readFileSync(join(dir, "expect.json"), "utf8"));
    const T = mkdtempSync(join(tmpdir(), `seo-${c}-`));
    cpSync(good, T, { recursive: true });
    cpSync(dir, T, { recursive: true, filter: (s) => !s.endsWith("expect.json") });
    const r = scan(T);
    // One entry per violation (a code listed twice = two hits), so a check that under-counts goes red too.
    const got = Object.fromEntries([...r.violations].map(([f, m]) => [f, [...m].flatMap(([c, d]) => d.map(() => c)).sort()]));
    const want = Object.fromEntries(Object.entries(expect.violations || {}).map(([f, cs]) => [f, [...cs].sort()]));
    const key = (o) => JSON.stringify(Object.keys(o).sort().map((k) => [k, o[k]]));
    if (key(got) !== key(want)) fails.push(`case ${c}: want ${JSON.stringify(want)} got ${JSON.stringify(got)}`);
    for (const w of expect.warnings || []) if (!r.warnings.includes(w)) fails.push(`case ${c}: missing warning "${w}" (got ${JSON.stringify(r.warnings)})`);
    const extraW = r.warnings.filter((x) => !(expect.warnings || []).includes(x));
    if (extraW.length) fails.push(`case ${c}: unexpected warnings ${JSON.stringify(extraW)}`);
  }
  return { fails, cases: cases.length };
}

// ---------- CLI ----------
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  const opt = (n) => { const i = args.indexOf(n); return i > -1 ? args[i + 1] : null; };
  const root = opt("--root") ? resolve(opt("--root")) : ROOT;
  if (args.includes("--json")) { const r = scan(root); console.log(JSON.stringify({ pages: r.pages, violations: counts(r.violations), warnings: r.warnings }, null, 1)); process.exit(0); }

  if (!args.includes("--skip-self-test") && root === ROOT) {
    const st = selfTest();
    if (st.fails.length) { console.error(`check:seo FAILED (self-test)\n- ${st.fails.join("\n- ")}`); process.exit(1); }
    console.log(`check:seo self-test ok (${st.cases} fixture cases)`);
  }
  const r = scan(root);
  const now = counts(r.violations);
  if (r.pages < (root === ROOT ? 200 : 1)) { console.error(`check:seo FAILED: only ${r.pages} indexable pages (enumeration broken)`); process.exit(1); }
  if (existsSync(BASELINE) || args.includes("--write-baseline") || args.includes("--no-baseline")) {
    console.error(`check:seo FAILED: the baseline is gone (SEO A3b). Fix the page instead; delete ${BASELINE} if present.`);
    process.exit(1);
  }
  if (r.warnings.length) console.log(`check:seo warnings (${r.warnings.length}, not failing):\n  ${r.warnings.slice(0, 15).join("\n  ")}${r.warnings.length > 15 ? `\n  … ${r.warnings.length - 15} more` : ""}`);
  const fails = Object.entries(now).flatMap(([f, m]) => Object.entries(m).map(([c, n]) => `${f}: ${c} ${n} — ${r.violations.get(f).get(c).slice(0, 3).join(" | ")}`));
  if (fails.length) { console.error(`check:seo FAILED: ${fails.length} violation(s)\n  ${fails.join("\n  ")}`); process.exit(1); }
  console.log(`check:seo OK (${r.pages} pages; 0 violations)`);
}
