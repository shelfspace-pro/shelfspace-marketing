// check:assets — the SEO C3 asset tranche fence (10/29/2026). Exit 1 on any violation.
//   node scripts/seo/check-assets.mjs
//
// What it holds (each line names the regression it catches):
//   math       tools/tools.js money is integer cents and dates are MM/DD/YYYY: the file is loaded in a vm
//              sandbox and its pure functions are run on cases where a float or an ISO date would differ
//   tools      every tool page mounts its widget, loads /tools/tools.js, and its embed code points at
//              /tools/embed/<slug> with a credit link to the tool page OUTSIDE the iframe; the embed page
//              exists, is robots noindex, mounts the same widget and links back
//   framing    vercel.json lets ONLY /tools/embed/* be framed: the DENY rule's lookahead excludes exactly
//              tools/embed/ (beyond its own how-to/refer/_next), and the embed rule carries frame-ancestors *
//              plus X-Robots-Tag noindex, while no other header rule allows framing
//   templates  each template page links its .docx and .pdf; the files exist; the page, the content source,
//              the docx text and the pdf text (pdftotext, when installed) carry the disclaimer; the manifest's
//              source hash equals the current content (an edit without `npm run build:templates` fails), the
//              file hashes match the manifest, the docx re-renders byte-identical, and the page preview equals
//              the re-render
//   tutorials  every tutorials/*.html whose video is not public in video-catalog.json is robots noindex and
//              absent from llms.txt and sitemap.xml; no public one is noindex
//   pricing    pricing.html carries the approved no-number line, visibly and in its FAQPage JSON-LD
// Every region asserts it read something (an empty region would pass every check).
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import vm from "node:vm";
import { TEMPLATES, DISCLAIMER } from "../templates/content.mjs";
import { renderPreview, renderDocx, sourceHash, sha256, unzipEntry, MARK_A, MARK_B } from "../build-templates.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const fails = [];
const fail = (m) => fails.push(m);
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");
const ORIGIN = "https://shelfspace.pro";
const PRICE_LINE = "Flat monthly price based on your brand's size, month-to-month, no contract.";
const TOOLS = [
  { slug: "dso-calculator", tool: "dso" },
  { slug: "late-ar-cost-calculator", tool: "late-ar" },
  { slug: "net-terms-policy-builder", tool: "net-terms" },
];
const robotsNoindex = (html) => /<meta\s+name="robots"\s+content="[^"]*noindex[^"]*"\s*\/?>/i.test(html.replace(/<!--[\s\S]*?-->/g, ""));

// ---------- math ----------
let T = null;
try {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(read("tools/tools.js"), ctx, { filename: "tools/tools.js" });
  T = ctx.SSTools;
} catch (e) { fail(`math: tools/tools.js did not load in a sandbox (${e.message})`); }
if (!T) fail("math: window.SSTools missing — the math region read nothing");
else {
  const eq = (name, got, want) => { if (JSON.stringify(got) !== JSON.stringify(want)) fail(`math: ${name} = ${JSON.stringify(got)}, want ${JSON.stringify(want)}`); };
  eq('parseCents("$1,234.56")', T.parseCents("$1,234.56"), 123456);
  eq('parseCents("0.1")+parseCents("0.2")', T.parseCents("0.1") + T.parseCents("0.2"), 30);
  eq('parseCents("19.99")', T.parseCents("19.99"), 1999); // float: 19.99*100 = 1998.9999999999998
  eq('parseCents("1.005")', T.parseCents("1.005"), null);
  eq('parseCents("-5")', T.parseCents("-5"), null);
  eq("fmtCents(123456)", T.fmtCents(123456), "$1,234.56");
  eq("fmtCents(5)", T.fmtCents(5), "$0.05");
  eq("dso(180000.00 AR, 270000.00 sales, 90d, net 30)", T.dso(18000000, 27000000, 90, 30), { dsoTenths: 600, pastTermsCents: 9000000 });
  eq("dso(1000.00, 3000.00, 30d)", T.dso(100000, 300000, 30, null), { dsoTenths: 100, pastTermsCents: null });
  eq("dso(sales 0)", T.dso(100, 0, 30, null), null);
  // 720000c x 1200bps x 45d / 3,650,000 = 10652.05 -> 10652 (one rounding, whole cents)
  eq("lateCost($7,200 @12% 45d, 3.0h @ $35)", T.lateCost(720000, 1200, 45, 30, 3500), { carryingCents: 10652, chasingCents: 10500, totalCents: 21152 });
  // 1999c x 1999bps x 1d / 3,650,000 = 1.0948 -> 1 (cent-exact half-up)
  eq("lateCost(19.99 @19.99% 1d)", T.lateCost(1999, 1999, 1, 0, 0), { carryingCents: 1, chasingCents: 0, totalCents: 1 });
  // past-terms cash from the UNROUNDED DSO: (100000 x 7 - 2 x 300000) / 7 = 14285.71 -> 14286 (the rounded DSO
  // of 2.3 days would give 12857)
  eq("dso(1000.00, 3000.00, 7d, net 2)", T.dso(100000, 300000, 7, 2), { dsoTenths: 23, pastTermsCents: 14286 });
  // a product past 2^53: Math.round(a * b * d / 3650000) in plain Numbers gives 109167157640; exact is ...639
  eq("lateCost(970,122,414.15 @36.87% 1114d)", T.lateCost(97012241415, 3687, 1114, 0, 0).carryingCents, 109167157639);
  eq('parseCents("1000000000")', T.parseCents("1000000000"), null);
  eq('parseBps("12.5")', T.parseBps("12.5"), 1250);
  eq('parseTenths("2.5")', T.parseTenths("2.5"), 25);
  const d = T.parseMDY("3/2/2026");
  eq('fmtMDY(parseMDY("3/2/2026"))', d && T.fmtMDY(d), "03/02/2026");
  eq('parseMDY("2026-03-02")', T.parseMDY("2026-03-02"), null);
  eq('parseMDY("02/30/2026")', T.parseMDY("02/30/2026"), null);
  eq("daysLate(09/01/2026 -> 10/16/2026)", T.daysLate(T.parseMDY("09/01/2026"), T.parseMDY("10/16/2026")), 45);
  eq("daysLate(future due)", T.daysLate(T.parseMDY("12/01/2026"), T.parseMDY("10/16/2026")), 0);
  const pol = T.buildPolicy({ company: "Acme", termsDays: 30, limitCents: 2500000, requireApplication: true, requireGuaranty: false, codOrders: 1, holdDays: 15, methods: ["e-check"], reminders: "R.", effective: "10/29/2026" });
  if (!pol.includes("Effective 10/29/2026") || !pol.includes("$25,000.00")) fail("math: buildPolicy lost the MM/DD/YYYY effective date or the cents-formatted limit");
  if (!pol.trim().endsWith(DISCLAIMER)) fail("math: buildPolicy output no longer ends with the disclaimer");
  if (/\d{4}-\d{2}-\d{2}/.test(pol)) fail("math: buildPolicy output contains an ISO date");
  const cod = T.buildPolicy({ company: "Acme", termsDays: 0, limitCents: null, requireApplication: true, requireGuaranty: true, codOrders: 1, holdDays: 15, methods: [], reminders: "R.", effective: "10/29/2026" });
  if (/extend terms|credit application|guaranty|days past due/.test(cod)) fail("math: a cash-on-delivery policy still talks about credit terms");
  if (/toISOString|toLocaleDateString/.test(read("tools/tools.js"))) fail("math: tools/tools.js formats a date with toISOString/toLocaleDateString (use fmtMDY)");
}

// ---------- tools ----------
let toolsRead = 0;
for (const { slug, tool } of TOOLS) {
  const rel = `tools/${slug}.html`, erel = `tools/embed/${slug}.html`;
  if (!existsSync(join(ROOT, rel))) { fail(`tools: ${rel} missing`); continue; }
  toolsRead++;
  const html = read(rel);
  if (robotsNoindex(html)) fail(`tools: ${rel} is noindex (the tool page must be indexable)`);
  if (!html.includes(`data-ss-tool="${tool}"`)) fail(`tools: ${rel} does not mount data-ss-tool="${tool}"`);
  if (!/<script src="\/tools\/tools\.js" defer><\/script>/.test(html)) fail(`tools: ${rel} does not load /tools/tools.js`);
  const ta = (html.match(/<textarea id="embed-code" readonly>([\s\S]*?)<\/textarea>/) || [])[1];
  if (!ta) { fail(`tools: ${rel} has no embed code textarea`); }
  else {
    const code = ta.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
    const iframeEnd = code.indexOf("</iframe>");
    if (!code.includes(`<iframe src="${ORIGIN}/tools/embed/${slug}"`) || iframeEnd < 0) fail(`tools: ${rel} embed code does not frame ${ORIGIN}/tools/embed/${slug}`);
    else if (!code.slice(iframeEnd).includes(`<a href="${ORIGIN}/tools/${slug}">`)) fail(`tools: ${rel} embed code has no credit link to ${ORIGIN}/tools/${slug} after the iframe`);
  }
  if (!existsSync(join(ROOT, erel))) { fail(`tools: ${erel} missing`); continue; }
  const eh = read(erel);
  if (!robotsNoindex(eh)) fail(`tools: ${erel} is not robots noindex`);
  if (!eh.includes(`data-ss-tool="${tool}"`)) fail(`tools: ${erel} does not mount data-ss-tool="${tool}"`);
  if (!eh.includes(`href="${ORIGIN}/tools/${slug}"`)) fail(`tools: ${erel} does not link back to the tool page`);
  if (!/<script src="\/tools\/tools\.js" defer><\/script>/.test(eh)) fail(`tools: ${erel} does not load /tools/tools.js`);
}
if (toolsRead !== TOOLS.length) fail(`tools: read ${toolsRead} of ${TOOLS.length} tool pages`);

// ---------- framing ----------
{
  const v = JSON.parse(read("vercel.json"));
  const rules = v.headers || [];
  const val = (r, k) => ((r.headers || []).find((x) => x.key.toLowerCase() === k.toLowerCase()) || {}).value;
  const deny = rules.filter((r) => /deny/i.test(val(r, "X-Frame-Options") || ""));
  if (deny.length !== 1) fail(`framing: expected exactly one X-Frame-Options DENY rule, found ${deny.length}`);
  else if (deny[0].source !== "/((?!how-to|refer$|refer/|_next|tools/embed/).*)") fail(`framing: the DENY rule's source changed (${deny[0].source}); only tools/embed/ may be added to its exclusions`);
  const embed = rules.filter((r) => r.source === "/tools/embed/(.*)");
  if (embed.length !== 1) fail("framing: no /tools/embed/(.*) header rule");
  else {
    if (!/frame-ancestors \*(;|$)/.test(val(embed[0], "Content-Security-Policy") || "")) fail("framing: the embed rule's CSP lacks frame-ancestors *");
    if (!/noindex/i.test(val(embed[0], "X-Robots-Tag") || "")) fail("framing: the embed rule lacks X-Robots-Tag noindex");
    if (val(embed[0], "X-Frame-Options")) fail("framing: the embed rule sets X-Frame-Options (it would block the embed)");
  }
  for (const r of rules) if (r.source !== "/tools/embed/(.*)" && /frame-ancestors (?!'none')/.test(val(r, "Content-Security-Policy") || "")) fail(`framing: ${r.source} allows framing`);
}

// ---------- templates ----------
let manifest = {};
try { manifest = JSON.parse(read("templates/files/manifest.json")); } catch { fail("templates: templates/files/manifest.json missing or unreadable"); }
let haveText = true;
try { execFileSync("pdftotext", ["-v"], { stdio: "ignore" }); } catch { haveText = false; }
let tplRead = 0;
const DISC_RX = [/not legal advice/i, /have your counsel review/i];
for (const t of TEMPLATES) {
  const rel = `templates/${t.slug}.html`, docx = `templates/files/${t.slug}.docx`, pdf = `templates/files/${t.slug}.pdf`;
  if (!existsSync(join(ROOT, rel))) { fail(`templates: ${rel} missing`); continue; }
  tplRead++;
  const html = read(rel);
  for (const f of [docx, pdf]) {
    if (!html.includes(`href="/${f}"`)) fail(`templates: ${rel} does not link /${f}`);
    if (!existsSync(join(ROOT, f))) fail(`templates: ${f} missing`);
  }
  if (robotsNoindex(html)) fail(`templates: ${rel} is noindex`);
  const src = JSON.stringify(t.blocks) + DISCLAIMER;
  for (const rx of DISC_RX) {
    if (!rx.test(html.replace(/<[^>]+>/g, " "))) fail(`templates: ${rel} lost the disclaimer (${rx.source})`);
    if (!t.blocks.some((b) => b.t === "disc") || !rx.test(src)) fail(`templates: content source for ${t.slug} lost the disclaimer (${rx.source})`);
  }
  const m = manifest[t.slug];
  if (!m) { fail(`templates: manifest has no entry for ${t.slug} (run npm run build:templates)`); continue; }
  let built;
  try { built = renderDocx(t); } catch (e) { fail(`templates: ${t.slug} does not render (${e.message})`); continue; }
  if (m.source_sha256 !== sourceHash(t)) fail(`templates: ${t.slug} content changed since the files were built (run npm run build:templates)`);
  if (existsSync(join(ROOT, docx))) {
    const bytes = readFileSync(join(ROOT, docx));
    if (sha256(bytes) !== m.docx_sha256) fail(`templates: ${docx} does not match the manifest`);
    if (!bytes.equals(built)) fail(`templates: ${docx} is not the current render of its content`);
    const xml = unzipEntry(bytes, "word/document.xml") || "";
    const text = xml.replace(/<[^>]+>/g, "");
    for (const rx of DISC_RX) if (!rx.test(text)) fail(`templates: ${docx} lost the disclaimer (${rx.source})`);
  }
  if (existsSync(join(ROOT, pdf))) {
    const bytes = readFileSync(join(ROOT, pdf));
    if (bytes.slice(0, 5).toString() !== "%PDF-") fail(`templates: ${pdf} is not a PDF`);
    if (sha256(bytes) !== m.pdf_sha256) fail(`templates: ${pdf} does not match the manifest`);
    if (haveText) {
      const text = execFileSync("pdftotext", [join(ROOT, pdf), "-"], { encoding: "utf8" }).replace(/\s+/g, " ");
      for (const rx of DISC_RX) if (!rx.test(text)) fail(`templates: ${pdf} text lost the disclaimer (${rx.source})`);
      if (!text.includes(t.title)) fail(`templates: ${pdf} text lacks its title "${t.title}"`);
    }
  }
  const a = html.indexOf(MARK_A), b = html.indexOf(MARK_B);
  if (a < 0 || b < a) fail(`templates: ${rel} has no preview region`);
  else if (html.slice(a, b + MARK_B.length) !== renderPreview(t)) fail(`templates: ${rel} preview is not the current render (run npm run build:templates)`);
}
if (tplRead !== TEMPLATES.length || TEMPLATES.length < 4) fail(`templates: read ${tplRead} of ${TEMPLATES.length} template pages (need 4)`);

// ---------- tutorials ----------
{
  const cat = JSON.parse(read("video-catalog.json"));
  const pub = new Set(cat.videos.filter((v) => v.privacy === "public").map((v) => v.slug));
  const llms = read("llms.txt"), sitemap = read("sitemap.xml");
  let unlisted = 0, listed = 0;
  for (const f of readdirSync(join(ROOT, "tutorials")).filter((x) => x.endsWith(".html"))) {
    const slug = f.replace(/\.html$/, ""), html = read(`tutorials/${f}`);
    const url = `${ORIGIN}/tutorials/${slug}`;
    if (pub.has(slug)) { listed++; if (robotsNoindex(html)) fail(`tutorials: public ${f} is noindex`); continue; }
    unlisted++;
    if (!robotsNoindex(html)) fail(`tutorials: unlisted ${f} is not robots noindex`);
    if (new RegExp(url.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&") + "(?![\\w-])").test(llms)) fail(`tutorials: unlisted ${slug} is listed in llms.txt`);
    if (sitemap.includes(`<loc>${url}</loc>`)) fail(`tutorials: unlisted ${slug} is in sitemap.xml`);
  }
  if (unlisted < 1 || listed < 1) fail(`tutorials: region empty (${listed} public, ${unlisted} unlisted pages read)`);
}

// ---------- pricing ----------
{
  const html = read("pricing.html");
  const visible = html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, "").replace(/&#39;/g, "'");
  if (!visible.includes(PRICE_LINE)) fail("pricing: pricing.html no longer shows the approved line visibly");
  const lds = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  if (!lds.some((j) => j.includes(PRICE_LINE.replace(/'/g, "'")))) fail("pricing: pricing.html FAQPage JSON-LD lacks the approved line");
}

if (fails.length) {
  console.log(`🔴 check:assets — ${fails.length} problem(s):`);
  for (const f of fails) console.log("   " + f);
  process.exit(1);
}
console.log(`✅ check:assets clean — tool math, ${TOOLS.length} tools + embeds, framing, ${TEMPLATES.length} templates (pdf text ${haveText ? "checked" : "skipped: no pdftotext"}), tutorials noindex, pricing line.`);
