#!/usr/bin/env node
// Fence for the sitewide CTA sweep (sales row D3). Exits 1 on any of:
//   A  a primary CTA (nav button or in-page button, any href) still carries an old label
//   B  a primary /contact CTA whose label isn't "Schedule a call"
//   C  a non-footer /contact link without a valid, page-unique ?cta=<page>-<slot>
//   D  an in-page primary button without its microcopy line
//   E  a partner CTA (for-bookkeepers, partner call) without path=partner
//   F  the sweep is not idempotent: re-running it would change a page
//   G  the docs CTA note (microcopy on a dark box) is too faint
//
//   node scripts/check-cta.mjs          (npm run check:cta)

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { LABEL, MICRO, ON_DARK, isPartnerCta, OLD_LABELS, CTA_RE, listPages, GENERATED, findContactAnchors, kind, visibleText, attr } from "./cta-lib.mjs";
import { sweep } from "./cta-sweep.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const fails = [];
const fail = (rel, code, msg) => fails.push(`${code} ${rel}: ${msg}`);
const OLD = new Set(OLD_LABELS.map((l) => l.toLowerCase()));
const MICROS = new Set(Object.values(MICRO));

let pages = 0, tagged = 0, primaries = 0;
for (const rel of listPages(ROOT)) {
  const html = readFileSync(join(ROOT, rel), "utf8");
  pages++;

  // A — any button-styled link or <button>, wherever it points
  for (const m of html.matchAll(/<(?:a|button)\b([^>]*)>([\s\S]*?)<\/(?:a|button)>/g)) {
    const cls = (attr(m[0].slice(0, m[0].indexOf(">") + 1), "class") || "").split(/\s+/);
    const isButton = cls.some((c) => c === "nav-cta" || /btn/.test(c) || c === "pri" || c === "qd-go");
    if (!isButton) continue;
    const text = visibleText(m[2]).toLowerCase();
    if (OLD.has(text)) fail(rel, "A", `button still says "${visibleText(m[2])}"`);
  }

  const seen = new Set();
  for (const a of findContactAnchors(html)) {
    const k = kind(a);
    if (k === "footer") continue;
    const href = a.href.replace(/&amp;/g, "&");
    const q = new URLSearchParams((href.split("?")[1] || "").split("#")[0]);
    const cta = q.get("cta");
    // C
    if (!cta || !CTA_RE.test(cta)) fail(rel, "C", `/contact link without a valid cta (${a.href})`);
    else if (seen.has(cta)) fail(rel, "C", `cta "${cta}" used twice on the page`);
    else { seen.add(cta); tagged++; }
    // E
    const partner = isPartnerCta(rel, cta);
    if (q.get("subject")) fail(rel, "E", `old subject= param on a /contact link (${a.href})`);
    if (partner && q.get("path") !== "partner") fail(rel, "E", `partner CTA without path=partner (${a.href})`);
    if (!partner && q.get("path") === "partner") fail(rel, "E", `path=partner on a non-partner CTA (${a.href})`);
    if (k === "inline") continue;
    primaries++;
    // B
    const label = visibleText(a.inner);
    if (label !== LABEL) fail(rel, "B", `primary /contact CTA says "${label}"`);
    // D
    if (k !== "primary") continue;
    const cls = attr(a.tag, "class") || "";
    const sticky = a.ancestors.some((n) => /sticky/.test(attr(n.tag, "class") || "")) || /(^|\s)(pri|qd-go)(\s|$)/.test(cls);
    const docsCta = a.parent && /\bdocs-cta\b/.test(attr(a.parent.tag, "class") || "");
    const after = html.slice(a.end, a.end + 400);
    if (docsCta) {
      const note = after.match(/^\s*<div class="docs-cta-note">([^<]*)<\/div>/);
      if (!note) fail(rel, "D", `docs CTA (${a.href}) has no microcopy note under it`);
      else if (!MICROS.has(note[1])) fail(rel, "D", `docs CTA note is "${note[1]}", not page microcopy`);
    } else if (!sticky) {
      // stack mode: <span class="cta-stack"><a…>…</a><span class="cta-micro">…</span></span>
      // row mode:   the button's row ends with <span class="cta-micro cta-micro--row">…</span>
      const inStack = a.parent && /\bcta-stack\b/.test(attr(a.parent.tag, "class") || "");
      let micro = null;
      if (inStack) micro = after.match(/^<span class="(cta-micro[^"]*)">([^<]*)<\/span>/);
      else if (a.parent) micro = html.slice(a.end, a.parent.end).match(/<span class="(cta-micro[^"]*\bcta-micro--row\b[^"]*)">([^<]*)<\/span>\s*<\/[a-z]+>$/);
      if (!micro || !MICROS.has(micro[2])) fail(rel, "D", `primary CTA (${a.href}) has no microcopy line under it`);
      else if (ON_DARK.has(cta) !== /\bcta-micro--on-dark\b/.test(micro[1])) fail(rel, "D", `microcopy under ${cta} has the wrong on-dark class (dark panel: ${ON_DARK.has(cta)})`);
    }
  }

  // C — a script that sends the visitor to /contact must tag it too
  for (const m of html.matchAll(/location(?:\.href\s*=|\s*=|\.assign\s*\(|\.replace\s*\()\s*['"](\/contact[^'"]*)['"]/g)) {
    const cta = new URLSearchParams((m[1].split("?")[1] || "")).get("cta");
    if (!cta || !CTA_RE.test(cta)) fail(rel, "C", `script redirect to ${m[1]} without a cta`);
  }

  // G — the docs CTA note is the microcopy on a dark box: keep it readable (0.5 was 4.06:1)
  for (const m of html.matchAll(/\.docs-cta-note\s*\{[^}]*color:\s*rgba\(255,\s*255,\s*255,\s*([\d.]+)\)/g)) {
    if (Number(m[1]) < 0.7) fail(rel, "G", `.docs-cta-note text alpha ${m[1]} is too faint on the dark CTA box (use 0.75)`);
  }

  // F
  if (!GENERATED(rel) && sweep(rel, html) !== html) fail(rel, "F", "re-running scripts/cta-sweep.mjs would change this page");
}

if (pages < 200 || tagged < 400) fails.push(`SANITY: only ${pages} pages / ${tagged} tagged links scanned — the walker is broken`);
if (fails.length) {
  console.error(fails.join("\n"));
  console.error(`\ncheck:cta FAILED — ${fails.length} problem(s). Fix: node scripts/cta-sweep.mjs (pages) or scripts/build-tutorials.mjs (tutorials).`);
  process.exit(1);
}
console.log(`check:cta ok — ${pages} pages, ${tagged} tagged /contact links, ${primaries} primary CTAs all "${LABEL}"`);
