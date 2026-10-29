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
//      names, never "collections agency", no SBT / Diem (payment / bank partners MAY be named:
//      Chris, 10/29/2026; the hashed partner scan was removed in SEO C3), no human-handoff steps (drafts for someone to
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
// [id, regex, reason, bad sample the regex must match, exempt inside the brief's forbidden-list region?]
// Only copy-word rules are exempt there; private paths are never allowed anywhere.
const RULES = [
  ["retired-name", /\bShelf[ -]?(Collect|Pay)\b|\bshelf-?(collect|pay)\b|\bSHELF[ -]?(COLLECT|PAY)\b/, "retired product name: the one brand is ShelfSpace", "try " + "Shelf" + " Collect today", true],
  ["agency", /\bcollections?[\s-]+agenc(y|ies)\b(?!-vs-software)/i, "never call it a collections agency: it is collections software (the /blog/cannabis-collections-agency-vs-software URL is allowed)", "a cannabis collections agency", true],
  ["sbt", /scan-based trading|\bSBT\b/i, "say consignment", "SBT settlements", true],
  ["diem", /\bDiem\b/i, "Diem is Chris's bio only, never in skill or brief copy", "Diem Cannabis", true],
  ["handoff-for", /\bfor (the user|chris|a person|a human|the owner|the client|the team) to (send|post|approve|review|sign|email|publish)\b|\bfor someone to (send|post|approve|email)\b/i, "no drafts for a person to send or post: Chris posts nothing", "a list for Chris to email", true],
  ["handoff-ask", /\bask (the user|chris|the owner|the client)\b|\bconfirm with (the user|chris|the owner|the client)\b|\bsend the user to\b|\bfor approval\b|\b(owner|user|chris|client) can approve\b|\bget (their |the user's |chris's |the owner's )?(approval|sign-off)\b|\bhand (it|them|this) (off )?to (chris|the user|the owner|someone)\b|\bwait for (chris|the user|the owner)\b|\bgo-ahead\b|\bleave (it|them|the [a-z]+) for (chris|the user|the owner)\b/i, "unattended: never ask, never wait for approval, never hand work to a person", "hand it to Chris to send", true],
  ["handoff-draft", /\b(draft|write|prepare) (an? |the )?(outreach|pitch|cold email|guest post|(message|email|dm) to (the |each |an? )?(editor|journalist|publisher|author|writer|site owner|prospect)|list of (editors|journalists|prospects|contacts|publishers))|\b(send|email) (it |them |this |(an? )?([a-z]+ ){0,2})?to (the |each )?(editor|journalist|publisher|author|prospect|writer)s?\b(?! field)|\breach out to\b|\bcontact the (editor|author|publisher|journalist|site owner|writer)s?\b|\bemail the (editor|author|publisher|journalist|writer)s?\b|\bpitch (the|a|this) (story|post|data|piece|study)\b|\bask (the |each )?(editor|author|publisher|site owner|writer)s? (to|for)\b|\b(request|ask for) a link\b|\bsubmit (the site|it|us|shelfspace) to\b|\boffer the data to\b|\bprospect list/i, "no outreach from this repo: no drafts, no lists, no messages", "Draft a message to the editor", true],
  ["handoff-social", /\b(post|participate|comment|answer|share|reply) (on|in|to) (reddit|linkedin|quora|x\.com|x|twitter|hacker news|facebook)\b|\b(draft|write|schedule|publish) (a |an |the )?(linkedin|reddit|quora|facebook|x) (post|comment|answer|thread)\b|\b(schedule|send|post) a tweet\b|\b(post|share|cross-post)\b[^.]{0,30}\bto (x|reddit|linkedin|twitter|quora|facebook)\b/i, "nobody posts on social sites from this repo", "answer on Quora", true],
  ["private-path", /docs\/seo\b|(?<![-\w])claims\.json|\b(keywords|backlog|competitors|prompts|budget)\.json\b|\b(OPERATOR|DISTRIBUTION)\.md\b|shelfspace-platform|seo_snapshots/, "private strategy paths stay in the private repo; reference only marketing/seo-claims.json", "see docs/seo/keywords.json", false],
  ["pricing-file", /\bpricing\.(md|txt|json)\b/i, "no machine-readable price file: no public pricing", "Publish the pricing.md", true],
  ["free-trial", /\bfree trial\b|\bstart (your )?free\b|\btry it free\b|\b\d+[- ]day (free )?trial\b|\b(subscription|monthly) price\b|\bstart (a|the|your) trial\b|\bpayment details to start\b|\bno credit card\b|\$\d[\d,]*\s*(\/|per |a )\s?(mo|month)\b|\bstarts? at \$\d/i, "trial and price copy live only in trial-ok regions on allow-listed pages", "name the 30-day trial", true],
  ["ach-stale", /\bACH\b[^.\n]{0,40}\b(coming soon|launch(es|ing)?( soon| next)?|will launch|rolling out|rolls out|not (available )?yet|isn.t live|in beta|planned|available soon|on the roadmap)\b|\b(coming soon|launching soon|rolling out|not (available )?yet|will launch)\b[^.\n]{0,40}\bACH\b/i, "ACH is live", "Coming soon: ACH transfers", true],
];
// Rules whose prohibition is itself stated in these files ("never X"): a negated sentence is skipped.
// Names, agency and private paths are NOT guarded: those words never belong here at all.
const NEG_GUARDED = new Set(["handoff-for", "handoff-ask", "handoff-draft", "handoff-social", "pricing-file", "free-trial", "ach-stale"]);
// Sentences the law depends on: deleting one is a red, not a silent loosening.
const PINS = {
  "marketing/seo-house-rules.md": ["## 1. You run unattended", "**Nobody posts, sends or approves anything by hand.**", "## 2. This repo is public",
    "## 3. Naming", "never an \"agency\" of any kind", "## 4. Numbers", "**No fabricated figures.**", "## 5. Price and trial", "Never ship a machine-readable price file"],
  "marketing/managed-services-blog-agent-brief.md": ["(brand-first)", "## Price and trial: none in a post", "A blog post never carries a price",
    "## Numbers: no fabricated figures", "marketing/seo-claims.json", "never called an agency of any kind"],
};

const fails = [];
const fail = (m) => fails.push(m);
const sha = (s) => createHash("sha256").update(s).digest("hex");

// ---- self-test: every rule bites its own sample.
for (const [id, rx, , sample] of RULES) if (!rx.test(sample)) fail(`self-test: rule ${id} no longer matches its sample`);

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
for (const [f, pins] of Object.entries(PINS)) {
  const p = join(ROOT, f); if (!existsSync(p)) continue;
  const t = readFileSync(p, "utf8");
  for (const pin of pins) if (!t.includes(pin)) fail(`${f}: load-bearing sentence removed: ${JSON.stringify(pin)}`);
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
  // per-line scan would miss "collections\nagency" split across a wrap.
  const flat = text.replace(/\n/g, " ");
  const lineAt = (idx) => text.slice(0, idx).split("\n").length;
  // A rule stated as a prohibition ("Never ask the user…", "No `/pricing.md` on this site") is the law,
  // not a breach: skip a match whose sentence carries a negation. Sentence = back to the previous
  // . ! ? ; or line-leading bullet/table/heading, forward to the next.
  const NEG = /\b(never|nobody|no|not|don't|do not|none|nothing|isn't|aren't|without)\b/i;
  const sentenceAt = (idx, len) => {
    const stop = (i) => /[.!?;]/.test(text[i]) && (i + 1 >= text.length || /\s/.test(text[i + 1]));
    let a = idx; while (a > 0 && !stop(a - 1) && !(text[a - 1] === "\n" && /^[\s]*([-*|#]|\d+\.|\n)/.test(text.slice(a, a + 4)))) a--;
    let b = idx + len; while (b < text.length && !stop(b) && !(text[b] === "\n" && /^\n?\s*([-*|#]|\d+\.|\n)/.test(text.slice(b + 1, b + 5)))) b++;
    return text.slice(a, b);
  };
  const flatRaw = raw.replace(/\n/g, " ");
  for (const [id, rx, reason, , exempt] of RULES) {
    for (const m of (exempt ? flat : flatRaw).matchAll(new RegExp(rx.source, rx.flags.includes("g") ? rx.flags : rx.flags + "g"))) {
      if (NEG_GUARDED.has(id) && NEG.test(sentenceAt(m.index, m[0].length))) continue;
      fail(`${rel}:${lineAt(m.index)}: [${id}] ${reason}\n      …${flat.slice(Math.max(0, m.index - 40), m.index + 80).trim()}…`);
    }
  }
  if (rel === BRIEF) continue;
  for (const m of raw.matchAll(/\]\(([^)\s]+)\)/g)) {
    const t = m[1].split("#")[0];
    if (!t || /^(https?:|mailto:|\/)/.test(t)) continue; // site-absolute paths in examples are illustrative
    if (!existsSync(resolve(dirname(p), t))) fail(`${rel}: dead link (${m[1]})`);
  }
  for (const n of NOT_VENDORED) {
    const e = n.replace(/[-]/g, "\\-");
    if (raw.includes(`**${n}**`) || new RegExp("`" + e + "` skill\\b|\\bthe `?" + e + "`? skill\\b|\\bsee `" + e + "`\\)|(?<![-\\w])" + e + "'s [a-z-]+ reference\\b", "i").test(raw.replace(/\n/g, " ")))
      fail(`${rel}: hands off to "${n}", an upstream skill not vendored here (or renamed)`);
  }
  // backticked reference paths (`references/x.md`) must resolve too, relative to the skill dir
  if (!p.startsWith(SKILLS_DIR + "/")) continue;
  const skillDir = p.slice(0, p.indexOf("/", SKILLS_DIR.length + 1));
  for (const m of raw.matchAll(/`(references\/[a-z0-9-]+\.md)`/g)) {
    const t = m[1];
    if (t === "SKILL.md" || t === "CLAUDE.md") continue;
    if (!existsSync(resolve(dirname(p), t)) && !existsSync(join(skillDir, t)) && !existsSync(join(skillDir, "references", t)) && !existsSync(join(ROOT, t)))
      fail(`${rel}: dead backticked path (${t})`);
  }
}

if (fails.length) {
  console.log(`🔴 check:skills — ${fails.length} problem(s) in the vendored seo-* skills / house rules / blog brief:`);
  for (const f of fails) console.log("   " + f);
  process.exit(1);
}
console.log(`✅ check:skills clean — ${Object.keys(SKILLS).length} vendored seo-* skills, ${scanned.length} files, ${RULES.length} copy rules (self-tested).`);
