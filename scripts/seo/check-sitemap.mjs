// check:sitemap — fails when the committed sitemap.xml drifts from what the generator emits,
// when an indexable page is missing, or when a non-indexable page is listed.
import { readFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { ROOT, indexablePages } from "./build-sitemap.mjs";

const fail = [];
const committed = readFileSync(join(ROOT, "sitemap.xml"), "utf8");
const locs = new Set([...committed.matchAll(/<loc>https:\/\/shelfspace\.pro([^<]*)<\/loc>/g)].map((m) => m[1]));

const pages = indexablePages();
if (pages.length < 100) fail.push(`only ${pages.length} indexable pages found (expected 200+): enumeration is broken`);
const missing = pages.filter((p) => !locs.has(p.path)).map((p) => p.path);
if (missing.length) fail.push(`indexable pages missing from sitemap.xml (${missing.length}):\n  ${missing.join("\n  ")}`);
const wanted = new Set(pages.map((p) => p.path));
const extra = [...locs].filter((l) => !wanted.has(l));
if (extra.length) fail.push(`sitemap.xml lists non-indexable URLs (${extra.length}):\n  ${extra.join("\n  ")}`);

const tmp = join(mkdtempSync(join(tmpdir(), "sitemap-")), "sitemap.xml");
execFileSync("node", [join(ROOT, "scripts/seo/build-sitemap.mjs"), "--out", tmp], { stdio: "pipe" });
if (readFileSync(tmp, "utf8") !== committed) fail.push("sitemap.xml differs from a fresh build (run: node scripts/seo/build-sitemap.mjs)");

if (fail.length) { console.error("check:sitemap FAILED\n" + fail.join("\n")); process.exit(1); }
console.log(`check:sitemap OK (${pages.length} URLs)`);
