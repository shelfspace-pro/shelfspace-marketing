// check:claims — every figure on a page must come from the public claims registry (SEO engine row C2).
//   node scripts/seo/check-claims.mjs                    self-test, then scan the site (exit 1 on any violation)
//   node scripts/seo/check-claims.mjs --json             also print every violation as JSON
//   node scripts/seo/check-claims.mjs --root <dir>       scan another tree
//   node scripts/seo/check-claims.mjs --write-baseline   SHRINK the baseline: drop entries no longer needed (never adds)
//   node scripts/seo/check-claims.mjs --seed-baseline    one-time: write the baseline when the file does not exist yet
//
// SCOPE (where figures are held to the registry): on any indexable page, the `.article-body` plus the
// case-study result lists (`.stats-strip`, a `.stat-trio` outside the body) and the "at a glance" box
// (`.article-glance`). Decision Z-B1a (10/29/2026): widen to those regions; no page moves.
//
// A figure is every match of B1's CLAIM_RE ($, %, a number with a unit, net-N, 1,000-grouped numbers),
// read by the extractor vendored verbatim from B1's scraper (claims-extract.mjs), so the gate
// and the private list never disagree about what a figure is.
//
// Violation codes:
//   unregistered     a figure in scope that is neither in marketing/seo-claims.json (same value, page listed AND
//                    the same published sentence) nor grandfathered in check-claims-baseline.json
//   source-missing   a registered figure whose page no longer links any of the entry's source_urls INSIDE the
//                    scoped regions (a footer/nav link does not count)
//   no-scope         a blog page with no scoped region at all (its figures would be read by nothing)
//   registry-stale   a registry entry whose value no longer appears in scope on one of its pages
//   registry-schema  a malformed registry entry (unknown key, no source, non-https or own-domain source, …)
//   baseline-stale   a grandfathered figure that is gone, changed or now registered: run --write-baseline
//                    (the ratchet: a fixed entry leaves the baseline and can never come back unnoticed)
//   baseline-grew    the baseline holds an entry some committed copy lacks (HEAD, HEAD~1, origin/main, and in CI
//                    the pre-push main): hand-added or re-seeded entries
//   baseline-deleted the baseline file is gone while committed copies exist (--seed-baseline also refuses once the
//                    file has ever been committed)
//   shelfspace-price no dollar price for ShelfSpace (10/29/2026). DEFAULT-DENY over every served page's visible
//                    text, title, meta, JSON-LD and microdata outside a trial-ok region: any price-SHAPED $ figure
//                    fails unless grandfathered (baseline `prices`) or inside data-price-note="competitor|customer|
//                    example|market|calculator"; a named ShelfSpace price fails even there. See the section below.
//   vendored-drift   the vendored extractor block no longer hashes to its pin
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { JSDOM, VirtualConsole } from "jsdom";
import { ROOT, siteIndex } from "./build-sitemap.mjs";
import {
  VENDORED_SHA256, vendoredBlockHash, STRIP_SEL, BARE_NUMBER, isOutbound, norm, normValue, claimId, textUnits, sentenceBounds, scanRegions, pageUrlFor,
} from "./claims-extract.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
export const SCOPE_SEL = ".article-body, .article-glance, .stats-strip, .stat-trio";
const REGISTRY_REL = "marketing/seo-claims.json";
const BASELINE_REL = "scripts/seo/check-claims-baseline.json";
const FORBIDDEN_SH = "marketing/scripts/check-docs-forbidden.sh";
const ENTRY_KEYS = new Set(["id", "value", "claim", "pages", "source_urls", "first_party", "basis", "as_of"]);

const silent = new VirtualConsole(); // jsdom's CSS parser logs every modern stylesheet; nothing here reads CSS
export const parse = (html) => new JSDOM(html, { virtualConsole: silent }).window.document;

// ---------- scope ----------
/** The outermost scoped regions of a page (a .stat-trio inside .article-body is read once, with the body). */
export function regionsOf(doc) {
  return [...doc.querySelectorAll(SCOPE_SEL)].filter((el) => !el.parentElement?.closest(SCOPE_SEL));
}

/**
 * Stat cards built from <div>s ("<div class=stats-strip-num>195</div><div class=stats-strip-label>Reminders
 * sent</div>") read as one figure with its label, the way B1 already reads the <p> stat cards of .stat-trio:
 * the number and its label become <p>s before the vendored extractor sees them. Without this a bare "195"
 * matches no CLAIM_RE alternative and the case-study result strip (Z-B1a) would hold nothing.
 */
function pairStatCards(doc, region) {
  const cards = [];
  for (const num of [...region.querySelectorAll('[class*="-num"]')]) {
    const label = num.nextElementSibling;
    if (!label || !/-label\b/.test(label.className || "")) continue;
    cards.push({ num: norm(num.textContent || ""), label: norm(label.textContent || "") });
    if (num.tagName === "P") continue;
    for (const el of [num, label]) {
      const p = doc.createElement("p");
      p.className = el.className;
      while (el.firstChild) p.appendChild(el.firstChild);
      el.replaceWith(p);
    }
  }
  return cards;
}

/** Figures in scope on one page. B1 looks for a page's "Sources" heading in the article body. */
export function scopedClaims(html, rel) {
  const doc = parse(html);
  const regions = regionsOf(doc);
  if (!regions.length) return { claims: [], links: new Set(), page: pageUrlFor(rel) };
  const cards = regions.flatMap((r) => pairStatCards(doc, r));
  const { claims, page } = scanRegions(regions, rel, doc.querySelector(".article-body") || doc);
  // A stat card's number IS a figure even when B1's CLAIM_RE finds none in it ("195" + "Reminders sent":
  // units are lower-case in CLAIM_RE). Read it as number + label, the same snippet B1 would build.
  for (const { num, label } of cards) {
    if (!BARE_NUMBER.test(num)) continue;
    const snippet = `${num} ${label}`.trim();
    if (claims.some((c) => c.text_snippet.startsWith(snippet) || (c.text_snippet.startsWith(num + " ") && snippet.startsWith(c.value)))) continue;
    const value = normValue(num);
    claims.push({ id: claimId(rel, value, snippet), value, page, text_snippet: snippet, status: "uncited", citation_scope: null, source_url: null });
  }
  // A source counts only when it is linked INSIDE the scoped regions (the article body holds its Sources list),
  // never from the footer or nav.
  const links = new Set(regions.flatMap((r) => [...r.querySelectorAll("a[href]")]).map((a) => a.getAttribute("href")).filter(isOutbound));
  return { claims, links, page };
}

