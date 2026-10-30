// IndexNow URL list (SEO engine row A4; Z-A4a).
//   node scripts/seo/indexnow-urls.mjs <beforeSha> <afterSha>   -> one https URL per line
// Submits every URL whose index state or content changed between the two SHAs:
//   - an INDEXABLE page whose *.html changed (same "indexable" as the sitemap generator, so noindex /
//     redirect / utility pages are skipped);
//   - a page that BECAME indexable with no HTML change (a vercel.json noindex header or redirect removed, a
//     tutorial flipped to public in video-catalog.json);
//   - a page that STOPPED being indexable, including a deleted page (IndexNow takes removed URLs too: the
//     crawler re-fetches, sees the 404 / noindex / redirect and drops it).
// "Before" is read from the before commit's own tree (git archive of its *.html + vercel.json +
// video-catalog.json into a temp dir), so it uses exactly the same siteIndex() rules.
// A missing, unresolvable or all-zeros <beforeSha> (first push, force push) submits every indexable page.
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { indexablePages, siteIndex, ROOT } from "./build-sitemap.mjs";

const ORIGIN = "https://shelfspace.pro";
const ZEROS = /^0+$/;

const git = (args, opts = {}) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 28, ...opts });

const resolvable = (sha) => {
  if (!sha || ZEROS.test(sha)) return false;
  try { git(["cat-file", "-e", `${sha}^{commit}`], { stdio: "ignore" }); return true; } catch { return false; }
};

export function changedHtml(before, after) {
  if (!resolvable(before)) return null;
  return git(["diff", "--name-only", "--diff-filter=ACMR", before, after, "--", "*.html"]).split("\n").filter(Boolean);
}

/** Indexable paths as of commit `sha`, read from that commit's tree. */
export function indexablePathsAt(sha) {
  const files = git(["ls-tree", "-r", "--name-only", sha]).split("\n")
    .filter((f) => f.endsWith(".html") || f === "vercel.json" || f === "video-catalog.json");
  const T = mkdtempSync(join(tmpdir(), "indexnow-before-"));
  try {
    if (files.length) execFileSync("tar", ["-x", "-C", T], { input: git(["archive", "--format=tar", sha, "--", ...files], { encoding: "buffer" }), maxBuffer: 1 << 28 });
    return new Set(siteIndex(T).indexablePages({ extras: true }).map((p) => p.path));
  } finally { rmSync(T, { recursive: true, force: true }); }
}

export function urlsFor(before, after) {
  const pages = indexablePages();
  const changed = changedHtml(before, after);
  if (changed === null) return pages.map((p) => ORIGIN + p.path);
  const was = indexablePathsAt(before);
  const now = new Set(pages.map((p) => p.path));
  const set = new Set(changed);
  const out = new Set();
  for (const p of pages) if ((p.file && set.has(p.file) && existsSync(join(ROOT, p.file))) || !was.has(p.path)) out.add(p.path);
  for (const p of was) if (!now.has(p)) out.add(p); // de-indexed or deleted
  return [...out].sort().map((p) => ORIGIN + p);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [before, after = "HEAD"] = process.argv.slice(2);
  process.stdout.write(urlsFor(before, after).map((u) => u + "\n").join(""));
}
