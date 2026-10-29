// The figure extractor shared by check:claims (SEO engine row C2).
//
// The block between the BEGIN/END markers is a VERBATIM copy of row B1's scraper, build-claims.mjs (kept in a
// private repo; it builds the private claims list),
// so the public gate and the private list read the same figures out of the same markup.
// Never edit inside the markers: change B1's scraper, then re-copy the block and
// update VENDORED_SHA256 below. check:claims re-hashes the block on every run and fails
// on any drift, so a local "fix" here cannot quietly make the two parsers disagree.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

export const VENDORED_FROM = "B1 build-claims.mjs (copied 10/29/2026)";
export const VENDORED_SHA256 = "cc59769ef02f2c651710b6f817b8004302317b10ac6cc8dc9e16c05b4fcdebe5";

// ---- BEGIN verbatim ----
const BLOCK_SEL = "p, li, td, th, h1, h2, h3, h4, blockquote, figcaption, dt, dd";
const STRIP_SEL = "nav, header, footer, script, style, noscript, svg, template";

const UNITS =
  "days?|weeks?|months?|years?|hours?|minutes?|brands?|stores?|dispensar(?:y|ies)|invoices?|licen[cs]es|payers?|vendors?|customers?|retailers?|states?|clicks?|visits?|domains?|keywords?|times|x|calls?|emails?|reminders?|locations?|companies|sellers?|growers?|distributors?|employees?|people|hrs?";

// A number: digits, optional thousands groups, optional decimals. Never a trailing
// comma ("$27,000, and" is "$27,000").
const NUM = String.raw`\d+(?:,\d{3})*(?:\.\d+)?`;

// Order matters: the first alternative that matches a span wins.
const CLAIM_RE = new RegExp(
  [
    String.raw`\$\s?${NUM}(?:\s?(?:[KkMmBb]\b|million|billion|thousand))?(?:\s?[-–]\s?\$?${NUM}(?:\s?(?:[KkMmBb]\b|million|billion))?)?(?:\s?(?:\/|per\s)\s?(?:month|mo|year|yr|week|invoice|check|call|user|location)\b)?`,
    String.raw`(?<![\d,.])${NUM}(?:\s?[-–]\s?${NUM})?\s?(?:%|percent\b)`,
    // A year is not a count: "Fall 2026 dispensary data" is no claim.
    String.raw`\b(?!(?:19|20)\d{2}\b)${NUM}(?:\s?[-–]\s?${NUM})?[-\s](?:${UNITS})\b`,
    String.raw`\b[Nn]et[-\s]\d{1,3}\b`,
    String.raw`\b\d{1,3}(?:,\d{3})+\b`,
  ].join("|"),
  "g",
);

/** A stat card's number on its own ("38") — read together with its label block. */
const BARE_NUMBER = new RegExp(String.raw`^\$?${NUM}[%+xX]?$`);

/** A sentence about our own numbers. Its figures are ours, not the linked source's. */
// "us" is lower-case only, so "the US market" is not first person.
const FIRST_PERSON = /\b(?:[Oo]ur|[Ww]e|us|ShelfSpace)\b/;