// ---------- ShelfSpace price rule ----------
// No dollar price for ShelfSpace (any product name) may appear on any served page outside a trial-ok region.
// Heuristics about whose money a sentence is about leak both ways, so this is DEFAULT-DENY:
//
//   price-shaped  every $ figure that LOOKS like a price — a period after it ("$399 a month", "/mo", "per user",
//                 "the $399 plan"), a price lead-in before it ("priced at", "starts at", "just", "flat"), a pricing
//                 word in its sentence (pricing, plan, tier, subscription, month to month, billed, cancel…), or a
//                 bare "$399" card number whose next sibling is a period or whose card is classed price/plan/tier.
//                 It fails unless (a) the page grandfathers it (the `prices` list in the baseline: the shapes on the
//                 site when C2 shipped, all reviewed as customer money / calculators / payment plans, shrink-only),
//                 or (b) it sits inside an element marked `data-price-note="competitor|customer|example|market|
//                 calculator"` — a declaration that the money is not ours (a competitor's list price with its
//                 source, a customer's savings, a calculator output).
//   named         a price-shaped figure in a sentence that NAMES a ShelfSpace product fails even inside a note, and a
//                 few explicit shapes ("ShelfSpace costs $", "our price … $", "you pay us $", "$X a month for
//                 ShelfCollect", "we charge $") fail everywhere. No baseline, no note, no registry entry clears these.
//   offer         JSON-LD offers / priced objects and microdata itemprop=price fail always.
//
// Inline <script> code is not read: quote.html (noindex) renders the quote price from its script (filed Z-C2a).
const D = String.raw`\$\s?\d[\d,]*(?:\.\d+)?(?:\s?(?:[KkMm]\b|thousand))?\+?`;
const NAMES = String.raw`(?:ShelfSpace|ShelfCollect|ShelfPay|ShelfiQ|ShelfVerify)(?:'s|’s)?(?:\s+AR)?`;
const NAMED = new RegExp(String.raw`\b${NAMES}\b`, "i");
// Z-C2d: inside a note, a sentence that calls the money "the platform's" / "our software's" is about us.
const SYNONYM = /\b(?:the|our|this)\s+(?:platform|software|service)\b/i;
// Z-C2d: lookalike dollar signs (full-width U+FF04, small U+FE69) read as "$".
const DOLLAR_LOOKALIKE = /[\uFF04\uFE69]/g; // for .replace only
const HAS_LOOKALIKE = /[\uFF04\uFE69]/; // for .test (no /g: lastIndex state)
function foldDollars(doc) {
  const w = doc.createTreeWalker(doc, 4 /* SHOW_TEXT */);
  while (w.nextNode()) if (HAS_LOOKALIKE.test(w.currentNode.data)) w.currentNode.data = w.currentNode.data.replace(DOLLAR_LOOKALIKE, "$");
  for (const el of doc.querySelectorAll("*")) for (const a of [...el.attributes]) if (HAS_LOOKALIKE.test(a.value)) el.setAttribute(a.name, a.value.replace(DOLLAR_LOOKALIKE, "$"));
}
export const PRICE_NOTES = new Set(["competitor", "customer", "example", "market", "calculator"]);
const UNIT_WORDS = String.raw`(?:month|mo|year|yr|week|wk|user|seat|login|location|store|license|brand|invoice|check|credit memo|memo|reminder|call|transaction|payment)`;
const PERIOD_AFTER = new RegExp(String.raw`^${D}(?:\s*USD)?\s*(?:-\s*(?:a|per)\s*-\s*${UNIT_WORDS}\b|\/\s?${UNIT_WORDS}\b|(?:per|a|an|each|every)\s+${UNIT_WORDS}\b|monthly\b|annually\b|yearly\b|flat\b|(?:plan|tier|package|subscription)\b)`, "i");
// Money written without a "$": "USD 399", "399 dollars", "399/mo".
const NON_DOLLAR = /\b(?:USD\s?\d[\d,]*(?:\.\d+)?|\d[\d,]*(?:\.\d+)?\s*(?:dollars|USD)|(?:\d{3,}|\d{1,3}(?:,\d{3})+)(?:\.\d+)?\s*\/\s?mo)\b/gi;
const LEAD_IN = /(?:priced at|starts? at|starting at|for just|for only|just|only|flat|from|it's|it’s|it is|you pay|month[- ]to[- ]month at)\W{0,3}$/i;
const PRICE_WORD = /\b(?:pricing|prices?|priced|plans?|tiers?|subscriptions?|month[- ]to[- ]month|cancel any ?time|cancel whenever|billed (?:monthly|annually|yearly)|per-invoice fees?|setup fee|free trial|after the trial)\b/i;
const PERIOD_UNIT = /^\s*(?:USD\s*)?(?:\/\s?(?:mo|month|yr|year)\b|(?:(?:per|a|an|each|every)\s+)?(?:month|year|mo|yr|user|seat)\b|monthly\b|annually\b)/i;
// A note may cover a sentence, a list, a table or a card — never a whole page region.
const NOTE_TOO_BIG = "body, main, article, section, header, footer, nav, .article-body, .article-glance";
const BARE_DOLLAR = new RegExp(String.raw`^(?:from\s+|~)?${D}$`, "i");
export const NAMED_RULES = [
  ["shelfspace-costs", new RegExp(String.raw`\b${NAMES}\s*(?::|\b(?:costs?|is priced|pricing|prices?|plans?|starts? at|starting at|subscription)\b)[^.$]{0,40}${D}`)],
  ["our-price", new RegExp(String.raw`\b[Oo]ur\s+(?:(?:flat|monthly|annual|yearly|list|base|starting|current|standard)\s+){0,2}(?:plans?|pricing|prices?|fees?|subscriptions?|tiers?|rates?|retainer)\b(?!\s+(?:to|for|paid)\b)[^.$]{0,40}${D}`)],
  ["you-pay-us", new RegExp(String.raw`\b(?:[Yy]ou|[Bb]rands?)\s+pay\s+(?:us|${NAMES})\b[^.$]{0,40}${D}`)],
  ["for-shelfspace", new RegExp(String.raw`${D}[^.$]{0,40}\bfor\s+${NAMES}\b`)],
  ["we-charge", new RegExp(String.raw`\b(?:[Ww]e|${NAMES})\s+charges?\b(?!\s+back)[^.$]{0,40}${D}`)],
];

const priceId = (file, value, text) => `${file.replace(/\.html$/, "").replace(/[^a-z0-9]+/gi, "-")}-${createHash("sha1").update(`${file}|${value}|${text}`).digest("hex").slice(0, 8)}`;

/** Is the $ figure at idx in sentence s price-shaped? A short label ending in the figure ("Growth $899",
 * "Starter — $399", "Total: $64,400") counts too. */
export function priceShaped(s, idx, figure) {
  const tail = s.slice(idx + (figure || "").length).replace(/[\s.,;:!?)]+/g, "");
  const shortLabel = !tail && s.slice(0, idx).split(/\s+/).filter((w) => /\w/.test(w)).length <= 4;
  return PERIOD_AFTER.test(s.slice(idx)) || LEAD_IN.test(s.slice(Math.max(0, idx - 30), idx)) || PRICE_WORD.test(s) || shortLabel || figure === undefined;
}

