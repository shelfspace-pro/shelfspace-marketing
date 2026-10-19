#!/usr/bin/env node
// Sitewide CTA sweep (sales row D3). Idempotent: a second run changes nothing.
//
//   node scripts/cta-sweep.mjs            rewrite pages in place
//   node scripts/cta-sweep.mjs --dry      print what would change
//
// Every primary /contact button → "Schedule a call" + one line of page microcopy
// under it; every non-footer /contact link → /contact?cta=<page>-<slot>
// (+ &path=partner on partner CTAs). Inline text links keep their words (they are
// part of a sentence) but get a cta tag. Footer "Contact" links are untouched.
// tutorials/*.html come from scripts/build-tutorials.mjs, which carries the same
// nav CTA itself — this script skips them.
//
// Check: scripts/check-cta.mjs (npm run check:cta).

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { LABEL, MICRO, ON_DARK, listPages, GENERATED, pageId, ctaId, audience, findContactAnchors, kind, slotFor, attr } from "./cta-lib.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DRY = process.argv.includes("--dry");

const MICRO_CSS = `<style id="cta-micro-css">.cta-stack{display:inline-block;max-width:100%;vertical-align:top}.cta-micro{display:block;margin-top:10px;font-size:14px;line-height:1.4;opacity:.8}</style>`;

const UNWRAP_RE = /<span class="cta-stack">(<a\b[\s\S]*?<\/a>)(?:<span class="cta-micro[^"]*">[^<]*<\/span>)+<\/span>/g;

function microHtml(rel, partner, id) {
  const c = ON_DARK.has(id) ? "cta-micro cta-micro--on-dark" : "cta-micro";
  if (partner) return `<span class="${c}">${MICRO.partner}</span>`;
  if (rel === "pricing.html") return `<span class="${c} show-retailer">${MICRO.store}</span><span class="${c} show-vendor">${MICRO.brand}</span>`;
  return `<span class="${c}">${MICRO[audience(rel)]}</span>`;
}

function newHref(oldHref, id, partner) {
  const abs = oldHref.startsWith("https://shelfspace.pro") ? "https://shelfspace.pro" : "";
  const q = new URLSearchParams((oldHref.split("?")[1] || "").split("#")[0]);
  q.delete("cta"); q.delete("path"); q.delete("subject");
  const rest = q.toString();
  return `${abs}/contact?cta=${id}${partner ? "&amp;path=partner" : ""}${rest ? "&amp;" + rest.replace(/&/g, "&amp;") : ""}`;
}

function relabel(inner) {
  const svgs = inner.match(/<svg\b[\s\S]*?<\/svg>/g) || [];
  return svgs.length ? `${LABEL} ${svgs.join("")}` : LABEL;
}

export function sweep(rel, html) {
  let src = html.replace(UNWRAP_RE, "$1");
  const anchors = findContactAnchors(src);
  for (const a of anchors) a.href = a.href.replace(/&amp;/g, "&");
  const page = pageId(rel);
  const pageAud = audience(rel);
  const edits = [];
  const removed = new Set();

  // One /contact action per group: next to a primary /contact button, a btn-secondary
  // or bare text link to the same page is a duplicate ("Schedule a call" + "Talk to us").
  const byParent = new Map();
  for (const a of anchors) if (kind(a) !== "footer" && kind(a) !== "nav" && a.parent) {
    const k = a.parent.start;
    if (!byParent.has(k)) byParent.set(k, []);
    byParent.get(k).push(a);
  }
  for (const group of byParent.values()) {
    const keep = group.find((a) => kind(a) === "primary" && !/\bbtn-secondary\b/.test(attr(a.tag, "class") || ""));
    if (!keep) continue;
    for (const a of group) if (a !== keep && (kind(a) === "inline" || /\bbtn-secondary\b/.test(attr(a.tag, "class") || ""))) removed.add(a);
  }

  const seen = new Map();
  for (const a of anchors) {
    const k = kind(a);
    if (k === "footer") continue;
    if (removed.has(a)) {
      let s = a.start;
      while (s > 0 && /\s/.test(src[s - 1])) s--;
      edits.push({ start: s, end: a.end, text: "" });
      continue;
    }
    const base = slotFor(a);
    const n = (seen.get(base) || 0) + 1;
    seen.set(base, n);
    const slot = n === 1 ? base : `${base}-${n}`;
    const partner = pageAud === "partner" || /[?&](path=partner|subject=partner-call)\b/.test(a.href) || /partner/i.test(a.inner.replace(/<[^>]+>/g, ""));
    const id = ctaId(page, slot);
    const href = newHref(a.href, id, partner);
    let tag = a.tag.replace(/(\shref\s*=\s*")[^"]*(")/i, `$1${href}$2`);
    let inner = a.inner;
    if (k === "nav" || k === "primary") inner = relabel(inner);
    let out = `${tag}${inner}</a>`;
    if (k === "primary") {
      const inDocsCta = a.parent && /\bdocs-cta\b/.test(attr(a.parent.tag, "class") || "");
      // a sticky bar already carries its own line; the founder card's link row and the
      // unlinked quote builder are too tight for a second line
      const inSticky = a.ancestors.some((n) => /sticky/.test(attr(n.tag, "class") || ""))
        || /(^|\s)(pri|qd-go)(\s|$)/.test(attr(a.tag, "class") || "");
      if (inDocsCta) {
        // the docs CTA box already has a note line under its button: it becomes the microcopy
        const after = src.slice(a.end, a.parent.end);
        const note = after.match(/^(\s*<div class="docs-cta-note">)[^<]*(<\/div>)/);
        if (note) edits.push({ start: a.end + note[1].length, end: a.end + note[0].length - note[2].length, text: MICRO[partner ? "partner" : pageAud] });
      } else if (!inSticky) {
        out = `<span class="cta-stack">${out}${microHtml(rel, partner, id)}</span>`;
      }
    }
    edits.push({ start: a.start, end: a.end, text: out });
  }
  edits.sort((x, y) => y.start - x.start);
  for (const e of edits) src = src.slice(0, e.start) + e.text + src.slice(e.end);
  if (!/styles\.css/.test(src) && /class="cta-stack"/.test(src) && !src.includes('id="cta-micro-css"')) {
    src = src.replace("</head>", `${MICRO_CSS}\n</head>`);
  }
  return src;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  let changed = 0;
  for (const rel of listPages(ROOT)) {
    if (GENERATED(rel)) continue;
    const p = join(ROOT, rel);
    const html = readFileSync(p, "utf8");
    const out = sweep(rel, html);
    if (out !== html) {
      changed++;
      if (DRY) console.log(`would change ${rel}`);
      else writeFileSync(p, out);
    }
  }
  console.log(`${DRY ? "would change" : "changed"} ${changed} page(s)`);
}
