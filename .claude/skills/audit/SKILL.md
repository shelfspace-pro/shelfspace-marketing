---
name: audit
description: Audit recently completed marketing work with ultrathink-level reasoning. Reviews modified files for voice violations, SEO gaps, accessibility issues, cross-link rot, schema validity, mobile rendering, and convention drift. Reports issues without fixing — separation of concerns. Use after any non-trivial change before pushing or considering work done.
---

# /audit — deep retrospective marketing review

ultrathink

You are auditing the following — **DO NOT FIX ANYTHING YET, just report**:

$ARGUMENTS

This is a high-effort audit. Take 2–3× more time than usual. Read every modified file in full — don't trust diff context, read surrounding code too. Check for issues that surface only on certain devices, in certain contexts, or weeks later in indexing.

# Step 1 — Identify scope

Match the user's phrasing:
- "the last commit" / "last N commits" → `git log -N` + `git show`
- "this session" / "everything modified" → `git status` + `git diff` + `git diff --cached`
- "PR #N" → `gh pr view N` + `gh pr diff N`
- unspecified → audit `git diff` (working tree) + `git diff --cached` (staged)

List the modified files explicitly before proceeding. If the list is empty, say so and stop — nothing to audit.

# Step 2 — Pass 0 against the audit target

Load relevant context:
- Memory files relevant to the modified pages' domain (vendor-related, voice-related, SEO-related)
- `CLAUDE.md` voice rules — always
- `marketing/landing-page-playbook.md` if marketing/landing pages were modified
- `marketing/case-studies.md` if blog posts in case-study format were modified

# Step 2.5 — User-correction-pattern check (when applicable)

If the conversation contains user corrective edits to marketing copy in this session, BEFORE the per-file review, distill the pattern from those edits:

- What did each edit change? (length, voice, jargon, framing, vendor stance, specificity)
- Is there a consistent direction across the edits?
- Does the user's chosen replacement language differ from the canonical voice in CLAUDE.md or memory? If yes, treat the user's choices as the new ground truth for this audit pass.

Then in Step 3 per-file review, EXPLICITLY check whether the same pattern exists in still-shipped copy on adjacent surfaces. Flag every match. The user's recent edits are evidence for what they want; matching un-edited copy is the highest-yield finding.

# Step 3 — Per-file review

For each modified file, read fully. Check:

- **Voice violations** (2026-09-04 overhaul law — see CLAUDE.md § Positioning & Voice): forbidden tokens — **pricing/trial/subscription**: `free trial`, `30-day`, `subscription`, `cancel anytime`, `per location`, `$999`/`$899`/`$799`/`$749`/`$499` (retired tier prices), `Sign Up` / `Start your free` (retired trial-signup CTAs) — engagements are custom, consult-first; `automate` / `automated` / `automatically` in a hero (demote AI, outcome voice); `scan-based trading` / `SBT`; **`Diem` EXCEPT in Chris's founder bio** (bio-only is allowed; any customer/usage claim is a violation); any other customer name (Diem/HURU/MedsCafe/Boutiq/Kushcart…) as a reference/testimonial; `<br>` inside headings (h1/h2/h3); a PRIMARY CTA not pointing to `/contact`; questions as headlines; "learn more" CTAs; "the platform does X" where "we do X" / outcome voice fits; passive constructions where direct fits. **Illustrative example dollar amounts in worked examples are fine** — only pricing-tier/plan copy is forbidden.
- **SEO completeness**: unique `<title>` (≤60 chars, includes "ShelfSpace" where appropriate); unique `<meta name="description">` (≤160 chars, direct-answer style); canonical URL; OG title/description/image; Twitter card; one H1; H2s for sections, no skipped levels; alt text on every image (descriptive, not "image1")
- **Schema validity**: JSON-LD blocks present and well-formed; FAQPage answers as complete standalone statements (so AI search models can pull them verbatim); FAQPage schema text mirrors visible DOM text — including link visible-text only, do NOT inject URLs that aren't shown to the user; BreadcrumbList for blog/docs pages; Article schema on blog posts
- **Cross-link integrity**: sitemap.xml has the URL with today's lastmod; llms.txt has the URL under the right section; relative paths (`/contact`, not full URLs); no broken internal links; reciprocal cross-links from related posts
- **Accessibility**: heading hierarchy clean; decorative SVGs `aria-hidden="true"`; descriptive alt text; keyboard-accessible interactives
- **Mobile rendering**: media queries present at the relevant breakpoints; tables have `overflow-x: auto` if cell-heavy; nav collapses to hamburger; no fixed widths >320px outside containers
- **Convention drift**: design tokens used (`--green-deep`, `--slate-600`, etc.) not hardcoded hex; existing primitives reused (`page-hero`, `article-glance`, `compare-table`) not reinvented; new `<nav>`/`<section>`/`<footer>` elements verified against styles.css bare element selectors (they inherit global site-nav/section/footer styling unless scoped)
- **Content quality / AI-residue**: every section earns its place per the 5-beat arc where applicable; statements specific not vague; numbers sourced or reasonable; em-dash overuse, "X, then Y, but Z" cadence, "this isn't just X — it's Y", "not just A but B" — all flag as AI-residue

# Step 4 — Cross-reference against memory feedback

Skim memory feedback files (`feedback_*.md`) relevant to the domain. Did the change repeat any documented past mistake (claims about features that don't exist; named retailers/vendors without consent; reverted-then-re-attempted pattern)? If yes, flag it.

# Step 5 — Report

Output four sections:

## Critical
Issues that would: ship a false claim about ShelfSpace; break SEO indexing; violate the brand voice in a high-traffic spot; create accessibility violations. Must fix before declaring done.

## Real
Issues that won't break production but should fix before ship. Convention drift, missing schema fields, mobile rendering gaps, weak copy.

## Nits
Style / cleanup suggestions. Optional.

## Checked and clean
One-line reassurance per file that passed all checks.

# DO NOT FIX

End with: **"Tell me what to fix."** Do not auto-fix. Audit identifies, the user decides scope, then a follow-up turn fixes.
