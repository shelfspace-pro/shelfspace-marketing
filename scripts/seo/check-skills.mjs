// SEO row C1 fence: the vendored seo-* skills, their house rules and the blog brief.
//   node scripts/seo/check-skills.mjs        (exit 1 on any violation)
//
// What it holds:
//   1. Provenance: exactly the registered seo-* skill dirs exist; each SKILL.md names its dir,
//      pins the upstream commit, points at its MIT ./LICENSE (byte-identical to upstream's) and at
//      marketing/seo-house-rules.md; every vendored reference carries the same pin.
//   2. Wiring: every relative Markdown link resolves, and no skill sends the agent to an upstream
//      skill that was not vendored (it would silently not exist here).
//   3. Copy law, over every skill file + the house rules + the blog brief: no retired product
//      names, never "collections agency", no SBT / Diem, no payment-partner names (matched by
//      hash so this public file doesn't print them), no human-handoff steps (drafts for someone to
//      send, "ask the user", posting on social sites), no private-strategy paths, no pricing file,
//      no stale ACH wording. The brief may quote the banned words only inside ONE non-empty
//      <!-- forbidden-list:start --> … <!-- forbidden-list:end --> region.
// Each rule self-tests on its own bad sample first, so a regex that stops matching fails loudly.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SKILLS_DIR = join(ROOT, ".claude", "skills");
const HOUSE = "marketing/seo-house-rules.md";
const BRIEF = "marketing/managed-services-blog-agent-brief.md";
const UPSTREAM_SHA = "0cd9b3a0ef4c411a1d690419ce843f2a1da32cce";
const LICENSE_SHA256 = "b70d71e24e40fce5da8f4b6f9cd862096a048e433db7f3c8cac5e348e6d34591";
// registered dir -> upstream skill name
const SKILLS = {
  "seo-audit": "seo-audit", "seo-ai-search": "ai-seo", "seo-programmatic": "programmatic-seo",
  "seo-schema": "schema", "seo-competitors": "competitors", "seo-site-architecture": "site-architecture",
  "seo-link-building": "link-building",
};
// upstream skills NOT vendored here: a **bold** reference to one is a dead hand-off.
const NOT_VENDORED = ["ab-testing", "ad-creative", "ads", "analytics", "aso", "attribution", "churn-prevention",
  "co-marketing", "cold-email", "community-marketing", "competitor-profiling", "content-strategy",
  "conversion-tracking", "copy-editing", "copywriting", "cro", "customer-research", "directory-submissions",
  "emails", "events", "free-tools", "image", "influencer-marketing", "launch", "lead-magnets",
  "marketing-council", "marketing-ideas", "marketing-loops", "marketing-plan", "marketing-psychology", "offers",
  "onboarding", "paywalls", "popups", "pricing", "product-marketing", "prospecting", "public-relations",
  "referrals", "revops", "sales-enablement", "signup", "sms", "social", "video",
  "ai-seo", "schema", "programmatic-seo", "competitors", "site-architecture", "link-building"];
// sha256 of each lowercase payment / bank partner name (unigram or bigram). Names never printed here.
const PARTNER_HASHES = new Set([
  "67f482329f59610686bda697fd319135458f1a1f100b2412f4517424052c035a", "7d7ff99dfc7bab4fe4a718cfc347dc72f6b5b812232bd1ed4a18ff8472f2a05d",
  "9c4e17b55dbc9b4f47860e5a543699fccb3c7df6488a9d5ababc155818f815f9", "a1d85b21b8f7ec2dc46c8602b55ab148f42a28f1f892dcbb234a03eb53830b30",
  "4da634c7024c201a7cbb30b8fdc94ce14e6f95ab12bc09d27db81417a8e8fb1f", "90b047ecc97ee62cbc19a859b6a5a441203478baa7ee91d402163629af6c650f",
  "8e3461219222ff7d7dfe8134c8f38e2512db521edefd22656db402cee9a4dd29", "310c693989dbe0804dc7c0b3238bda0826309a29ce0d31ddf6fe7a135b83e877",
]);
const PARTNER_SAMPLE_HASHED = "7d7ff99dfc7bab4fe4a718cfc347dc72f6b5b812232bd1ed4a18ff8472f2a05d";

