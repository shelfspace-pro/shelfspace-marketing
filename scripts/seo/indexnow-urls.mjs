// IndexNow URL list (SEO engine row A4).
//   node scripts/seo/indexnow-urls.mjs <beforeSha> <afterSha>   -> one https URL per line
// Changed *.html files between the two SHAs, mapped to clean URLs, kept only when the page is
// INDEXABLE (same logic as the sitemap generator, so noindex / redirect / utility pages are skipped).
// A missing, unresolvable or all-zeros <beforeSha> (first push, force push) submits every indexable page.
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { indexablePages, ROOT } from "./build-sitemap.mjs";

const ORIGIN = "https://shelfspace.pro";
const ZEROS = /^0+$/;

const git = (args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8" });

export function changedHtml(before, after) {
  if (!before || ZEROS.test(before)) return null;
  try { git(["cat-file", "-e", `${before}^{commit}`]); } catch { return null; }
  return git(["diff", "--name-only", "--diff-filter=ACMR", before, after, "--", "*.html"]).split("\n").filter(Boolean);
}

export function urlsFor(before, after) {
  const pages = indexablePages();
  const changed = changedHtml(before, after);
  if (changed === null) return pages.map((p) => ORIGIN + p.path);
  const set = new Set(changed);
  return pages.filter((p) => p.file && set.has(p.file) && existsSync(join(ROOT, p.file))).map((p) => ORIGIN + p.path);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [before, after = "HEAD"] = process.argv.slice(2);
  process.stdout.write(urlsFor(before, after).map((u) => u + "\n").join(""));
}
