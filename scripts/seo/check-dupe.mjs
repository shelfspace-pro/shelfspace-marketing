// check:dupe — no page may be a near-copy of another page (SEO engine row C2).
//   node scripts/seo/check-dupe.mjs                    self-test, then compare every pair of indexable pages
//   node scripts/seo/check-dupe.mjs --root <dir> [--json] [--top N]   another tree / dump / show the N closest pairs
//   node scripts/seo/check-dupe.mjs --write-baseline   SHRINK the baseline: drop pairs that fell under the bar, lower
//                                                       recorded overlaps (never adds a pair, never raises one)
//
// Method: each page's text -> lower-case words -> the SET of 5-word shingles. overlap(A, B) = |A ∩ B| / min(|A|, |B|)
// (how much of the smaller page is in the larger one), so a name-swapped copy of a page scores near 1.
// A pair at or over THRESHOLD (0.60) fails.
//
// Chrome is not content: nav, header, footer, script, style, svg, noscript, template, the shared CTA band and
// the call bar are removed before shingling, and so is every shingle that appears on CHROME_SHARE (20%) or more
// of all pages (the "Schedule a call · 30 minutes with Chris" card, the tutorial link line). A name-swapped copy
// shares its text with ONE page, so this never hides a copy.
//
// Template families (pages generated from one template, e.g. tutorials from scripts/build-tutorials.mjs) are
// baselined as a FAMILY in check-dupe-baseline.json: a pair with both pages in the same family is not compared.
// A family is never a way to lower the bar for hand-written pages; everything outside one is held to 0.60.
//
// Violation codes: dupe (a pair over the bar), dupe-grew (a baselined pair got closer), baseline-stale (a baselined
// pair fell under the bar or a page is gone: run --write-baseline), baseline-grew (a pair the committed baseline
// never had), family-empty (a family glob that matches no page).
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM, VirtualConsole } from "jsdom";
import { ROOT, siteIndex } from "./build-sitemap.mjs";
import { committedBaselineOf } from "./check-claims.mjs";

export const THRESHOLD = 0.6;
export const SHINGLE = 5;
export const CHROME_SHARE = 0.2;
const CHROME_SEL = "nav, header, footer, script, style, noscript, svg, template, .cta-section, .nav-call-bar";
const BASELINE_REL = "scripts/seo/check-dupe-baseline.json";
const GROW_TOLERANCE = 0.02; // a grandfathered pair may wobble this much from small edits

const silent = new VirtualConsole();

