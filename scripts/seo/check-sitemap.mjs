// check:sitemap — fails when the committed sitemap.xml drifts from what the generator emits,
// when an indexable page is missing, or when a non-indexable page is listed.
import { readFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { ROOT, indexablePages, walk, exclusionReason } from "./build-sitemap.mjs";

const fail = [];
const committed = readFileSync(join(ROOT, "sitemap.xml"), "utf8");
const locs = new Set([...committed.matchAll(/<loc>https:\/\/shelfspace\.pro([^<]*)<\/loc>/g)].map((m) => m[1]));

const pages = indexablePages();
if (pages.length < 200) fail.push(`only ${pages.length} indexable pages found (expected 200+): enumeration is broken`);
const missing = pages.filter((p) => !locs.has(p.path)).map((p) => p.path);
if (missing.length) fail.push(`indexable pages missing from sitemap.xml (${missing.length}):\n  ${missing.join("\n  ")}`);
const wanted = new Set(pages.map((p) => p.path));
const extra = [...locs].filter((l) => !wanted.has(l));
if (extra.length) fail.push(`sitemap.xml lists non-indexable URLs (${extra.length}):\n  ${extra.join("\n  ")}`);

// A page that is silently dropped for a missing / wrong canonical would pass every check above.
const badCanon = walk(ROOT).map((f) => [f, exclusionReason(f, readFileSync(join(ROOT, f), "utf8"))]).filter(([, r]) => r && /canonical/.test(r));
if (badCanon.length) fail.push(`pages with a missing or non-self canonical (add one, or noindex them):\n  ${badCanon.map(([f, r]) => `${f}: ${r}`).join("\n  ")}`);

const tmp = join(mkdtempSync(join(tmpdir(), "sitemap-")), "sitemap.xml");
execFileSync("node", [join(ROOT, "scripts/seo/build-sitemap.mjs"), "--out", tmp], { stdio: "pipe" });
// lastmod is compared too (Z-A4b: a page edited without regenerating kept its old lastmod for weeks). It comes
// from git history, which only a full clone has: a shallow clone (every file = the HEAD date) compares the URLs
// alone and says so; CI checks out with fetch-depth 0.
const noLastmod = (x) => x.replace(/<lastmod>[^<]*<\/lastmod>/g, "");
const fresh = readFileSync(tmp, "utf8");
let shallow = false;
try { shallow = execFileSync("git", ["rev-parse", "--is-shallow-repository"], { cwd: ROOT, encoding: "utf8" }).trim() === "true"; } catch {}
if (noLastmod(fresh) !== noLastmod(committed)) fail.push("sitemap.xml differs from a fresh build (run: node scripts/seo/build-sitemap.mjs)");
else if (shallow) console.log("check:sitemap: shallow clone, lastmod not compared");
else if (fresh !== committed) {
  const want = new Map([...fresh.matchAll(/<loc>([^<]*)<\/loc>\s*<lastmod>([^<]*)<\/lastmod>/g)].map((m) => [m[1], m[2]]));
  const stale = [...committed.matchAll(/<loc>([^<]*)<\/loc>\s*<lastmod>([^<]*)<\/lastmod>/g)].filter((m) => want.get(m[1]) !== m[2]).map((m) => `${m[1]}: ${m[2]} (page last changed ${want.get(m[1])})`);
  fail.push(`sitemap.xml lastmod stale on ${stale.length} URL(s) (run: node scripts/seo/build-sitemap.mjs):\n  ${stale.slice(0, 20).join("\n  ")}`);
}

if (fail.length) { console.error("check:sitemap FAILED\n" + fail.join("\n")); process.exit(1); }
console.log(`check:sitemap OK (${pages.length} URLs)`);
