#!/usr/bin/env node
/**
 * Fence: email-signature.html must never embed images as `data:` URIs, and every
 * image it references must resolve 200 on the public site.
 *
 * Why: Gmail's signature editor strips `data:` image sources on paste. The mark
 * silently became a broken-image icon with alt text in every outgoing email
 * (caught 2026-07-22 on Jessa's signature). A hosted https URL survives the paste.
 *
 * Run: node scripts/check-email-signature.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const file = join(root, "email-signature.html");
const html = readFileSync(file, "utf8");
const errors = [];

// 1. No data: URIs in any <img src>
for (const m of html.matchAll(/<img\b[^>]*\bsrc="([^"]*)"/gi)) {
  if (/^data:/i.test(m[1])) {
    errors.push(
      `email-signature.html embeds an image as a data: URI (${m[1].slice(0, 40)}…). ` +
        `Gmail strips these on paste — host the file and reference it by https URL.`,
    );
  }
}

// 2. Every referenced image must be an absolute https URL that resolves 200
const srcs = [...html.matchAll(/<img\b[^>]*\bsrc="([^"]*)"/gi)].map((m) => m[1]);
for (const src of new Set(srcs)) {
  if (/^data:/i.test(src)) continue; // already reported above
  if (!/^https:\/\//i.test(src)) {
    errors.push(
      `email-signature.html references a non-absolute image src "${src}". ` +
        `Signatures render outside this site — use a full https URL.`,
    );
    continue;
  }
  let status = 0;
  try {
    status = (await fetch(src, { method: "HEAD" })).status;
  } catch (e) {
    errors.push(`email-signature.html image ${src} could not be fetched: ${e.message}`);
    continue;
  }
  if (status !== 200) {
    errors.push(`email-signature.html image ${src} returned HTTP ${status} (expected 200).`);
  }
}

if (errors.length) {
  console.error("✗ email signature check FAILED\n");
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}
console.error(`✓ email signature check passed (${new Set(srcs).size} image(s) verified)`);
