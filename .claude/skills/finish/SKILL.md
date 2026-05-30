---
name: finish
description: End-of-session one-shot for marketing work. Runs the full audit→fix→reflect pipeline in a single hands-off turn — auto-fixes everything /audit finds and auto-applies every memory learning, with NO stop-to-ask. Two carve-outs only legal + site-wide-rollout findings (held for /spec, never auto-fixed) and memory removals (listed non-blocking, never auto-deleted). Use after completing a marketing-content session to make the work robust + persist what was learned without babysitting.
---

# /finish — close out a marketing session, hands-off

ultrathink

$ARGUMENTS

You are running Chris's end-of-build close-out for the marketing repo in ONE
turn: **AUDIT + fix → VERIFY → REFLECT**. This replaces the manual sequence
he used to run by hand (`/audit`, then "fix everything you found", then
`/reflect`).

**The contract (ported from shelfspace-platform's /finish, 2026-05-27,
Chris's explicit standing direction):**

- Run all phases in order, in this single turn. Do **not** stop between
  phases to ask "fix everything?" / "proceed?" / "approve LOW?" — the
  answer is always yes. He approves everything; the leeway is wide;
  reversible changes can be reverted later.
- Fix everything `/audit` surfaces. Apply every HIGH / MEDIUM / LOW memory
  learning. No babysitting.
- There are **exactly two carve-outs** you never auto-apply. Everything
  outside them is full-auto:
  1. **Legal + site-wide-rollout findings** → held for `/spec`, never
     auto-fixed (see § Legal + site-wide held bucket).
  2. **Memory removals** → listed non-blocking in the final report, never
     auto-deleted (see Phase 3).
- The run **always completes** to the final report. Nothing in this
  pipeline is allowed to strand the turn waiting on Chris — not a held
  finding, not a removal candidate. Collect, continue, report.

If a verification script fails after genuine effort (3+ approaches), do
**not** commit — surface the blocker loudly in the final report, but still
finish Phase 3 (reflection doesn't need a green verification).

---

# Shared setup — do ONCE

## Scope (audit Step 1)

Match `$ARGUMENTS` phrasing:
- "last commit" / "last N commits" → `git log -N` + `git show`
- "this session" / "everything modified" → `git status` + `git diff` + `git diff --cached`
- "PR #N" → `gh pr view N` + `gh pr diff N`
- Named page / blog post / doc → grep the file + its cross-references (blog.html card, llms.txt entry, sitemap entry, docs-search.js entry if doc)
- **Unspecified (the common case)** → working tree + staged: `git status`
  + `git diff` + `git diff --cached`

List the modified files explicitly. If the list is empty, say so and stop —
nothing to finish.

## Pass 0 (shared)

Load context scoped to the *surface area of what changed* (same shape as
`/spec` Pass 0):
- Relevant `memory/` files (read in full) — at minimum the user/feedback/
  project/reference files whose `description:` matches the changed surface
- `marketing/landing-page-playbook.md` if any HTML page-level copy changed
- `marketing/case-studies.md` if a case study was added/edited
- `marketing/docs-instructions.md` if a /docs page was added/edited
- `CLAUDE.md` "Key Rules" section (always)
- The canonical sibling pages for context (e.g. if /accounts-payable
  changed, glance at /consignment + /credit-recovery for voice/structure
  parity)

State what you loaded once; both phases below rely on it.

---

# Phase 1 — Audit + fix + verify

## 1A. Run the audit

Run the review in `.claude/skills/audit/SKILL.md` against the shared scope.

**Override the audit's ending.** `/audit` is built to stop at "Tell me what
to fix." In `/finish` you do NOT stop:

- **Fix every Critical and Real finding immediately.** Apply Nits at your
  discretion (fix the cheap ones, skip churn).
- Adhere to the marketing conventions while fixing:
  - **Verb split** (CLAUDE.md): "we" for brand-level, "the platform" /
    "ShelfiQ" for software actions, "you" for retailer actions. Never
    "ShelfSpace does X."
  - **No `<br>` in headings** — let text wrap naturally.
  - **All CTAs → /contact** (carve-outs in `feedback_vendor_audience_conventions`
    for vendor/IT/support pages).
  - **No managed-service framing**, no "we cut the check," no "we run your
    AP," no "pilot/trial" language, no "scan-based trading"/"SBT," no
    "Diem Cannabis," no demo-modal.
  - **Brand noun = "system"** (not "software platform" except in legal /
    competitor / SEO axis / "software seats" idiom / "no software to
    install" idiom). See `feedback_category_noun_system`.
  - **fi ligature fix** when "Shelf" + "iQ" span split.
  - **Owner-grade voice** (`feedback_owner_grade_voice`): scrub em-dash
    overuse, "the function that...", "X isn't Y — it's Z" residue.
- **Legal + site-wide carve-out:** if a finding is in the held bucket (see
  § below), do NOT fix it. Add it to the held bucket and move on.

Keep a running tally: findings by severity, fixes applied, items held.

## 1B. Verify (cross-link integrity)

If the scope touched anything under `/blog/`, `blog.html`, or `llms.txt`:
```
bash marketing/scripts/check-blog-sync.sh
```

If the scope touched anything under `/docs/` or `docs-search.js`:
```
bash marketing/scripts/check-docs-sync.sh
```

If either fails, fix the failure (add the missing card / llms.txt line /
sitemap entry / docs-search.js entry + `?v=N` bump per CLAUDE.md docs
checklist) and re-run until green. These scripts are the closest thing
this repo has to a build gate — treat them as such.

## 1C. Propagation sweep (the one most missed pass)

Per `feedback_propagate_canonical_changes`: pricing / feature / positioning
/ legal / TOS changes leave stale twins across many surfaces. If the
session touched any canonical surface — pricing language, service
positioning, the system/managed-service noun, a service mechanism, a
schema name, a TOS clause — grep these for matches that need to move
together:
- `blog/`
- `docs/`
- All root-level `*.html`
- `docs-search.js` (+ `?v=N` cache bump on every reference site-wide)
- `llms.txt`
- `sitemap.xml` (lastmod dates only for surfaces actually changed — never
  `replace_all` on a date string per `feedback_replace_all_on_dates`)
- `features.html` schema, `blog.html` card descriptions
- `marketing/platform-map.md` if a product-behavior change
- Sibling shelfspace-platform repo's ShelfiQ prompts (`lib/ai/system-prompt.ts`
  + `lib/shelfiq/system-prompt.ts`) for product-behavior or legal changes

Fix every stale twin you find under the same conventions. Tally them with
the audit fixes.

## 1D. Commit + push

After verification is green, commit Phase 1 work and push to `origin/main`
— no asking, per CLAUDE.md "Always push to production" rule. Use
path-scoped `git add <paths>` to avoid sweeping unrelated staged work.
Message:

```
finish({scope}): audit fixes + propagation sweep

Audit: {N} fixed ({C} critical, {R} real){, H held for /spec}
Propagation: {P} stale twins synced across {S} surfaces
Verify: blog-sync {pass|n/a} · docs-sync {pass|n/a}
```

If a verification script could not be made green, **skip the commit** and
flag it loudly. Still continue to Phase 2.

---

# Phase 2 — Reflect

Run `.claude/skills/reflect/SKILL.md` in full — load the memory cheat-sheet,
search-before-create, do the **memory-hygiene / hook-rewrite** pass (this
is the highest-value step), detect skill-worthy patterns, run the removal
pass.

**Two overrides to `/reflect`'s write policy:**

1. **Auto-apply HIGH, MEDIUM, *and* LOW** memory writes + hook rewrites +
   skill/CLAUDE.md edits, in this turn. `/reflect` alone gates LOW behind
   "approve LOW?" — in `/finish` you don't ask, you write. Rationale:
   Chris approves all, wants minimal interaction, memory writes are
   git-tracked-or-trivially-reverted. Still rank ruthlessly in the report
   (HIGH/MED/LOW labels stay meaningful); the change is only that LOW
   gets written instead of queued.
2. **Removals stay non-blocking, never auto-executed.** Run the removal
   pass and produce the ranked candidate list, but do NOT archive
   anything. Surface the list in the final report under "Archive
   candidates." This is the one `/reflect` action with a hard standing
   rule. Listing is non-blocking: the run completes, Chris glances later,
   ignoring it costs nothing (memories just persist).

Memory body/index files live OUTSIDE the repo
(`~/.claude/projects/-Users-chrismitchem-shelfspace-marketing/memory/`) —
no git commit needed for those. If reflection edited anything **inside**
the repo (`CLAUDE.md`, `.claude/skills/**`), commit + push those
separately after writing.

Run the post-write size check on `MEMORY.md`.

---

# Legal + site-wide held bucket (the one hard gate)

A finding is "held" — never auto-fixed — if the fix would:

1. **Touch `terms.html` or `privacy.html`.** CLAUDE.md: legal docs, don't
   touch. Held for `/spec` regardless of severity.
2. **Be a site-wide rollout** — touching 5+ HTML files at once (the same
   change propagated across pages). Per CLAUDE.md, mandatory `/spec` first.
3. **Restructure the homepage** (`index.html` hero, primary CTA tile,
   service tour structure, nav placement). Per CLAUDE.md mandatory `/spec`.
4. **Modify the nav or footer.** Per CLAUDE.md mandatory `/spec`.
5. **Create a new page.** Per CLAUDE.md mandatory `/spec`.
6. **Re-position the brand or a service** — changing the system/managed-service
   noun, a pricing model (per-transaction → usage-based, etc.), or the
   verb-split rule itself. These are structural changes whose propagation
   cost is what `/spec` exists to plan.
7. **Modify product claims that need source verification** — quantified
   claims (X% of dispensaries, average, typically, most clients), case-study
   numbers, TOS/legal/contract claims, technical/infrastructure claims (DNS,
   SPF/DKIM/DMARC, integration capabilities). Per
   `feedback_verify_product_claims`: code is ground truth; verify against
   the platform repo + docs before claim-edit, which is `/spec`-shaped work
   not `/finish`-shaped.

For each held item, record: `file:line` (or page name), one-sentence root
cause, one-sentence proposed fix, and the exact handoff command, e.g.
`/spec re-position credit recovery as managed-service language is still in
3 docs pages and llms.txt`.

**Why this is the one carve-out under "fix everything":** a stale pricing
twin across 9 surfaces, a verb-split violation propagated into 4 schema
descriptions, or a TOS change that ships before the spec audit catches the
30-day-notice rule (`feedback_user_favorable_immediate`) — these don't
revert cleanly. By the time a stale claim or wrong positioning surfaces,
it's already indexed by Google, fetched by `/llms.txt` consumers, and
referenced by AI assistants. Held findings need the deep cross-surface
reasoning `/spec` does. Listing them here is correct, not timid.

---

# Final report

One consolidated report. No per-phase narration during the run — the report
is the deliverable.

## Audit
Findings by severity; what was fixed (file:line, one line each). Held
findings go to the held section, not here.

## Verify
- Blog sync: PASS / n/a / FAIL ({tail of output if FAIL})
- Docs sync: PASS / n/a / FAIL ({tail of output if FAIL})

## Propagation
{P} stale twins synced — list each (`file:line`, what changed).
Or "none — no canonical surface touched."

## ⚠️ Held for /spec
Every held item with its `/spec` handoff command. If empty, say "none —
no legal / site-wide / re-positioning findings."

## Reflect
What landed (one line per write/hook-rewrite/skill edit, ranked
HIGH/MED/LOW). Then **Archive candidates** (the non-blocking removal list,
ranked) — or "none."

## Bottom line
End with one line:
**"Finished: {N} audit fixes, {P} propagation syncs, {H} held for /spec, {W} memory writes, {A} archive candidates awaiting your call."**

If a held item exists OR there are archive candidates, add the
one-action-away next step so Chris can act in a single command if he wants
to — but the turn is already complete; he is not blocked.

---

# What /finish is NOT

- **Not** a legal / TOS editor — `terms.html` + `privacy.html` are always
  held for `/spec`.
- **Not** a re-positioner — brand/service noun changes, pricing model
  flips, verb-split rule changes are all `/spec`-shaped.
- **Not** a site-wide rollout tool — 5+ HTML files in one change ⇒ held.
- **Not** a memory deleter — it lists archive candidates, never executes.
- **Not** a hard-stopper — held findings and removals never strand the
  turn; collect, continue, report.
- **Not** for one-line cosmetic changes — for those, fix and push directly.
  `/finish` is for closing out a real marketing session (a new page, a
  rolled-out positioning change, a multi-file audit pass, a case-study
  publish).

---

# Notes on porting

This skill is the marketing-repo analog of the same-named skill in
`shelfspace-platform`. Same contract, same hands-off discipline, same
two-carve-out philosophy. What's different is what counts as
"irreversible-ish" in this repo: money-math there → legal + site-wide
positioning here. The platform version drives `/test` + `npm run build` +
`.claude/verify/financial.sh`; this version drives `check-blog-sync.sh` +
`check-docs-sync.sh` + the propagation sweep. The reflect phase is
identical.
