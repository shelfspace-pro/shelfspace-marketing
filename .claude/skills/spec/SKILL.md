---
name: spec
description: Spec a marketing change — new page, blog post, site-wide rollout, voice/positioning shift, or non-trivial fix — with deep reasoning. Runs Pass 0 (Context Discovery against memory + playbook + existing site) + 3 audit passes, then STOPS without writing any HTML, CSS, or copy. Mandatory for site-wide rollouts (touching 5+ HTML files), homepage edits, nav/footer changes, and new pages. Use when you want to think through a change before any file is touched.
---

# /spec — deep marketing spec, no build

ultrathink

You are spec'ing the following marketing change — **DO NOT WRITE OR EDIT ANY FILES**:

$ARGUMENTS

This is a high-effort spec task. Take 2–3× more time than usual. Reason through edge cases the surface description ignores. Try multiple framings of the problem before settling on one. The spec must be deep enough that another writer or builder could execute it without follow-up questions.

Mandatory for: site-wide rollouts (≥5 HTML files), homepage edits, nav or footer site-wide changes, new pages, voice or positioning shifts. For smaller changes (single-file copy edit, typo fix, blog post tweak), this skill is overkill — use direct Edit instead.

# Pass 0 — Context Discovery (REQUIRED)

1. **Memory**: open `~/.claude/projects/-Users-chrismitchem-shelfspace-marketing/memory/MEMORY.md`. Scan every entry. For each, ask "could this apply?" Read each candidate in full.
   - **When the spec body defines Buckets / classification rules, defer to existing memory rules rather than relaxing them.** If a memory says "always X" or "the verb-subject is Y", the corresponding Bucket must REQUIRE X / Y — not propose "X or another option." Relaxing a rule in the spec creates compound errors during build, because each individual decision drifts within the relaxed range and the divergence only surfaces in `/audit`. Concrete failure: 2026-05-19 PM session — Bucket C said "Software <verb>" → "The platform <verb>" OR "The system <verb>", but CLAUDE.md L22 + `feedback_category_noun_system` require "the platform." The audit caught 3 violations on /credit-recovery that required a follow-up commit to revert.
2. **Skills**: review every available skill in the session's system reminder. Invoke each relevant one via the Skill tool.
3. **Marketing docs**: identify which apply, read each in full:
   - `CLAUDE.md` — voice rules, forbidden words, design system (always)
   - `marketing/landing-page-playbook.md` — for any landing or service page work
   - `marketing/case-studies.md` — for case study posts
   - `marketing/docs-instructions.md` — for docs page work
   - `marketing/vendor-reframe-spec.md` — if vendor-side messaging is involved
4. **Existing site state**: for changes affecting existing pages, read those pages. For new pages, read 1-2 closest analogues for visual/structural conventions.

# Spec body

The spec MUST contain a `## Context Loaded` block with **four lists**:
- Skills invoked (one-line reason each)
- Memory files read (one-line reason each)
- Marketing docs read (one-line reason each)
- Considered and excluded (one-line reason each — empty = scan was too narrow, redo)

The spec body should cover:
- **What changes**: every file path that will be touched, what the change is
- **Why**: the motivation, including any constraint or invariant the change preserves
- **Voice + positioning**: does this respect CLAUDE.md voice rules and the playbook's 5-beat arc? If it deviates, why?
- **SEO impact**: title, meta description, canonical, OG, schema, sitemap.xml, llms.txt
- **Cross-link impact**: which existing pages link to / from the affected pages? Update or accept?
- **Visuals**: when the user asks for "pics" or "visuals," default to inline SVG icons + pure CSS visual blocks matching site design tokens. Explicitly flag any proposal involving photos, AI-generated illustration, or third-party trademarked imagery (logos, screenshots of competitor products) — `marketing/docs-instructions.md` forbids AI imagery; trademarked product imagery carries IP risk. Existing reusable patterns: `.what-flow-item` icon-step blocks (`/checks.html`), stylized document/receipt visual idioms (`/blog/anatomy-of-*`).
- **Edge cases**: mobile rendering, accessibility, awkward viewport widths
- **Rollback plan** (if non-trivial): how to undo if it tanks

# Pass 1 — Audit against the actual site

Read the actual files you'd touch. Verify visual primitives, existing copy patterns, established CSS classes. Identify gaps in the spec — wrong assumptions, missed dependencies, files you forgot, voice violations, design tokens hardcoded as hex. Rework the spec to fix every gap.

# Pass 2 — SEO + accessibility + rhythm

Re-read the revised spec. Look for: missing schema, broken canonical URLs, alt text gaps, heading hierarchy issues, color contrast, mobile breakpoints, internal link rot, tone-rotation across the page, AI-residue in copy. Rework.

# Pass 3 — Final airtightness check

No ambiguous steps. No missing files. No untested copy. No "and then we'll figure out X." Every section's body copy drafted in full. Every file path named. If gaps remain, fix them.

# STOP

End with:

> **Spec complete after Pass 0 + 3 audit passes.** Approve with "go" / "approved" / "build it" to build, or push back to refine.

**DO NOT WRITE OR EDIT ANY FILES.** Wait for explicit approval before any Edit/Write.

# After approval — verify the build

A clean spec does not mean a clean built artifact. Once the user approves:
- **New blog post:** build following the `/blog-post` skill's Steps 3–7. Do not skip Step 4's AI-residue scan (em-dash density + the cadences in `feedback_owner_grade_voice.md` — a forbidden-token grep alone misses these) or Step 6's `/audit`.
- **Other change types** (page edits, rollouts): run the equivalent voice + SEO + accessibility check on every file you touched before committing.

This exists because a /spec → "go" → build flow otherwise bypasses the verification that `/blog-post` and `/case-study` bake in.