export function pageWords(html) {
  const doc = new JSDOM(html, { virtualConsole: silent }).window.document;
  for (const el of doc.body?.querySelectorAll(CHROME_SEL) || []) el.remove();
  // Block elements end a phrase: "<li>Pay</li><li>Now</li>" is not the word "PayNow".
  for (const el of doc.body?.querySelectorAll("p, li, div, h1, h2, h3, h4, h5, h6, td, th, dt, dd, br, section, article") || []) el.append(" ");
  return (doc.body?.textContent || "").toLowerCase().replace(/[’']/g, "").match(/[a-z0-9$%]+/g) || [];
}

export function shingles(words, n = SHINGLE) {
  const s = new Set();
  for (let i = 0; i + n <= words.length; i++) s.add(words.slice(i, i + n).join(" "));
  return s;
}

const globRe = (g) => new RegExp("^" + g.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*") + "$");
export const familyOf = (families, file) => (families || []).find((f) => (f.members || []).some((g) => globRe(g).test(file)));

/** Pure: pages = [{ file, html }] -> every pair at or over `floor`, sorted closest first. */
export function pairs(pages, { floor = THRESHOLD, families = [] } = {}) {
  const sets = pages.map((p) => ({ file: p.file, set: shingles(pageWords(p.html)) }));
  const df = new Map();
  for (const { set } of sets) for (const x of set) df.set(x, (df.get(x) || 0) + 1);
  const cut = Math.max(3, Math.ceil(sets.length * CHROME_SHARE)); // never strip a shingle only 2 pages share
  for (const s of sets) for (const x of [...s.set]) if (df.get(x) >= cut) s.set.delete(x);
  const index = new Map();
  sets.forEach((s, i) => { for (const x of s.set) (index.get(x) || index.set(x, []).get(x)).push(i); });
  const out = [];
  for (let i = 0; i < sets.length; i++) {
    const shared = new Map();
    for (const x of sets[i].set) for (const j of index.get(x)) if (j > i) shared.set(j, (shared.get(j) || 0) + 1);
    for (const [j, c] of shared) {
      const min = Math.min(sets[i].set.size, sets[j].set.size);
      if (!min) continue;
      const overlap = c / min;
      if (overlap < floor) continue;
      const fa = familyOf(families, sets[i].file), fb = familyOf(families, sets[j].file);
      if (fa && fa === fb) continue;
      const [a, b] = [sets[i].file, sets[j].file].sort();
      out.push({ a, b, overlap: Math.round(overlap * 1000) / 1000, shared: c, sizes: [sets[i].set.size, sets[j].set.size] });
    }
  }
  return out.sort((x, y) => y.overlap - x.overlap);
}

export function evaluate({ pages, baseline, committedBaseline }) {
  const v = [];
  const families = baseline?.families || [];
  for (const f of families) if (!pages.some((p) => (f.members || []).some((g) => globRe(g).test(p.file)))) v.push({ code: "family-empty", detail: `family "${f.name}" matches no page` });
  const key = (p) => `${p.a}|${p.b}`;
  const base = new Map((baseline?.pairs || []).map((p) => [key(p), p]));
  if (committedBaseline) {
    // A family may shrink (drop a member glob) but never appear or gain a glob.
    for (const f of families) {
      const within = (c) => (c.families || []).some((g) => g.name === f.name && (f.members || []).every((m) => (g.members || []).includes(m)));
      if ([].concat(committedBaseline).some((c) => !within(c))) {
        v.push({ code: "baseline-grew", detail: `family "${f.name}" (${(f.members || []).join(", ")}) is new or widened: a family is never added to let a page through` });
      }
    }
  }
  const committedSets = committedBaseline ? [].concat(committedBaseline).map((c) => new Set((c.pairs || []).map(key))) : null;
  const found = pairs(pages, { families });
  const now = new Map(found.map((p) => [key(p), p]));
  for (const p of found) {
    const b = base.get(key(p));
    if (!b) v.push({ code: "dupe", detail: `${p.a} <-> ${p.b}: ${(p.overlap * 100).toFixed(1)}% of 5-word phrases shared (bar ${THRESHOLD * 100}%)` });
    else if (p.overlap > b.overlap + GROW_TOLERANCE) v.push({ code: "dupe-grew", detail: `${p.a} <-> ${p.b}: ${(p.overlap * 100).toFixed(1)}%, baselined at ${(b.overlap * 100).toFixed(1)}%` });
  }
  for (const [k, b] of base) {
    if (!now.has(k)) v.push({ code: "baseline-stale", detail: `${b.a} <-> ${b.b} is under the bar now (or gone): run --write-baseline` });
    if (committedSets && committedSets.some((c) => !c.has(k))) v.push({ code: "baseline-grew", detail: `${b.a} <-> ${b.b} is not in the committed baseline: pairs are never added` });
  }
  return { violations: v, found };
}

// ---------- self-test ----------
const LOREM = [
  "Cannabis brands lose weeks every month waiting on dispensaries that pay late and never say when.",
  "A clear reminder schedule, sent in the brand's own name, gets most stores to pay without a phone call.",
  "When a store asks for more time, a written payment plan with dates beats a promise made at the counter.",
  "Every reminder links the invoice and a way to pay it, so the buyer never has to hunt for the amount.",
  "Reps stop being the bad guy because the follow-up comes from the back office, on a steady schedule.",
  "The aging report shows which stores are slipping before an invoice ever reaches ninety days past due.",
];
const OTHER = [
  "Washington requires that licensees settle wholesale invoices within a fixed number of days after delivery.",
  "The state board can suspend a license when a retailer repeatedly misses its statutory payment deadline.",
  "Producers keep delivery receipts because the clock starts on the day the manifest is accepted at the store.",
  "Distributors in the state report that most disputes start with a missing credit memo, not a missing payment.",
  "Counsel should review any payment term that sits outside the statute, because the rule overrides contracts.",
  "A grower that ships on consignment still needs a written agreement that names who owns the unsold goods.",
];
const doc = (paras, extra = "") => `<!doctype html><html><body><nav><a href="/">Home</a></nav><main>${paras.map((p) => `<p>${p}</p>`).join("")}${extra}</main><footer>ShelfSpace footer text that every page shares word for word</footer></body></html>`;
const swap = (paras, from, to) => paras.map((p) => p.replaceAll(from, to));
const PROMO = `<div class="promo"><p>${OTHER.slice(1).join(" ")}</p></div>`;
const FILLER = Array.from({ length: 8 }, (_, i) => ({ file: `filler-${i}.html`, html: doc([`Filler page ${i} talks about topic ${i * 7} in words no other filler page uses, ${"alpha beta gamma delta".split(" ")[i % 4]} number ${i}.`]) }));
export const SELF_TESTS = [
  { name: "a name-swapped copy fails", pages: [{ file: "blog/a.html", html: doc(LOREM) }, { file: "blog/b.html", html: doc(swap(LOREM, "Cannabis brands", "Hemp growers").map((p) => p.replaceAll("dispensaries", "shops"))) }], expect: ["dupe"] },
  { name: "two different pages pass", pages: [{ file: "blog/a.html", html: doc(LOREM) }, { file: "blog/c.html", html: doc(OTHER) }], expect: [] },
  { name: "shared nav/footer/CTA chrome alone is not a copy", pages: [{ file: "blog/a.html", html: doc(LOREM, `<section class="cta-section"><p>${OTHER.join(" ")}</p></section>`) }, { file: "blog/c.html", html: doc(OTHER.slice(0, 1).map((p) => p.replace("Washington", "Oregon")), `<section class="cta-section"><p>${OTHER.join(" ")}</p></section>`) }], expect: [] },
  { name: "text most pages share outside any chrome selector (document-frequency chrome) is not a copy", pages: [{ file: "blog/a.html", html: doc([LOREM[0]], PROMO) }, { file: "blog/c.html", html: doc([OTHER[0]], PROMO) }], fillerExtra: PROMO, expect: [] },
  { name: "a pair inside one template family is not compared", families: [{ name: "t", members: ["tutorials/*.html"] }], pages: [{ file: "tutorials/a.html", html: doc(LOREM) }, { file: "tutorials/b.html", html: doc(swap(LOREM, "Cannabis brands", "Hemp growers")) }], expect: [] },
  { name: "a family never covers a copy outside it", families: [{ name: "t", members: ["tutorials/*.html"] }], pages: [{ file: "tutorials/a.html", html: doc(LOREM) }, { file: "blog/b.html", html: doc(swap(LOREM, "Cannabis brands", "Hemp growers")) }], expect: ["dupe"] },
  { name: "a baselined pair passes", pages: [{ file: "blog/a.html", html: doc(LOREM) }, { file: "blog/b.html", html: doc(swap(LOREM, "Cannabis brands", "Hemp growers")) }], baselineFromSelf: true, expect: [] },
  { name: "a baselined pair that fell under the bar is stale (ratchet)", pages: [{ file: "blog/a.html", html: doc(LOREM) }, { file: "blog/b.html", html: doc(OTHER) }], baseline: { pairs: [{ a: "blog/a.html", b: "blog/b.html", overlap: 0.9 }] }, expect: ["baseline-stale"] },
  { name: "a baselined pair that got closer fails", pages: [{ file: "blog/a.html", html: doc(LOREM) }, { file: "blog/b.html", html: doc(LOREM) }], baseline: { pairs: [{ a: "blog/a.html", b: "blog/b.html", overlap: 0.7 }] }, expect: ["dupe-grew"] },
  { name: "a hand-added baseline pair fails", pages: [{ file: "blog/a.html", html: doc(LOREM) }, { file: "blog/b.html", html: doc(LOREM) }], baseline: { pairs: [{ a: "blog/a.html", b: "blog/b.html", overlap: 1 }] }, committed: { pairs: [] }, expect: ["baseline-grew"] },
  { name: "a hand-added or widened family fails", pages: [{ file: "blog/a.html", html: doc(LOREM) }, { file: "blog/b.html", html: doc(swap(LOREM, "Cannabis brands", "Hemp growers")) }], families: [{ name: "t", members: ["blog/*.html"] }], committed: { families: [{ name: "t", members: ["tutorials/*.html"] }], pairs: [] }, expect: ["baseline-grew"] },
  { name: "a narrowed family passes", pages: [{ file: "tutorials/a.html", html: doc(LOREM) }, { file: "blog/c.html", html: doc(OTHER) }], families: [{ name: "t", members: ["tutorials/*.html"] }], committed: { families: [{ name: "t", members: ["tutorials.html", "tutorials/*.html"] }], pairs: [] }, expect: [] },
  { name: "an empty family fails", families: [{ name: "gone", members: ["nowhere/*.html"] }], pages: [{ file: "blog/a.html", html: doc(LOREM) }], expect: ["family-empty"] },
];

export function selfTest() {
  const fails = [];
  for (const t of SELF_TESTS) {
    const pages = [...t.pages, ...FILLER.map((f) => (t.fillerExtra ? { ...f, html: f.html.replace("</main>", `${t.fillerExtra}</main>`) } : f))];
    let baseline = { families: t.families || [], pairs: (t.baseline || {}).pairs || [] };
    if (t.baselineFromSelf) baseline.pairs = pairs(pages, { families: baseline.families }).map(({ a, b, overlap }) => ({ a, b, overlap }));
    const { violations } = evaluate({ pages, baseline, committedBaseline: t.committed || baseline });
    const got = [...new Set(violations.map((x) => x.code))].sort();
    const want = [...t.expect].sort();
    if (JSON.stringify(got) !== JSON.stringify(want)) fails.push(`${t.name}: expected [${want}] got [${got}]`);
  }
  // The bar itself: an exact copy scores 1, a disjoint page 0.
  const p = pairs([{ file: "x.html", html: doc(LOREM) }, { file: "y.html", html: doc(LOREM) }, ...FILLER], { floor: 0 });
  if (!p.length || p[0].overlap !== 1) fails.push("an exact copy does not score 1.0");
  return fails;
}

const committedOf = (root) => committedBaselineOf(root, BASELINE_REL); // HEAD, HEAD~1, origin/main, SEO_BASELINE_REF

function main() {
  const args = process.argv.slice(2);
  const root = args.includes("--root") ? resolve(args[args.indexOf("--root") + 1]) : ROOT;
  const fails = selfTest();
  if (fails.length) { console.error(`check:dupe SELF-TEST FAILED (${fails.length}):\n  ` + fails.join("\n  ")); process.exitCode = 1; return; }
  const pages = siteIndex(root).indexablePages({ extras: false }).filter((p) => p.file).map((p) => ({ file: p.file, html: readFileSync(join(root, p.file), "utf8") }));
  const file = join(root, BASELINE_REL);
  const baseline = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : { families: [], pairs: [] };
  if (args.includes("--top")) {
    const n = +args[args.indexOf("--top") + 1] || 10;
    for (const p of pairs(pages, { floor: 0, families: baseline.families }).slice(0, n)) console.log(`${(p.overlap * 100).toFixed(1)}%  ${p.a}  ${p.b}`);
    return;
  }
  const committed = committedOf(root);
  if (!existsSync(file) && committed) { console.error(`check:dupe FAILED: baseline-deleted  ${BASELINE_REL} is gone but committed copies exist`); process.exitCode = 1; return; }
  const { violations, found } = evaluate({ pages, baseline, committedBaseline: committed });
  if (args.includes("--write-baseline")) {
    const now = new Map(found.map((p) => [`${p.a}|${p.b}`, p]));
    const kept = (baseline.pairs || []).filter((b) => now.has(`${b.a}|${b.b}`)).map((b) => ({ ...b, overlap: Math.min(b.overlap, now.get(`${b.a}|${b.b}`).overlap) }));
    writeFileSync(file, JSON.stringify({ ...baseline, pairs: kept }, null, 1) + "\n");
    console.log(`check:dupe: baseline pairs ${(baseline.pairs || []).length} -> ${kept.length} (never grows)`);
    return;
  }
  if (args.includes("--json")) console.log(JSON.stringify(violations, null, 1));
  if (violations.length) {
    console.error(`check:dupe FAILED: ${violations.length} violation(s)`);
    for (const x of violations) console.error(`  ${x.code}  ${x.detail}`);
    process.exitCode = 1;
    return;
  }
  const closest = pairs(pages, { floor: 0, families: baseline.families })[0];
  console.log(`check:dupe: OK — ${SELF_TESTS.length} self-tests, ${pages.length} pages, ${(baseline.families || []).length} template families, ${(baseline.pairs || []).length} baselined pairs; closest pair ${closest ? `${(closest.overlap * 100).toFixed(1)}% (${closest.a} / ${closest.b})` : "none"}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main();