// [id, regex, reason, bad sample the regex must match]
const RULES = [
  ["retired-name", /\bShelf(Collect|Pay)\b/i, "retired product name: the one brand is ShelfSpace", "try " + "Shelf" + "Collect today"],
  ["agency", /\bcollections?[\s-]+agenc(y|ies)\b(?!-vs-software)/i, "never call it a collections agency: it is collections software (the /blog/cannabis-collections-agency-vs-software URL is allowed)", "a cannabis collections agency"],
  ["sbt", /scan-based trading|\bSBT\b/i, "say consignment", "SBT settlements"],
  ["diem", /\bDiem\b/i, "Diem is Chris's bio only, never in skill or brief copy", "Diem Cannabis"],
  ["handoff-for", /\bfor (the user|chris|a person|a human|someone|you) to (send|post|approve|review|sign)\b/i, "no drafts for a person to send or post: Chris posts nothing", "a draft for the user to send"],
  ["handoff-ask", /\bask the user\b|\bsend the user to\b|\bfor approval\b|\bget (their|the user's|chris's) approval\b/i, "unattended: never ask, never wait for approval", "drafts for approval"],
  ["handoff-draft", /\b(draft|write) (an? |the )?(outreach|pitch|cold email|guest post)/i, "no outreach drafts from this repo", "draft outreach to editors"],
  ["handoff-social", /\b(post|participate|comment) (on|in) (reddit|linkedin|quora|x\.com|twitter)\b/i, "nobody posts on social sites from this repo", "post on Reddit weekly"],
  ["private-path", /docs\/seo\b|(?<![-\w])claims\.json|\b(keywords|backlog|competitors|prompts|budget)\.json\b|\b(OPERATOR|DISTRIBUTION)\.md\b|shelfspace-platform|seo_snapshots/, "private strategy paths stay in the private repo; reference only marketing/seo-claims.json", "see docs/seo/keywords.json"],
  ["pricing-file", /\b(add|publish|create|ship)( an?)? `?\/?pricing\.(md|txt)\b/i, "no machine-readable price file: no public pricing", "add a /pricing.md file"],
  ["free-trial", /\bfree trial\b|\bstart (your )?free\b/i, "trial copy lives only in trial-ok regions on allow-listed pages", "Start your free account"],
  ["ach-stale", /\bACH\b[^.\n]{0,40}\b(coming soon|rolling out|rolls out|not yet|in beta)\b/i, "ACH is live", "ACH is coming soon"],
];

const fails = [];
const fail = (m) => fails.push(m);
const sha = (s) => createHash("sha256").update(s).digest("hex");

// ---- self-test: every rule bites its own sample, and the hash matcher bites a hashed partner name.
for (const [id, rx, , sample] of RULES) if (!rx.test(sample)) fail(`self-test: rule ${id} no longer matches its sample`);
if (!PARTNER_HASHES.has(PARTNER_SAMPLE_HASHED)) fail("self-test: partner hash list lost its sample entry");
const partnerHits = (text) => {
  const w = text.toLowerCase().match(/[a-z0-9]+/g) || [];
  const hits = new Set();
  for (let i = 0; i < w.length; i++) {
    if (PARTNER_HASHES.has(sha(w[i]))) hits.add(w[i]);
    if (i + 1 < w.length && PARTNER_HASHES.has(sha(w[i] + " " + w[i + 1]))) hits.add(w[i] + " " + w[i + 1]);
  }
  return [...hits];
};
if (partnerHits("we pay through " + "safe" + " " + "harbor here").length !== 1) fail("self-test: bigram partner matcher does not bite");

// ---- 1. provenance
const seoDirs = readdirSync(SKILLS_DIR).filter((d) => d.startsWith("seo-") && statSync(join(SKILLS_DIR, d)).isDirectory());
for (const d of seoDirs) if (!SKILLS[d]) fail(`.claude/skills/${d}: unregistered seo-* skill (add it to SKILLS in this script with its upstream name, pin and LICENSE)`);
const scanned = [];
const walk = (dir) => readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
for (const [dir, up] of Object.entries(SKILLS)) {
  const base = join(SKILLS_DIR, dir);
  if (!existsSync(base)) { fail(`.claude/skills/${dir}: missing`); continue; }
  const skill = join(base, "SKILL.md");
  if (!existsSync(skill)) { fail(`${dir}: no SKILL.md`); continue; }
  const s = readFileSync(skill, "utf8");
  const fm = s.match(/^---\nname: ([^\n]+)\ndescription: ([^\n]+)\n---\n/);
  if (!fm) fail(`${dir}/SKILL.md: frontmatter must be name + description`);
  else {
    if (fm[1].trim() !== dir) fail(`${dir}/SKILL.md: frontmatter name "${fm[1]}" != dir`);
    if (fm[2].trim().length < 60) fail(`${dir}/SKILL.md: description too thin to route on`);
  }
  if (!s.includes(`skills/${up}, v`)) fail(`${dir}/SKILL.md: provenance does not name upstream skills/${up}`);
  if (!s.includes(`upstream commit ${UPSTREAM_SHA}`)) fail(`${dir}/SKILL.md: upstream commit pin missing`);
  if (!s.includes("MIT License") || !s.includes("./LICENSE")) fail(`${dir}/SKILL.md: MIT license reference missing`);
  if (!s.includes(HOUSE)) fail(`${dir}/SKILL.md: does not point at ${HOUSE}`);
  // the block runs from its heading to the FIRST --- rule; bound it there (a lazy regex would run on
  // to a later rule and pass an emptied block).
  const H = "## ShelfSpace rules (read first; they override everything below)\n";
  const hi = s.indexOf(H), he = hi < 0 ? -1 : s.indexOf("\n---\n", hi);
  const block = hi < 0 || he < 0 ? "" : s.slice(hi + H.length, he);
  const bullets = (block.match(/^- \*\*/gm) || []).length;
  if (block.trim().length < 400 || bullets < 2) fail(`${dir}/SKILL.md: ShelfSpace rules block missing or thin (${block.trim().length} chars, ${bullets} rules; need 400+ and 2+)`);
  const lines = s.split("\n").length;
  if (lines > 500) fail(`${dir}/SKILL.md: ${lines} lines (cap 500; move detail to references/)`);
  const lic = join(base, "LICENSE");
  if (!existsSync(lic)) fail(`${dir}: LICENSE missing`);
  else if (sha(readFileSync(lic)) !== LICENSE_SHA256) fail(`${dir}/LICENSE: not the upstream MIT text`);
  for (const f of walk(base)) {
    scanned.push(f);
    if (f.endsWith(".md") && f !== skill && !readFileSync(f, "utf8").startsWith(`<!-- Vendored from coreyhaines31/marketingskills skills/${up}/references/`)) fail(`${relative(ROOT, f)}: vendored reference lacks its provenance header`);
    if (f.endsWith(".md") && f !== skill && !readFileSync(f, "utf8").slice(0, 300).includes(UPSTREAM_SHA)) fail(`${relative(ROOT, f)}: reference lacks the upstream commit pin`);
  }
}
for (const f of [HOUSE, BRIEF]) {
  const p = join(ROOT, f);
  if (!existsSync(p) || readFileSync(p, "utf8").trim().length < 1000) fail(`${f}: missing or empty (the scan would prove nothing)`);
  else scanned.push(p);
}
if (scanned.length < Object.keys(SKILLS).length * 2 + 2) fail(`only ${scanned.length} files scanned: region empty`);

// brief: the one forbidden-list region (exempt from the copy rules) must exist exactly once and be non-empty
const blankRegion = (rel, text) => {
  const starts = text.split("<!-- forbidden-list:start -->").length - 1;
  const ends = text.split("<!-- forbidden-list:end -->").length - 1;
  if (rel !== BRIEF) { if (starts || ends) fail(`${rel}: forbidden-list region allowed only in ${BRIEF}`); return text; }
  if (starts !== 1 || ends !== 1) { fail(`${BRIEF}: needs exactly one forbidden-list region (found ${starts} start / ${ends} end)`); return text; }
  const a = text.indexOf("<!-- forbidden-list:start -->"), b = text.indexOf("<!-- forbidden-list:end -->");
  if (b < a || text.slice(a + 29, b).trim().length < 40) { fail(`${BRIEF}: forbidden-list region empty or reversed`); return text; }
  return text.slice(0, a) + text.slice(a, b).replace(/[^\n]/g, " ") + text.slice(b);
};

// ---- 2 + 3. links, hand-offs, copy law
for (const p of scanned) {
  const rel = relative(ROOT, p);
  if (p.endsWith("LICENSE")) continue; // every other file in a skill dir is scanned, whatever its extension
  const raw = readFileSync(p, "utf8");
  const text = blankRegion(rel, raw);
  // Scan the WHOLE text with line breaks folded to spaces: these files are hard-wrapped, so a
  // per-line scan would miss "collections\nagency" or a partner name split across a wrap.
  const flat = text.replace(/\n/g, " ");
  const lineAt = (idx) => text.slice(0, idx).split("\n").length;
  for (const [id, rx, reason] of RULES) {
    for (const m of flat.matchAll(new RegExp(rx.source, rx.flags.includes("g") ? rx.flags : rx.flags + "g"))) {
      fail(`${rel}:${lineAt(m.index)}: [${id}] ${reason}\n      …${flat.slice(Math.max(0, m.index - 40), m.index + 80).trim()}…`);
    }
  }
  for (const h of partnerHits(flat)) fail(`${rel}: [partner] names a payment or bank partner ("${h}") — never name it`);
  if (rel === BRIEF) continue;
  for (const m of raw.matchAll(/\]\(([^)\s]+)\)/g)) {
    const t = m[1].split("#")[0];
    if (!t || /^(https?:|mailto:|\/)/.test(t)) continue; // site-absolute paths in examples are illustrative
    if (!existsSync(resolve(dirname(p), t))) fail(`${rel}: dead link (${m[1]})`);
  }
  for (const n of NOT_VENDORED) if (raw.includes(`**${n}**`)) fail(`${rel}: hands off to **${n}**, an upstream skill not vendored here`);
}

if (fails.length) {
  console.log(`🔴 check:skills — ${fails.length} problem(s) in the vendored seo-* skills / house rules / blog brief:`);
  for (const f of fails) console.log("   " + f);
  process.exit(1);
}
console.log(`✅ check:skills clean — ${Object.keys(SKILLS).length} vendored seo-* skills, ${scanned.length} files, ${RULES.length + 1} copy rules (self-tested).`);
