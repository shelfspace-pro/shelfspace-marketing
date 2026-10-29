// SEO row A4 fence: Speed Insights tag, deferred widget, and the IndexNow URL mapping + workflow.
//   node scripts/seo/check-head.mjs
import { readFileSync, readdirSync, statSync, mkdtempSync, mkdirSync, writeFileSync, copyFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const fails = [];
const fail = (m) => fails.push(m);
const SI = "/_vercel/speed-insights/script.js";

// 1. every served page (not email/pdf-source/og templates/google verification) carries Speed Insights; the widget is deferred.
const files = execFileSync("git", ["ls-files", "*.html"], { cwd: ROOT, encoding: "utf8" }).split("\n").filter(Boolean)
  .filter((f) => !/^(email|_pdf-source|og-templates|scripts)\//.test(f) && !/^google[0-9a-f]+\.html$/.test(f));
if (files.length < 200) fail(`only ${files.length} html files found (expected 200+): region empty`);
for (const f of files) {
  const h = readFileSync(join(ROOT, f), "utf8");
  if (!h.includes(`<script defer src="${SI}"></script>`)) fail(`${f}: missing deferred Speed Insights script`);
  if (/<script(?![^>]*\bdefer\b)[^>]*shelfiq-widget\.js/.test(h)) fail(`${f}: shelfiq-widget.js is not deferred`);
  if (/<script[^>]*shelfiq-widget\.js/.test(h) && !/<script defer src="\/shelfiq-widget\.js"><\/script>/.test(h)) fail(`${f}: shelfiq-widget.js tag is not the canonical deferred form`);
}
const bt = readFileSync(join(ROOT, "scripts/build-tutorials.mjs"), "utf8");
if (!bt.includes(SI)) fail("build-tutorials.mjs template lacks Speed Insights (tutorials would lose it on regenerate)");

// 2. IndexNow URL mapping, in a throwaway repo so the fixture is deterministic.
const T = mkdtempSync(join(tmpdir(), "indexnow-"));
const run = (...a) => execFileSync("git", a, { cwd: T, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
mkdirSync(join(T, "scripts/seo"), { recursive: true }); mkdirSync(join(T, "blog"), { recursive: true });
for (const f of ["build-sitemap.mjs", "indexnow-urls.mjs"]) copyFileSync(join(ROOT, "scripts/seo", f), join(T, "scripts/seo", f));
copyFileSync(join(ROOT, "vercel.json"), join(T, "vercel.json")); copyFileSync(join(ROOT, "video-catalog.json"), join(T, "video-catalog.json"));
const page = (path, extra = "") => `<!DOCTYPE html><html><head><link rel="canonical" href="https://shelfspace.pro${path}">${extra}</head><body>x</body></html>`;
const write = (f, s) => writeFileSync(join(T, f), s);
write("index.html", page("/")); write("about.html", page("/about")); write("blog/post.html", page("/blog/post"));
write("noidx.html", page("/noidx", '<meta name="robots" content="noindex">')); write("other.html", page("/elsewhere"));
run("init", "-q"); run("config", "user.email", "t@t"); run("config", "user.name", "t"); run("add", "-A"); run("commit", "-qm", "base");
const base = run("rev-parse", "HEAD").trim();
for (const f of ["index.html", "blog/post.html", "noidx.html", "other.html"]) write(f, readFileSync(join(T, f), "utf8").replace("x</body>", "y</body>"));
write("notes.txt", "n"); run("add", "-A"); run("commit", "-qm", "change");
const urls = (b) => execFileSync("node", ["scripts/seo/indexnow-urls.mjs", b, "HEAD"], { cwd: T, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).split("\n").filter(Boolean);
const got = urls(base).join(",");
if (got !== "https://shelfspace.pro/,https://shelfspace.pro/blog/post") fail(`changed-range mapping wrong: ${got}`);
const all = urls("0".repeat(40)).join(",");
if (all !== "https://shelfspace.pro/,https://shelfspace.pro/about,https://shelfspace.pro/blog/post,https://shelfspace.pro/how-to,https://shelfspace.pro/how-to/retailer,https://shelfspace.pro/how-to/vendor") fail(`all-zeros should submit every indexable page: ${all}`);
if (urls("deadbeef").join(",") !== all) fail("an unresolvable before-SHA (force push) must submit every indexable page");

// 3. workflow shape.
const wf = readFileSync(join(ROOT, ".github/workflows/indexnow.yml"), "utf8");
for (const [re, why] of [[/branches: \[main\]/, "push to main"], [/fetch-depth: 0/, "full history for the diff"], [/github\.event\.before/, "uses the push's before SHA"],
  [/f403fbcba6fd1a3fa31d7d0979633ee8/, "IndexNow key"], [/api\.indexnow\.org\/indexnow/, "endpoint"], [/exit 0\s*$/, "never fails the job"]])
  if (!re.test(wf)) fail(`indexnow.yml: ${why}`);
if (!statSync(join(ROOT, "f403fbcba6fd1a3fa31d7d0979633ee8.txt")).size) fail("IndexNow key file empty");

console.log(fails.length ? `check-head: FAIL\n- ${fails.join("\n- ")}` : `check-head: ok (${files.length} pages)`);
process.exit(fails.length ? 1 : 0);
