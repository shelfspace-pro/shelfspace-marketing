// Generate sitemap.xml from the HTML files themselves (SEO engine row A1).
//   node scripts/seo/build-sitemap.mjs [--out path]   (default: ./sitemap.xml)
// A page is listed when it is indexable: no robots noindex, canonical points at itself,
// not an internal/utility file, not a redirect source, not X-Robots-Tag noindex in
// vercel.json, and (tutorials only) published on the hub (video-catalog.json privacy=public).
// lastmod = `git log -1 --format=%cs -- <file>` (today for a page with uncommitted changes). Output is sorted.
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const ORIGIN = "https://shelfspace.pro";

// Directories never walked (internal tooling, templates, assets).
const SKIP_DIRS = new Set(["node_modules", ".git", ".github", ".claude", "_pdf-source", "og-templates", "scripts", "marketing", "screenshots", "assets", "api", "logos", "email", "tutorials", ".well-known"]);
// Files that are not pages (internal, verification, or a utility form rather than content).
const SKIP_FILES = new Set(["email-signature.html", "verify.html"]);
const SKIP_PATTERNS = [/^google[0-9a-f]+\.html$/];
// Served by rewrites to the app: no local file, but indexable. Keep in the sitemap.
export const STATIC_EXTRAS = ["/how-to", "/how-to/retailer", "/how-to/vendor"];

// siteIndex(root) is the ONE definition of "indexable" (shared by check:sitemap, IndexNow and
// check:seo, so all three agree). The bare exports below are siteIndex(ROOT).
export const urlPath = (file) => file === "index.html" ? "/" : "/" + file.replace(/(?:^|\/)index\.html$/, "").replace(/\.html$/, "");

export function siteIndex(root = ROOT) {
  const vercelFile = join(root, "vercel.json");
  const vercel = existsSync(vercelFile) ? JSON.parse(readFileSync(vercelFile, "utf8")) : {};
  const redirectSources = new Set((vercel.redirects || []).map((r) => r.source).filter((s) => !s.includes(":")));
  const noindexSources = new Set((vercel.headers || []).filter((h) => (h.headers || []).some((x) => /x-robots-tag/i.test(x.key) && /noindex/i.test(x.value))).map((h) => h.source));

  function walk(dir = root) {
    const out = [];
    for (const name of readdirSync(dir).sort()) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) { if (!SKIP_DIRS.has(name)) out.push(...walk(p)); }
      else if (name.endsWith(".html")) out.push(relative(root, p));
    }
    return out;
  }

  // Why a file is not indexable, or null when it is.
  function exclusionReason(file, html) {
    if (SKIP_FILES.has(file) || SKIP_PATTERNS.some((r) => r.test(file))) return "internal/utility file";
    const path = urlPath(file);
    if (redirectSources.has(path)) return "redirect source";
    if (noindexSources.has(path)) return "X-Robots-Tag noindex";
    // Attribute order and quoting vary, and a commented-out tag is not a tag (Google ignores it).
    const live = html.replace(/<!--[\s\S]*?-->/g, "");
    const tagAttr = (tag, name) => { const m = tag.match(new RegExp(`(?:\\s|(?<=[^=\\s]["']))${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i")); return m ? (m[1] ?? m[2] ?? m[3]) : null; };
    const metas = live.match(/<meta\b[^>]*>/gi) || [];
    if (metas.some((t) => /^robots$/i.test(tagAttr(t, "name") || "") && /noindex/i.test(tagAttr(t, "content") || ""))) return "meta noindex";
    const canon = (live.match(/<link\b[^>]*>/gi) || []).find((t) => /(^|\s)canonical(\s|$)/i.test(tagAttr(t, "rel") || ""));
    const href = canon && tagAttr(canon, "href");
    if (!href) return "no canonical";
    if (href !== ORIGIN + (path === "/" ? "/" : path)) return `canonical elsewhere (${href})`;
    return null;
  }

  function publishedTutorials() {
    const f = join(root, "video-catalog.json");
    if (!existsSync(f)) return new Set();
    const cat = JSON.parse(readFileSync(f, "utf8"));
    return new Set(cat.videos.filter((v) => v.privacy === "public").map((v) => `tutorials/${v.slug}.html`));
  }

  // Every candidate page file (walked pages + published tutorials that exist).
  function pageFiles() {
    const tutorials = [...publishedTutorials()].filter((f) => existsSync(join(root, f)));
    return [...walk(root), ...tutorials];
  }

  // All indexable pages: [{ file|null, path }]
  function indexablePages({ extras = root === ROOT } = {}) {
    const pages = [];
    for (const file of pageFiles()) {
      const reason = exclusionReason(file, readFileSync(join(root, file), "utf8"));
      if (!reason) pages.push({ file, path: urlPath(file) });
    }
    if (extras) for (const path of STATIC_EXTRAS) pages.push({ file: null, path });
    return pages.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  }

  return { root, vercel, redirectSources, noindexSources, walk, exclusionReason, publishedTutorials, pageFiles, indexablePages };
}

const site = siteIndex(ROOT);
export const walk = (dir = ROOT) => site.walk(dir);
export const exclusionReason = site.exclusionReason;
export const indexablePages = () => site.indexablePages();

// lastmod = the page's last commit date (%cs). A page with uncommitted changes (or untracked) takes TODAY, so a
// sitemap regenerated before the commit already holds the date that commit will carry (Z-A4b: check:sitemap
// compares lastmod too, so a page edit that skips the regeneration goes red).
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
let dirtyCache = null;
function dirty(root = ROOT) {
  if (dirtyCache) return dirtyCache;
  const run = (a) => { try { return execFileSync("git", a, { cwd: root, encoding: "utf8" }).split("\n").filter(Boolean); } catch { return []; } };
  return (dirtyCache = new Set([...run(["diff", "--name-only", "HEAD"]), ...run(["ls-files", "--others", "--exclude-standard"])]));
}
export function lastmod(file) {
  if (!file) return null;
  if (dirty().has(file)) return today();
  try {
    const d = execFileSync("git", ["log", "-1", "--format=%cs", "--", file], { cwd: ROOT, encoding: "utf8" }).trim();
    if (d) return d;
  } catch {}
  return today();
}

export function buildSitemapXml() {
  const pages = indexablePages();
  // Pages with no file (app rewrites) take the newest lastmod of any file: they change when the site ships.
  const dated = pages.map((p) => ({ ...p, lastmod: lastmod(p.file) }));
  const newest = dated.map((p) => p.lastmod).filter(Boolean).sort().pop();
  const body = dated.map((p) => `  <url>\n    <loc>${ORIGIN}${p.path}</loc>\n    <lastmod>${p.lastmod || newest}</lastmod>\n  </url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const i = process.argv.indexOf("--out");
  const out = i > -1 ? process.argv[i + 1] : join(ROOT, "sitemap.xml");
  const xml = buildSitemapXml();
  writeFileSync(out, xml);
  console.log(`sitemap: ${(xml.match(/<url>/g) || []).length} URLs -> ${out}`);
}