/** Price-shaped money inside `root` (sentences + bare card numbers): [{ value, s, card }]. */
function shapedIn(root, sentences, doc) {
  const out = [];
  for (const { text } of textUnits(root)) {
    sentences(text, (m, s, idx) => { if (priceShaped(s, idx, m[0])) out.push({ value: m[0], s, named: NAMED_RULES.find(([, re]) => re.test(s)) }); });
    for (const m of text.matchAll(NON_DOLLAR)) {
      const { start, end } = sentenceBounds(text, m.index, m[0].length);
      out.push({ value: m[0], s: text.slice(start, end).trim() });
    }
  }
  for (const s of sentences.named(root)) out.push(s);
  // A bare "$399" card number: its period may sit in the next element, it may be a table / list / definition cell,
  // or its card may be classed as pricing.
  for (const el of [root, ...root.querySelectorAll("*")]) {
    const t = norm(el.textContent || "");
    if (!BARE_DOLLAR.test(t) || [...el.children].some((c) => norm(c.textContent || "") === t)) continue;
    const next = norm(el.nextElementSibling?.textContent || el.nextSibling?.textContent || "");
    let classed = /^(?:TD|TH|DD|DT|LI)$/.test(el.tagName) || !!el.closest?.("li, td, dd");
    for (let a = el, up = 0; !classed && a && a !== doc.body && up < 4; a = a.parentElement, up++) {
      if (/price|pricing|plan|tier|rate|cost|amount|fee|band/i.test(`${a.className || ""} ${a.id || ""}`)) classed = true;
    }
    if (PERIOD_UNIT.test(next) || classed) out.push({ value: t, s: `${t} ${next}`.trim(), card: true });
  }
  return out;
}

/**
 * Every price finding on one page: [{ rule, value, text, id, reviewable }]. `reviewable` = a price-shaped figure
 * that the baseline may grandfather; everything else fails outright.
 */
export function priceHits(html, { trialOk = false, file = "page.html" } = {}) {
  const doc = parse(trialOk ? blankTrialOk(html) : html);
  foldDollars(doc);
  const hits = [];
  const seen = new Set();
  const push = (h) => { const id = priceId(file, h.value, h.text); if (seen.has(id)) return; seen.add(id); hits.push({ ...h, id }); };
  const sentences = (text, fn) => {
    for (const m of text.matchAll(new RegExp(D, "g"))) {
      const { start, end } = sentenceBounds(text, m.index, m[0].length);
      fn(m, text.slice(start, end).trim(), m.index - start);
    }
  };
  for (const el of doc.querySelectorAll("[data-price-note]")) {
    const v = el.getAttribute("data-price-note");
    if (!PRICE_NOTES.has(v)) push({ rule: "bad-note", value: v, text: `data-price-note="${v}" (allowed: ${[...PRICE_NOTES].join(", ")})`, reviewable: false });
  }
  // JSON-LD + microdata (read before scripts are stripped).
  for (const s of doc.querySelectorAll('script[type="application/ld+json"]')) {
    let data;
    try { data = JSON.parse(s.textContent || ""); } catch { continue; }
    (function walk(o) {
      if (Array.isArray(o)) return o.forEach(walk);
      if (!o || typeof o !== "object") return;
      const t = [].concat(o["@type"] || []).join(" ");
      const priced = ["price", "lowPrice", "highPrice"].some((k) => o[k] !== undefined && /[1-9]/.test(String(o[k])));
      // Any priced object, whatever its @type or currency (Z-C2d: a bare Product.price slipped through).
      if (priced) push({ rule: "jsonld-offer", value: String(o.price ?? o.lowPrice ?? o.highPrice), text: `JSON-LD ${t || "untyped"} price`, reviewable: false });
      if (/MonetaryAmount/.test(t) && ["value", "minValue", "maxValue"].some((k) => o[k] !== undefined && /[1-9]/.test(JSON.stringify(o[k])))) push({ rule: "jsonld-offer", value: JSON.stringify(o.value ?? o.minValue ?? o.maxValue), text: "JSON-LD MonetaryAmount value", reviewable: false });
      Object.values(o).forEach(walk);
    })(data);
  }
  for (const el of doc.querySelectorAll('meta[property^="product:price"], meta[property^="og:price"], meta[name^="product:price"], meta[name^="og:price"]')) {
    const v = el.getAttribute("content") || "";
    if (/[1-9]/.test(v)) push({ rule: "meta-price", value: v.trim(), text: `<meta ${el.getAttribute("property") ? "property" : "name"}="${el.getAttribute("property") || el.getAttribute("name")}">`, reviewable: false });
  }
  for (const el of doc.querySelectorAll('[itemprop="price"], [itemprop="lowPrice"], [itemprop="highPrice"]')) {
    const v = el.getAttribute("content") ?? el.textContent ?? "";
    if (/[1-9]/.test(v)) push({ rule: "microdata-price", value: v.trim(), text: `itemprop=${el.getAttribute("itemprop")}`, reviewable: false });
  }
  // Head text a search result shows.
  const head = [["<title>", doc.querySelector("title")?.textContent || ""]];
  for (const meta of doc.querySelectorAll('meta[name="description"], meta[property="og:description"], meta[name="twitter:description"], meta[property="og:title"], meta[name="twitter:title"]')) head.push(["<meta>", meta.getAttribute("content") || ""]);
  for (const [where, raw] of head) {
    const text = norm(raw);
    sentences(text, (m, s, idx) => {
      const named = NAMED_RULES.find(([, re]) => re.test(s));
      if (named) push({ rule: named[0], value: m[0], text: `${where} ${s}`, reviewable: false });
      else if (priceShaped(s, idx, m[0])) push({ rule: NAMED.test(s) ? "named-price" : "price-shaped", value: m[0], text: `${where} ${s}`, reviewable: !NAMED.test(s) });
    });
  }
  // Visible body text (nav and footer included: they are visible too).
  for (const el of doc.body?.querySelectorAll("script, style, noscript, svg, template") || []) el.remove();
  if (!doc.body) return hits;
  sentences.named = () => [];
  // Z-C2d: alt / aria-label / title text is read too (screen readers and image search show it). Inside a note it
  // is the note's money unless it names us; outside, the same default-deny as body text.
  for (const el of doc.body.querySelectorAll("[alt], [aria-label], [title]")) {
    const inNote = !!el.closest("[data-price-note]");
    for (const attr of ["alt", "aria-label", "title"]) {
      const text = norm(el.getAttribute(attr) || "");
      if (!text) continue;
      sentences(text, (m, sent, idx) => {
        const named = NAMED_RULES.find(([, re]) => re.test(sent));
        const where = `${attr}="${sent.slice(0, 160)}"`;
        if (named) push({ rule: named[0], value: m[0], text: where, reviewable: false });
        else if (!priceShaped(sent, idx, m[0])) return;
        else if (inNote) { if (NAMED.test(sent) || SYNONYM.test(sent)) push({ rule: "named-in-note", value: m[0], text: where, reviewable: false }); }
        else push({ rule: NAMED.test(sent) ? "named-price" : "price-shaped", value: m[0], text: where, reviewable: true });
      });
    }
  }
  const notes = [...doc.body.querySelectorAll("[data-price-note]")].filter((el) => !el.parentElement?.closest("[data-price-note]"));
  // Inside a note: an explicit named shape, or ANY price-shaped money in a note whose text names ShelfSpace (a
  // compare table with a ShelfSpace row) or that sits under a heading naming ShelfSpace pricing, still fails.
  for (const note of notes) {
    if (note.matches(NOTE_TOO_BIG) || note.querySelector("h1, h2") || norm(note.textContent || "").length > 1200) {
      push({ rule: "bad-note", value: note.getAttribute("data-price-note"), text: `data-price-note on a whole region (<${note.tagName.toLowerCase()}>): mark the smallest element that holds the money`, reviewable: false });
    }
    let heading = "";
    for (let a = note, steps = 0; a && a !== doc.body && !heading && steps < 40; steps++) {
      let p = a.previousElementSibling;
      while (p && !/^H[1-4]$/.test(p.tagName)) p = p.previousElementSibling;
      if (p) heading = norm(p.textContent || ""); else a = a.parentElement;
    }
    const noteText = textUnits(note).map((u) => u.text).join(" "); // unit-joined: "$299/mo</td><td>ShelfSpace" keeps its word break
    const namedNote = NAMED.test(noteText) || (NAMED.test(heading) && /pricing|price|plans?|cost/i.test(heading));
    for (const f of shapedIn(note, sentences, doc)) {
      if (f.named) push({ rule: f.named[0], value: f.value, text: f.s.slice(0, 200), reviewable: false });
      else if (namedNote || SYNONYM.test(f.s)) push({ rule: "named-in-note", value: f.value, text: `${f.s.slice(0, 160)}${heading ? ` (under "${heading.slice(0, 60)}")` : ""}`, reviewable: false });
    }
  }
  for (const note of notes) note.remove();
  for (const f of shapedIn(doc.body, sentences, doc)) {
    if (f.named) { push({ rule: f.named[0], value: f.value, text: f.s.slice(0, 200), reviewable: false }); continue; }
    // Named + price-shaped outside a note: grandfather-able (the site has "ShelfSpace found $83,741 a year in
    // credits"), but never note-able — a new one must be reworded.
    push({ rule: NAMED.test(f.s) ? "named-price" : f.card ? "price-card" : "price-shaped", value: f.value, text: f.s.slice(0, 200), reviewable: true });
  }
  // Explicit named shapes anywhere in body text, even when the figure itself is not price-shaped.
  for (const { text } of textUnits(doc.body)) sentences(text, (m, s) => {
    const named = NAMED_RULES.find(([, re]) => re.test(s));
    if (named) push({ rule: named[0], value: m[0], text: s.slice(0, 200), reviewable: false });
  });
  return hits;
}