function isOutbound(href) {
  if (!/^https?:\/\//i.test(href)) return false;
  try {
    const h = new URL(href).hostname.replace(/^www\./, "");
    const own = ["shelfspace.pro", "ourshelf.space"];
    return !own.some((d) => h === d || h.endsWith("." + d));
  } catch {
    return false;
  }
}

function norm(s) {
  return s.replace(/\s+/g, " ").trim();
}

/** "$ 4,791,318" / "88 %" (markup split across spans) read as "$4,791,318" / "88%". */
function normValue(v) {
  return norm(v).replace(/\$\s+/g, "$").replace(/\s+%/g, "%");
}

// Dotted initials ("U.S", "e.g") and common abbreviations. Never a lone letter: "$10-15K."
// and "P&L." end sentences. Never "No": it opens FAQ answers ("No. Every plan…").
const ABBREV = /(?:^|[^A-Za-z])(?:[A-Za-z]\.[A-Za-z]|vs|etc|Inc|Co|Corp|Ltd|LLC|Mr|Ms|Mrs|Dr|St|Jr|Sr|approx|Rev|Sec)$/;

/** Is text[i] the end of a sentence? Not a "." inside a number, nor after "U.S" / "e.g" / "Inc". */
function isSentenceEnd(text, i) {
  const ch = text[i];
  if (ch === "!" || ch === "?") return true;
  if (ch !== ".") return false;
  // Only a "." followed by a space (or the end, or a closing quote/paren) ends a sentence:
  // not "$12,225.50", not the first dot of "U.S.".
  const next = text[i + 1];
  if (next !== undefined && !/[\s"'’”)\]]/.test(next)) return false;
  return !ABBREV.test(text.slice(Math.max(0, i - 8), i));
}

function sentenceBounds(text, idx, len) {
  let start = idx;
  while (start > 0 && !(/\s/.test(text[start - 1]) && isSentenceEnd(text, start - 2))) start--;
  let end = idx + len;
  while (end < text.length && !isSentenceEnd(text, end)) end++;
  return { start, end: Math.min(end + 1, text.length) };
}

function sentenceAround(text, idx, len) {
  // The sentence containing [idx, idx+len), capped at ~240 chars.
  const { start, end } = sentenceBounds(text, idx, len);
  let s = text.slice(start, end).trim();
  if (s.length > 240) {
    const rel = idx - start;
    const a = Math.max(0, rel - 110);
    s = (a > 0 ? "…" : "") + s.slice(a, a + 220).trim() + "…";
  }
  return s;
}

function pageSources(doc) {
  for (const h of doc.querySelectorAll("h2, h3, h4")) {
    if (!/^\s*sources?\b/i.test(h.textContent || "")) continue;
    const urls = [];
    let n = h.nextElementSibling;
    while (n && !/^H[1-4]$/.test(n.tagName)) {
      for (const a of n.querySelectorAll("a[href]")) {
        const href = a.getAttribute("href");
        if (isOutbound(href) && !urls.includes(href)) urls.push(href);
      }
      n = n.nextElementSibling;
    }
    if (urls.length) return urls;
  }
  return [];
}

const UNIT_SEL = "div, section, article, aside, figure, main, body";

/**
 * The text units claims are read from. Every text node belongs to its NEAREST block
 * (p / li / td / th / h1-h4 / blockquote / figcaption / dt / dd), so nested blocks
 * keep their own text and a parent <li>'s direct text is not lost; text in no block
 * at all (product-page hero lines, stat cards, the guarantee banner are bare
 * <div>/<span>s) belongs to its nearest div/section. Without that, the scan missed
 * every figure in a div, e.g. the accounts-receivable guarantee.
 *
 * Text nodes are joined exactly as the source has them (whitespace nodes included),
 * so "$<span>4,791,318</span>" reads "$4,791,318". Each unit carries its outbound
 * links with the offset where the link's text starts.
 */
function textUnits(scope) {
  const doc = scope.ownerDocument;
  const groups = new Map();
  const walker = doc.createTreeWalker(scope, 4 /* NodeFilter.SHOW_TEXT */);
  while (walker.nextNode()) {
    const n = walker.currentNode;
    const parent = n.parentElement;
    if (!parent) continue;
    const key = parent.closest(BLOCK_SEL) || parent.closest(UNIT_SEL) || scope;
    if (!groups.has(key)) groups.set(key, { raw: "", links: [], lastParent: null });
    const g = groups.get(key);
    const t = n.textContent || "";
    // Adjacent elements with no whitespace between them ("<span>$152,430.10</span><span>18 invoices</span>")
    // are separate values: put a space at the element boundary, except where the markup
    // only splits one value ("<span>$</span><span>4,791,318</span>", "88<span>%</span>").
    if (g.lastParent && g.lastParent !== parent && g.raw && t && !/\s$/.test(g.raw) && !/^\s/.test(t)) {
      const glued =
        (/\$$/.test(g.raw) && /^\d/.test(t)) || // "<span>$</span><b>200</b>"
        (/\d$/.test(g.raw) && /^(?:[%+/]|[KkMmBbxX](?![a-z]))/.test(t)) || // "200</b>K+/yr", "10,000</b>x", "$3,000</span>/month"
        (/[–-]$/.test(g.raw) && /^\$/.test(t)) || // "K–</span><span>$"
        /^[.,;:)!?'’”/]/.test(t) || // punctuation after </a> or </strong>; "K<small>/yr</small>"
        /[($“]$/.test(g.raw) || // after an opening paren or quote
        (/[a-z]$/i.test(g.raw) && /^[a-z]/.test(t)); // a word split by markup ("Shelf<span>iQ</span>")
      if (!glued) g.raw += " ";
    }
    g.lastParent = parent;
    const href = parent.closest("a[href]")?.getAttribute("href");
    if (href && isOutbound(href) && t.trim()) g.links.push({ href, rawAt: g.raw.length });
    g.raw += t;
  }
  const units = [];
  const merged = new Set();
  for (const [el, g] of groups) {
    if (merged.has(el)) continue; // a stat label already read with its number
    // Normalize whitespace and carry each link offset through the normalization.
    let text = "";
    const map = [];
    let prevSpace = true;
    for (let i = 0; i < g.raw.length; i++) {
      map[i] = text.length;
      const ch = g.raw[i];
      if (/\s/.test(ch)) {
        if (!prevSpace) text += " ";
        prevSpace = true;
      } else {
        text += ch;
        prevSpace = false;
      }
    }
    text = text.trimEnd();
    if (!text) continue;
    const links = g.links.map((l) => ({ href: l.href, at: map[l.rawAt] ?? text.length }));
    if (BARE_NUMBER.test(text) && el.matches?.(BLOCK_SEL) && el.nextElementSibling) {
      const label = norm(el.nextElementSibling.textContent || "");
      if (label) {
        text = `${text} ${label}`;
        merged.add(el.nextElementSibling);
      }
    }
    units.push({ text, links });
  }
  return units;
}

/**
 * How a claim is cited. Inline = an outbound link inside the claim's own sentence.
 * In a sentence about our own numbers ("Our 70% is higher than the 56% national
 * estimate [link]") only the figure nearest before the link takes that link; the
 * others are ours and stay uncited, page Sources included.
 */
function citationFor(text, links, m, matches, sources) {
  const { start, end } = sentenceBounds(text, m.index, m[0].length);
  const inSentence = links.filter((l) => l.at >= start && l.at < end);
  const firstPerson = FIRST_PERSON.test(text.slice(start, end));
  // The link right after the figure (no other figure in between) is its source.
  const mEnd = m.index + m[0].length;
  let link =
    inSentence.find((l) => l.at >= m.index && !matches.some((o) => o !== m && o.index >= mEnd && o.index < l.at)) ||
    null;
  // Third-person sentence with the source named first ("LeafLink wrote … $4B"): the nearest link before it.
  if (!link && !firstPerson) link = [...inSentence].reverse().find((l) => l.at < m.index) || null;
  if (link) return { status: "cited", citation_scope: "inline", source_url: link.href };
  if (sources.length && !firstPerson) return { status: "cited", citation_scope: "page_sources", source_url: null };
  return { status: "uncited", citation_scope: null, source_url: null };
}

// ---- END verbatim ----

/** sha256 of the verbatim block as it sits in this file (the drift check). */
export function vendoredBlockHash() {
  const src = readFileSync(fileURLToPath(import.meta.url), "utf8");
  const a = src.indexOf("// ---- BEGIN verbatim ----\n");
  const b = src.indexOf("// ---- END verbatim ----");
  if (a < 0 || b <= a) return null;
  const block = src.slice(a, b);
  // A block that lost its body would hash to something; insist it still holds the parser.
  if (!/const CLAIM_RE = new RegExp/.test(block) || !/function textUnits\(/.test(block) || !/function citationFor\(/.test(block)) return null;
  return createHash("sha256").update(block).digest("hex");
}

export { CLAIM_RE, BARE_NUMBER, STRIP_SEL, norm, isOutbound, normValue, sentenceBounds, sentenceAround, pageSources, textUnits, citationFor };

/** B1's claim id: rel + sha1(rel|value|snippet), so an id here is the same id as in the private list. */
export function claimId(rel, value, snippet) {
  const key = `${rel}|${value}|${snippet}`;
  return rel.replace(/\.html$/, "").replace(/[^a-z0-9]+/gi, "-") + "-" + createHash("sha1").update(key).digest("hex").slice(0, 8);
}

export const pageUrlFor = (rel) => "https://shelfspace.pro/" + rel.replace(/(^|\/)index\.html$/, "$1").replace(/\.html$/, "");

/**
 * Claims inside the given region elements, read exactly as B1's scanHtml reads `.article-body`:
 * same text units, same CLAIM_RE, same snippet, same id, same citation rule. `sourcesScope` is
 * where the page's "Sources" heading is looked for (B1: the article body).
 */
export function scanRegions(regions, rel, sourcesScope) {
  const sources = pageSources(sourcesScope);
  const page = pageUrlFor(rel);
  const claims = [];
  const seen = new Set();
  for (const region of regions) {
    for (const { text, links } of textUnits(region)) {
      const matches = [...text.matchAll(CLAIM_RE)];
      for (const m of matches) {
        const value = normValue(m[0]);
        const snippet = sentenceAround(text, m.index, m[0].length);
        const key = `${rel}|${value}|${snippet}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const { status, citation_scope, source_url } = citationFor(text, links, m, matches, sources);
        claims.push({ id: claimId(rel, value, snippet), value, page, text_snippet: snippet, status, citation_scope, source_url });
      }
    }
  }
  return { claims, sources, page };
}

export const parse = (html) => new JSDOM(html).window.document;