/** TRIAL_OK_FILES from check-docs-forbidden.sh: the ONE list of files allowed trial-ok regions. */
export function trialOkFiles(root) {
  const sh = readFileSync(join(root, FORBIDDEN_SH), "utf8");
  const m = sh.match(/TRIAL_OK_FILES=\(([\s\S]*?)\)/);
  const files = m ? [...m[1].matchAll(/"([^":]+):[^"]*"/g)].map((x) => x[1]) : [];
  if (!files.length) throw new Error(`could not read TRIAL_OK_FILES from ${FORBIDDEN_SH}`);
  return new Set(files);
}

/** Blank every trial-ok region (only on a file that is allowed them; check:forbidden polices the markers). */
export const blankTrialOk = (html) => html.replace(/<!-- trial-ok:start -->[\s\S]*?<!-- trial-ok:end -->/g, "");

// ---------- registry + baseline ----------
export function validateRegistry(reg) {
  const errs = [];
  if (!reg || !Array.isArray(reg.claims)) return ["registry has no claims array"];
  const allowedTop = new Set(["$comment", "claims"]);
  for (const k of Object.keys(reg)) if (!allowedTop.has(k)) errs.push(`unknown top-level key "${k}" (the registry is public: nothing but claims)`);
  const ids = new Set();
  for (const [i, e] of reg.claims.entries()) {
    const at = `claims[${i}]${e?.id ? ` (${e.id})` : ""}`;
    for (const k of Object.keys(e || {})) if (!ENTRY_KEYS.has(k)) errs.push(`${at}: unknown key "${k}"`);
    if (!e?.id || ids.has(e.id)) errs.push(`${at}: id missing or duplicated`);
    ids.add(e?.id);
    if (typeof e?.value !== "string" || !e.value.trim()) errs.push(`${at}: value missing`);
    if (typeof e?.claim !== "string" || typeof e?.value !== "string" || !e.claim.includes(e.value)) errs.push(`${at}: claim must be the published sentence that carries the value`);
    if (!Array.isArray(e?.pages) || !e.pages.length || e.pages.some((p) => !/^https:\/\/shelfspace\.pro\//.test(p))) errs.push(`${at}: pages must be shelfspace.pro URLs`);
    if (typeof e?.claim === "string" && priceHits(`<p>${e.claim.replace(/</g, "&lt;")}</p>`).some((h) => !h.reviewable)) errs.push(`${at}: a ShelfSpace price can never be registered`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e?.as_of || "")) errs.push(`${at}: as_of must be an ISO date`);
    const urls = e?.source_urls || [];
    if (e?.first_party === true) {
      if (typeof e.basis !== "string" || e.basis.trim().length < 10) errs.push(`${at}: a first-party figure needs a basis (what data it comes from)`);
    } else {
      if (!Array.isArray(urls) || !urls.length) errs.push(`${at}: source_urls missing (or set first_party with a basis)`);
      for (const u of Array.isArray(urls) ? urls : []) if (!/^https:\/\//.test(u) || !isOutbound(u)) errs.push(`${at}: source ${u} is not an outside https source`);
    }
  }
  return errs;
}

const sentenceKey = (t) => norm(String(t || "")).replace(/[‘’]/g, "'").replace(/[“”]/g, '"');

/**
 * The registry entry for one figure: same value, the page listed, AND the same published sentence. A registered
 * value reused in a NEW sentence on the same page is a new claim and needs its own entry (B1 keys claims by
 * sentence too).
 */
function registeredOn(reg, page, value, snippet) {
  const key = sentenceKey(snippet);
  return reg.claims.find((e) => e?.value === value && Array.isArray(e?.pages) && e.pages.includes(page) && sentenceKey(e.claim) === key);
}

/**
 * The whole check over a site model. Pure apart from reading files. Returns { violations, needed, scanned }.
 * `pages` = [{ file, html }] in scope for figures; `served` = [{ file, html, trialOk }] for the price rule.
 */
export function evaluate({ pages, served, registry, baseline, committedBaseline }) {
  const v = [];
  const add = (code, file, detail) => v.push({ code, file, detail });
  for (const e of validateRegistry(registry)) add("registry-schema", REGISTRY_REL, e);
  const base = new Map((baseline?.entries || []).map((b) => [b.id, b]));
  const committedSets = committedBaseline ? [].concat(committedBaseline).map((c) => new Set((c.entries || []).map((b) => b.id))) : null;
  const committedPriceSets = committedBaseline ? [].concat(committedBaseline).map((c) => new Set((c.prices || []).map((b) => b.id))) : null;
  const priceBase = new Map((baseline?.prices || []).map((b) => [b.id, b]));
  const neededPrices = [];
  const seenPrices = new Set();
  const needed = [];
  const seenIds = new Set();
  const found = new Map(); // page url -> Set(values) in scope
  for (const { file, html } of pages) {
    const { claims, links, page } = scopedClaims(html, file);
    found.set(page, new Set(claims.map((c) => `${c.value}|${sentenceKey(c.text_snippet)}`)));
    if (/^blog\/[^/]+\.html$/.test(file) && !claims.length && !regionsOf(parse(html)).length) {
      add("no-scope", file, "a blog page with no .article-body / .article-glance / .stats-strip / .stat-trio: its figures would be read by nothing");
    }
    for (const c of claims) {
      const entry = Array.isArray(registry?.claims) ? registeredOn(registry, page, c.value, c.text_snippet) : null;
      if (entry) {
        if (!entry.first_party && !(entry.source_urls || []).some((u) => links.has(u))) {
          add("source-missing", file, `"${c.value}" is registered as ${entry.id} but the page links none of its sources`);
        }
        continue;
      }
      seenIds.add(c.id);
      if (base.has(c.id)) { needed.push(base.get(c.id)); continue; }
      add("unregistered", file, `"${c.value}" in: ${c.text_snippet}  (to register it, use this exact text as the entry's claim)`);
    }
  }
  for (const e of Array.isArray(registry?.claims) ? registry.claims : []) {
    for (const p of Array.isArray(e?.pages) ? e.pages : []) {
      if (!found.has(p)) add("registry-stale", REGISTRY_REL, `${e.id}: ${p} has no scoped region on any served page`);
      else if (!found.get(p).has(`${e.value}|${sentenceKey(e.claim)}`)) add("registry-stale", REGISTRY_REL, `${e.id}: "${e.value}" in its registered sentence no longer appears on ${p}`);
    }
  }
  for (const [id, b] of base) {
    if (!seenIds.has(id)) add("baseline-stale", BASELINE_REL, `${id} ("${b.value}" on ${b.page}) is fixed, changed or registered: run --write-baseline`);
    if (committedSets && committedSets.some((c) => !c.has(id))) add("baseline-grew", BASELINE_REL, `${id} is not in the committed baseline (hand-added, or your branch is behind origin/main: rebase): the baseline only shrinks`);
  }
  for (const { file, html, trialOk } of served) {
    for (const h of priceHits(html, { trialOk, file })) {
      if (h.reviewable) {
        seenPrices.add(h.id);
        if (priceBase.has(h.id)) { neededPrices.push(priceBase.get(h.id)); continue; }
        add("shelfspace-price", file, `${h.rule}: "${h.value}" in: ${h.text}  — ` + (h.rule === "named-price"
          ? "a sentence naming ShelfSpace next to a price-shaped figure is never allowed (a note does not clear it): reword it"
          : 'if this IS a ShelfSpace price, remove it (never allowed); if the money is not ours, wrap the SMALLEST element holding it (a sentence, list, table or card, never the article or a section) in data-price-note="competitor|customer|example|market|calculator"'));
      } else add("shelfspace-price", file, `${h.rule}: "${h.value}" in: ${h.text}`);
    }
  }
  for (const [id, b] of priceBase) {
    if (!seenPrices.has(id)) add("baseline-stale", BASELINE_REL, `price ${id} ("${b.value}" on ${b.file}) is gone, changed or noted: run --write-baseline`);
    if (committedPriceSets && committedPriceSets.some((c) => !c.has(id))) add("baseline-grew", BASELINE_REL, `price ${id} is not in the committed baseline: the baseline only shrinks`);
  }
  return { violations: v, needed, neededPrices };
}

// ---------- self-test (literal fixtures; run before every scan) ----------
const page = (body, head = "") => `<!doctype html><html><head><title>T</title>${head}</head><body><nav><a href="/pricing">Pricing</a></nav>${body}<footer>x</footer></body></html>`;
const SRC = "https://example.org/study";
const REG = (extra = []) => ({ claims: [{ id: "t-1", value: "56%", claim: "Agencies keep 56% (study).", pages: ["https://shelfspace.pro/blog/t"], source_urls: [SRC], as_of: "2026-10-29" }, ...extra] });
const FIX = (name, opts) => ({ name, ...opts });
export const SELF_TESTS = [
  FIX("registered + cited figure passes", { html: page(`<div class="article-body"><p>Agencies keep 56% (<a href="${SRC}">study</a>).</p></div>`), expect: [] }),
  FIX("unregistered figure in .article-body fails", { html: page(`<div class="article-body"><p>Stores pay in 34 days.</p></div>`), registry: { claims: [] }, expect: ["unregistered"] }),
  FIX("unregistered figure in .article-glance fails (Z-B1a)", { html: page(`<div class="article-glance"><ul><li>38 invoices sent</li></ul></div>`), registry: { claims: [] }, expect: ["unregistered"] }),
  FIX("unregistered figure in .stats-strip fails (Z-B1a)", { html: page(`<div class="stats-strip"><div class="stats-strip-num">195</div><div class="stats-strip-label">Reminders sent</div></div>`), registry: { claims: [] }, expect: ["unregistered"] }),
  FIX("unregistered figure in a .stat-trio outside the body fails (Z-B1a)", { html: page(`<div class="stat-trio"><p class="stat-trio-num">$4,200</p><p>owed</p></div>`), registry: { claims: [] }, expect: ["unregistered"] }),
  FIX("figure outside every scoped region is not a claim", { rel: "about.html", html: page(`<div class="page-hero"><p>94 reminders in two weeks.</p></div>`), registry: { claims: [] }, expect: [] }),
  FIX("registered value on an unlisted page fails", { rel: "blog/other.html", html: page(`<div class="article-body"><p>Agencies keep 56% (<a href="${SRC}">study</a>).</p></div>`), expect: ["unregistered", "registry-stale"] }),
  FIX("registered value reused in a NEW sentence on the same page fails", { html: page(`<div class="article-body"><p>Agencies keep 56% (<a href="${SRC}">study</a>).</p><p>Stores keep 56% of it too.</p></div>`), expect: ["unregistered"] }),
  FIX("a source linked only from the footer does not count", { html: page(`<div class="article-body"><p>Agencies keep 56% (study).</p></div>`).replace("<footer>x</footer>", `<footer><a href="${SRC}">s</a></footer>`), expect: ["source-missing"] }),
  FIX("a blog page with no scoped region fails", { html: page(`<div class="page-hero"><p>Text.</p></div>`), registry: { claims: [] }, expect: ["no-scope"] }),
  FIX("a stat card number with inner markup is still a figure", { html: page(`<div class="stats-strip"><div class="stats-strip-num">1<span>95</span></div><div class="stats-strip-label">Reminders sent</div></div>`), registry: { claims: [] }, expect: ["unregistered"] }),
  FIX("registered figure whose source link is gone fails", { html: page(`<div class="article-body"><p>Agencies keep 56% (study).</p></div>`), expect: ["source-missing"] }),
  FIX("registry entry whose figure left the page fails", { html: page(`<div class="article-body"><p>No figures here at all.</p></div>`), expect: ["registry-stale"] }),
  FIX("grandfathered figure passes", { html: page(`<div class="article-body"><p>Agencies keep 56% (<a href="${SRC}">study</a>).</p><p>Stores pay in 34 days.</p></div>`), baselineFrom: "same", expect: [] }),
  FIX("grandfathered figure whose sentence changed fails twice (new figure + stale entry)", { html: page(`<div class="article-body"><p>Agencies keep 56% (<a href="${SRC}">study</a>).</p><p>Stores pay in 35 days.</p></div>`), baselineFromHtml: page(`<div class="article-body"><p>Agencies keep 56% (<a href="${SRC}">study</a>).</p><p>Stores pay in 34 days.</p></div>`), expect: ["unregistered", "baseline-stale"] }),
  FIX("a baseline entry added by hand fails (ratchet)", { html: page(`<div class="article-body"><p>Agencies keep 56% (<a href="${SRC}">study</a>).</p><p>Stores pay in 34 days.</p></div>`), baselineFrom: "same", committedEmpty: true, expect: ["baseline-grew"] }),
  FIX("registry entry with a private field fails", { html: page(`<div class="article-body"><p>Agencies keep 56% (<a href="${SRC}">study</a>).</p></div>`), registry: { claims: [{ ...REG().claims[0], search_volume: 40 }] }, expect: ["registry-schema"] }),
  FIX("registry entry with an own-domain source fails", { html: page(`<div class="article-body"><p>Agencies keep 56% (<a href="https://shelfspace.pro/x">x</a>).</p></div>`), registry: { claims: [{ ...REG().claims[0], claim: "Agencies keep 56% (x).", source_urls: ["https://shelfspace.pro/x"] }] }, expect: ["registry-schema", "source-missing"] }),
  FIX("first-party figure with a basis passes", { html: page(`<div class="article-glance"><ul><li>38 invoices sent</li></ul></div>`), registry: { claims: [{ id: "t-2", value: "38 invoices", claim: "38 invoices sent", pages: ["https://shelfspace.pro/blog/t"], first_party: true, basis: "ShelfSpace platform records for this customer", as_of: "2026-10-29" }] }, expect: [] }),
  FIX("ShelfSpace price in body fails", { html: page(`<div class="article-body"><p>ShelfSpace costs $399 a month.</p></div>`), registry: { claims: [] }, served: true, expectPrice: true }),
  FIX("ShelfSpace price fails EVEN WHEN REGISTERED", { html: page(`<div class="article-body"><p>Our flat monthly price is $1,500.</p></div>`), registry: { claims: [{ id: "t-3", value: "$1,500", claim: "Our flat monthly price is $1,500.", pages: ["https://shelfspace.pro/blog/t"], first_party: true, basis: "the price list", as_of: "2026-10-29" }] }, served: true, expectPrice: true }),
  FIX("plans-start price on a product page fails", { html: page(`<section><p>Plans start at $499/mo.</p></section>`), registry: { claims: [] }, served: true, expectPrice: true }),
  FIX("pricing-card price tag fails", { html: page(`<div class="card"><h3>Starter plan</h3><div>$399<span>/mo</span></div><p>Everything a growing brand needs.</p></div>`), registry: { claims: [] }, served: true, expectPrice: true }),
  FIX("price in the meta description fails", { html: page(`<p>hi</p>`, `<meta name="description" content="ShelfSpace pricing starts at $299 a month.">`), registry: { claims: [] }, served: true, expectPrice: true }),
  FIX("JSON-LD offer with a price fails", { html: page(`<p>hi</p>`, `<script type="application/ld+json">{"@type":"Product","offers":{"@type":"Offer","price":"399"}}</script>`), registry: { claims: [] }, served: true, expectPrice: true }),
  FIX("price inside a trial-ok region on an allowed file passes", { html: page(`<!-- trial-ok:start --><section><p>Plans start at $499/mo.</p></section><!-- trial-ok:end -->`), registry: { claims: [] }, served: true, trialOk: true, expectPrice: false }),
  FIX("trial-ok region on a file NOT allowed one still fails", { html: page(`<!-- trial-ok:start --><section><p>Plans start at $499/mo.</p></section><!-- trial-ok:end -->`), registry: { claims: [] }, served: true, trialOk: false, expectPrice: true }),
  FIX("a calculator's monthly figure is not a price tag", { html: page(`<div class="calc" data-price-note="calculator"><p>Credits you could recover each month at your revenue</p><div class="calc-range-month"><span>$3,000</span>/month</div></div>`), registry: { claims: [] }, served: true, expectPrice: false }),
  FIX("an un-noted price shape fails (default-deny)", { html: page(`<p>At our client we found $8,000 a month in credits.</p>`), registry: { claims: [] }, served: true, expectPrice: true }),
  FIX("a hand-added price baseline entry fails (ratchet)", { html: page(`<p>At our client we found $8,000 a month in credits.</p>`), registry: { claims: [] }, served: true, priceBaselineFromSelf: true, committedEmpty: true, expectCodes: ["baseline-grew"] }),
  FIX("a grandfathered price shape passes", { html: page(`<p>At our client we found $8,000 a month in credits.</p>`), registry: { claims: [] }, served: true, priceBaselineFromSelf: true, expectPrice: false }),
  FIX("money we found for a customer is not a ShelfSpace price", { html: page(`<p data-price-note="customer">At our Massachusetts client we found $8,000 to $25,000 a month in credits.</p><p>A vendor billed us $784 short.</p>`), registry: { claims: [] }, served: true, expectPrice: false }),
];

// The price rule's phrasing corpus (adversarial review, 10/29/2026): each must fire / must not.
const PRICE_FIRE = [
  `<p>ShelfSpace is just $399/month.</p>`, `<p>Pricing: $499 per month.</p>`, `<p>$1,500/mo flat, month to month.</p>`,
  `<p>Plans from $399.</p>`, `<h2>Simple pricing: $499 a month</h2>`, `<p>ShelfCollect costs $399/month.</p>`,
  `<p>ShelfCollect is $399 a month.</p>`, `<p>ShelfPay starts at $1,500 a month.</p>`, `<p>It's $399 a month, cancel anytime.</p>`,
  `<p>Just $399 a month.</p>`, `<p>ShelfSpace is a flat monthly subscription of $399.</p>`, `<p>Starts at $399/month.</p>`,
  `<p>You pay $399 a month.</p>`, `<p>One flat fee: $1,500 a month.</p>`, `<p>$399 per month for ShelfCollect.</p>`,
  `<p>ShelfSpace: $399/mo</p>`, `<p>Priced at $399 a month.</p>`, `<p>ShelfSpace is<br>$399 a month.</p>`,
  `<p>For $399 a month, every invoice gets chased in your name.</p>`, `<p>$399 a month covers unlimited invoices and reminders.</p>`,
  `<p>Flat $399 a month, no per-invoice fees.</p>`, `<p>Most brands start on the $399 plan.</p>`,
  `<p>Month to month at $399, cancel whenever you like.</p>`, `<p>After the trial it's $399 a month.</p>`,
  `<p>Get started for $399 a month.</p>`, `<h2>Starter: $399 a month</h2>`, `<p>ShelfCollect's $399 a month replaces 20 hours of chasing.</p>`,
  `<ul><li>Under $50K in monthly receivables: $399/mo</li><li>$50K to $150K: $899/mo</li></ul>`,
  `<table><tr><th>Brand size</th><th>Monthly</th></tr><tr><td>Under $50K</td><td>$399/mo</td></tr></table>`,
  `<table><tr><th>Plan</th><th>Price</th></tr><tr><td>Starter</td><td>$399/mo</td></tr></table>`,
  `<div class="band"><h3>Most popular</h3><div class="price">$899/mo</div></div>`,
  `<div class="band"><h3>Best value</h3><div class="amount">$899/mo</div><p>30-day money-back guarantee.</p></div>`,
  `<div class="card"><div class="amount">$399</div><div class="period">per month</div></div>`,
  `<div class="plan-card"><h3>Starter</h3><div class="big">$399</div></div>`,
  `<section class="pricing-slider"><div>$399/mo</div></section>`, `<section id="pricing-savings"><p>Save with $399/mo.</p></section>`,
  `<section class="hero"><h1>Collect what stores owe you.</h1><div class="band"><div class="price">$399/mo</div></div></section>`,
  `<div data-price-note="competitor"><p>ShelfSpace costs $399 a month, LeafLink $500.</p></div>`,
  `<div data-price-note="customer"><p>ShelfCollect is $399 a month for this brand.</p></div>`,
  `<div data-price-note="sale"><p>Anything.</p></div>`,
  `<p>A $399-a-month service.</p>`, `<p>$399 USD per month</p>`, `<p>$399 every month.</p>`, `<p>$0.99 per invoice</p>`,
  `<p>$5 per check</p>`, `<p>$20 per credit memo</p>`, `<p>$399 per brand.</p>`, `<p>$399 flat, no contract.</p>`, `<p>Growth $899</p>`,
  `<table><tr><th>Plan</th><th>Price</th></tr><tr><td>Starter</td><td>$399</td></tr></table>`, `<dl><dt>Starter</dt><dd>$399</dd></dl>`,
  `<ul><li>Starter — $399</li></ul>`, `<div class="card"><h3>Starter</h3><div class="amount">$399</div></div>`,
  `<div class="card"><div class="amount">$399</div><div class="per">month</div></div>`, `<p>Starter: 399/mo</p>`, `<p>USD 399 per month</p>`, `<p>399 dollars a month.</p>`,
  `<table data-price-note="competitor"><tr><th>Tool</th><th>Price</th></tr><tr><td>LeafLink</td><td>$299/mo</td></tr><tr><td>ShelfSpace</td><td>$399/mo</td></tr></table>`,
  `<h2>ShelfCollect pricing</h2><p data-price-note="example">Plans start at $399/mo.</p>`,
  `<div class="article-body" data-price-note="market"><p>LeafLink is $299 a month.</p></div>`,
  `<p data-price-note="market">shelfspace is $399 a month.</p>`,
  `<meta itemprop="price" content="399">`,
  `<script type="application/ld+json">{"@type":"Product","offers":{"price":399,"priceCurrency":"USD"}}</script>`,
  // Z-C2d residuals
  `<div data-price-note="competitor"><p>The platform is $399 a month.</p></div>`,
  `<p data-price-note="example">Our software runs $399/month for most brands.</p>`,
  `<img src="/x.png" alt="ShelfSpace pricing: $399 a month">`, `<img src="/x.png" alt="Plans from $399 a month">`,
  `<a href="/x" aria-label="Start for $399 a month">Start</a>`, `<span title="Just $399/mo">i</span>`,
  `<meta property="product:price:amount" content="399"><meta property="product:price:currency" content="USD">`,
  `<meta property="og:price:amount" content="399">`,
  `<script type="application/ld+json">{"@type":"Product","name":"ShelfSpace","price":"399"}</script>`,
  `<script type="application/ld+json">{"@type":"MonetaryAmount","currency":"USD","value":399}</script>`,
  `<p>ShelfSpace is \uFF04399 a month.</p>`, `<p>Just \uFF04399/month.</p>`, `<p>Just &#65284;399/month.</p>`, `<p>Plans from \uFE69399.</p>`,
];
const PRICE_NOT = [
  `<p>The agency collected $417,560 for us in 30 days.</p>`, `<p>ShelfSpace is how One Garden got $152,430 paid in 18 invoices.</p>`,
  `<p>ShelfSpace is built for brands with $500K+ in annual wholesale revenue.</p>`, `<p>ShelfSpace is the tool that recovered $417,560 for a Massachusetts brand.</p>`,
  `<p>"Our fees to the collection agency were $2,000 before we switched," she said.</p>`,
  `<div data-price-note="competitor"><p>LeafLink charges $2,000 per month for its AR tool (as of 10/29/2026).</p></div>`,
  `<div data-price-note="competitor"><table><tr><th>Tool</th><th>Price</th></tr><tr><td>LeafLink</td><td>$299/mo</td></tr></table></div>`,
  `<div data-price-note="customer"><p>At our client we found $8,000 to $25,000 a month in credits.</p></div>`,
  `<div data-price-note="calculator"><p>Credits you could recover each month</p><div class="calc-range-month"><span>$3,000</span>/month</div></div>`,
  `<div data-price-note="market"><p>In the US, most AR firms charge $500 a month plus a percentage.</p></div>`,
  `<p>We charged back $784 to the vendor.</p>`, `<p>A vendor billed us $784 short.</p>`,
  `<div data-price-note="competitor"><p>LeafLink's platform is $299 a month (as of 10/29/2026).</p></div>`,
  `<img src="/x.png" alt="A dashboard of open invoices">`, `<img src="/x.png" alt="One Garden got $152,430 paid">`,
  `<script type="application/ld+json">{"@type":"Article","headline":"x"}</script>`,
];

export function selfTest() {
  const fails = [];
  for (const b of PRICE_FIRE) if (!priceHits(page(b)).length) fails.push(`price corpus: did not fire on ${b}`);
  if (!priceHits(page("<p>x</p>").replace("<title>T</title>", "<title>ShelfCollect pricing: $399 a month</title>")).length) fails.push("price corpus: a price in <title> did not fire");
  for (const b of PRICE_NOT) { const h = priceHits(page(b)); if (h.length) fails.push(`price corpus: fired (${h[0].rule}) on ${b}`); }
  for (const t of SELF_TESTS) {
    const rel = t.rel || "blog/t.html";
    const registry = t.registry || REG();
    let baseline = { entries: [] };
    const from = t.baselineFromHtml || (t.baselineFrom === "same" ? t.html : null);
    if (from) {
      const { claims, page: pg } = scopedClaims(from, rel);
      baseline = { entries: claims.filter((c) => !registeredOn(registry, pg, c.value, c.text_snippet)).map((c) => ({ id: c.id, page: c.page, value: c.value })) };
    }
    if (t.priceBaselineFromSelf) baseline.prices = priceHits(t.html, { file: rel }).filter((h) => h.reviewable).map((h) => ({ id: h.id, file: rel, value: h.value }));
    const committedBaseline = t.committedEmpty ? { entries: [] } : baseline;
    const { violations } = evaluate({
      pages: [{ file: rel, html: t.html }],
      served: t.served ? [{ file: rel, html: t.html, trialOk: !!t.trialOk }] : [],
      registry, baseline, committedBaseline,
    });
    const codes = [...new Set(violations.map((x) => x.code))].sort();
    if (t.expectCodes) { if (!t.expectCodes.every((c) => codes.includes(c))) fails.push(`${t.name}: expected ${t.expectCodes} in [${codes}]`); continue; }
    if (t.served) {
      const got = codes.includes("shelfspace-price");
      if (got !== t.expectPrice) fails.push(`${t.name}: shelfspace-price ${got ? "fired" : "did not fire"} (${codes.join(",") || "none"})`);
    } else {
      const want = [...t.expect].sort();
      if (JSON.stringify(codes) !== JSON.stringify(want)) fails.push(`${t.name}: expected [${want}] got [${codes}]`);
    }
  }
  // The trial-ok list is read from check:forbidden and applied per FILE: a region on any other page exempts nothing.
  try {
    const allowed = trialOkFiles(ROOT);
    if (!allowed.has("pricing.html")) fails.push("trial-ok list: pricing.html missing from TRIAL_OK_FILES as read");
    const region = page(`<!-- trial-ok:start --><section><p>Plans start at $499/mo.</p></section><!-- trial-ok:end -->`);
    const stray = servedEntry("index.html", region, allowed), ok = servedEntry("pricing.html", region, allowed);
    if (!priceHits(stray.html, stray).length) fails.push("trial-ok: a region on index.html (not allowed) exempted a price");
    if (priceHits(ok.html, ok).length) fails.push("trial-ok: a region on pricing.html (allowed) did not exempt");
  } catch (e) { fails.push(`trial-ok list unreadable: ${e.message}`); }
  if (vendoredBlockHash() !== VENDORED_SHA256) fails.push("vendored-drift: claims-extract.mjs verbatim block does not match VENDORED_SHA256");
  return fails;
}

// ---------- the site ----------
/** Has this path ever been committed on this branch's history? */
export function everCommitted(root, rel) {
  try { return execFileSync("git", ["log", "-1", "--format=%H", "--", rel], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() !== ""; } catch { return false; }
}

function loadJson(root, rel, fallback) {
  const f = join(root, rel);
  return existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : fallback;
}

/**
 * The refs a baseline is ratcheted against: HEAD, HEAD~1, origin/main, and SEO_BASELINE_REF (checks.yml sets it
 * to the commit main was at before the push, or a PR's base, and fetches it). An entry must be in EVERY copy that
 * exists, so a multi-commit push that deletes the baseline in one commit and re-seeds it in the next still fails
 * against the pre-push main.
 */
export function baselineRefs() {
  const refs = ["HEAD", "HEAD~1", "origin/main"];
  const extra = (process.env.SEO_BASELINE_REF || "").trim();
  if (extra && !/^0+$/.test(extra)) refs.push(extra);
  return refs;
}

/** The committed copies of a baseline file (one per ref that has it), or null when none has it yet. */
export function committedBaselineOf(root, rel) {
  const copies = [];
  for (const ref of baselineRefs()) {
    try {
      copies.push(JSON.parse(execFileSync("git", ["show", `${ref}:${rel}`], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 << 20 })));
    } catch { /* no such ref, or the file did not exist there */ }
  }
  return copies.length ? copies : null;
}

/** A served page for the price rule: trial-ok regions count only on a file check:forbidden allows them on. */
export const servedEntry = (file, html, allowed) => ({ file, html, trialOk: allowed.has(file) });

export function siteModel(root) {
  const idx = siteIndex(root);
  const allowed = trialOkFiles(root);
  const read = (f) => readFileSync(join(root, f), "utf8");
  const pages = idx.indexablePages({ extras: false }).filter((p) => p.file).map((p) => ({ file: p.file, html: read(p.file) }));
  const served = idx.pageFiles().map((f) => servedEntry(f, read(f), allowed));
  // llms.txt is served to AI crawlers: its lines are price-checked like page text.
  if (existsSync(join(root, "llms.txt"))) {
    const esc = (l) => l.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    served.push({ file: "llms.txt", html: `<html><body>${read("llms.txt").split("\n").map((l) => `<p>${esc(l)}</p>`).join("")}</body></html>`, trialOk: false });
  }
  return { pages, served };
}

function main() {
  const args = process.argv.slice(2);
  const rootArg = args.includes("--root") ? args[args.indexOf("--root") + 1] : null;
  const root = rootArg ? resolve(rootArg) : ROOT;
  const fails = selfTest();
  if (fails.length) {
    console.error(`check:claims SELF-TEST FAILED (${fails.length}):\n  ` + fails.join("\n  "));
    process.exit(1);
  }
  const registry = loadJson(root, REGISTRY_REL, { claims: [] });
  const baselineFile = join(root, BASELINE_REL);
  const { pages, served } = siteModel(root);

  if (args.includes("--seed-baseline")) {
    if (existsSync(baselineFile)) { console.error(`${BASELINE_REL} exists; the baseline only shrinks (use --write-baseline)`); process.exitCode = 1; return; }
    if (everCommitted(root, BASELINE_REL)) { console.error(`${BASELINE_REL} has existed in git history; re-seeding would re-grandfather everything. Restore it with git instead.`); process.exitCode = 1; return; }
    const entries = [];
    for (const { file, html } of pages) {
      const { claims, page: pg } = scopedClaims(html, file);
      for (const c of claims) if (!registeredOn(registry, pg, c.value, c.text_snippet)) entries.push({ id: c.id, page: c.page, value: c.value, text_snippet: c.text_snippet });
    }
    writeFileSync(baselineFile, JSON.stringify({ $comment: BASELINE_COMMENT, entries }, null, 1) + "\n");
    console.log(`check:claims: seeded ${entries.length} grandfathered figures`);
    return;
  }

  const baseline = loadJson(root, BASELINE_REL, { entries: [] });
  const committedBaseline = committedBaselineOf(root, BASELINE_REL);
  if (!existsSync(baselineFile) && committedBaseline) {
    console.error(`check:claims FAILED: baseline-deleted  ${BASELINE_REL} is gone but committed copies exist: the baseline only shrinks, never by deleting the file`);
    process.exitCode = 1;
    return;
  }
  const { violations, needed, neededPrices } = evaluate({ pages, served, registry, baseline, committedBaseline });

  if (args.includes("--write-baseline")) {
    const keep = new Set(needed.map((b) => b.id));
    const entries = baseline.entries.filter((b) => keep.has(b.id));
    const keepP = new Set(neededPrices.map((b) => b.id));
    const prices = (baseline.prices || []).filter((b) => keepP.has(b.id));
    writeFileSync(baselineFile, JSON.stringify({ $comment: BASELINE_COMMENT, entries, prices }, null, 1) + "\n");
    console.log(`check:claims: baseline ${baseline.entries.length} -> ${entries.length} figures, ${(baseline.prices || []).length} -> ${prices.length} price shapes (never grows)`);
    const rest = violations.filter((x) => x.code !== "baseline-stale");
    if (rest.length) { report(rest, args); process.exitCode = 1; }
    return;
  }
  if (violations.length) { report(violations, args); process.exitCode = 1; return; }
  console.log(`check:claims: OK — ${SELF_TESTS.length} self-tests, ${pages.length} indexable pages read, ${served.length} pages price-checked, ${registry.claims.length} registered, ${baseline.entries.length} grandfathered`);
}

const BASELINE_COMMENT = "Grandfathered figures that predate check:claims (SEO C2, 10/29/2026). entries = uncited figures in scope; prices = price-SHAPED dollar figures on served pages, each reviewed as not a ShelfSpace price (customer money, third-party costs, calculators, payment plans). Both only shrink: register or remove a figure (or mark money that is not ours with data-price-note), then run `node scripts/seo/check-claims.mjs --write-baseline`. Never add entries.";

function report(v, args) {
  const by = {};
  for (const x of v) by[x.code] = (by[x.code] || 0) + 1;
  console.error(`check:claims FAILED: ${v.length} violation(s) ${JSON.stringify(by)}`);
  for (const x of v.slice(0, 60)) console.error(`  ${x.code}  ${x.file}  ${x.detail}`);
  if (v.length > 60) console.error(`  … ${v.length - 60} more (--json for all)`);
  if (args.includes("--json")) console.log(JSON.stringify(v, null, 1));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main();
