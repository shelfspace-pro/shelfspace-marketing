---
name: blog-post
description: Workflow for creating a new blog post on shelfspace.pro. Writes the post from the blog brief (marketing/managed-services-blog-agent-brief.md) under the house rules (marketing/seo-house-rules.md), registers every figure in marketing/seo-claims.json, adds the blog.html card, llms.txt line and regenerated sitemap, cross-links related posts, runs the gates and commits. Use when adding a new blog article. For editing an existing post, use direct Edit instead.
---

# /blog-post — create a new blog post

ultrathink

You are creating a new blog post. Topic from $ARGUMENTS. You run unattended: decide from the brief, the
house rules and the repo `CLAUDE.md`, and keep going. Never stop to ask; where the topic leaves something
open, pick the brand-first answer and note the choice in your final reply.

# Step 1 — Read the law (every time, in this order)

1. `marketing/managed-services-blog-agent-brief.md` — THE brief for one post: brand-first audience, the
   reference post to copy, voice, the forbidden list, required structure, the visual kit, output rules.
2. `marketing/seo-house-rules.md` — unattended running, what never goes in this public repo, naming, numbers,
   price and trial copy, page style and the gates. It wins where the brief is silent.
3. The repo `CLAUDE.md` — voice law, naming, CTA labels, footer, blog system.

Where this skill and those files disagree, the files win.

# Step 2 — Pin down the basics (decide, don't ask)

- Topic and angle, from $ARGUMENTS.
- Audience: a cannabis **brand** by default (brand-first, per the brief). A dispensary post only when the
  topic is plainly AP, consignment or credit recovery.
- Primary keyword, slug (kebab-case, ≤ 8 words, unique in `blog/`), category (`Collections` for brand
  posts; `AP`, `Consignment`, `Case Study`, `Credit Recovery`, `Vendor Management` otherwise).
- Length: the brief's 1,600–2,400 words.

# Step 3 — Write `blog/{slug}.html` exactly as the brief says

Copy the reference post's boilerplate verbatim, change only the per-post fields, use 2–4 visuals from the
brief's kit. Every `$`, `%` and count must already be in `marketing/seo-claims.json` or come from a primary
source cited inline; add each new sourced figure to `marketing/seo-claims.json` (value, page, the exact
sentence, the source URL, as-of date). No fabricated figures, no customer names, no ShelfSpace price.

# Step 4 — Voice check

Grep the new file for every term on the brief's forbidden list (between its `forbidden-list` markers) and fix
each hit. Also edit out AI-residue cadence. The word list lives only in the brief; don't copy it here.

# Step 5 — Site infrastructure

- `blog.html`: a compact-row card at the TOP of the matching section's `<div class="section-list">`
  (`data-rank="1"`), every other card in that section moves down one rank (ranks stay 1..n, no gaps or
  repeats), and the section's `section-count` goes up by one. Small categories (Credit Recovery, Vendor
  Management) go in `<div class="blog-section-rest">` with `data-rank="99"`. Card markup: copy an existing
  card; the description is the brief's ≤ 170-character summary.
- `llms.txt`: a line under "Blog Articles": `- {Title}: https://shelfspace.pro/blog/{slug} ({one-line summary})`.
- Cross-link from 1–3 related posts at a natural pivot.
- Case studies: also follow `marketing/case-studies.md` (homepage card).
- `npm run cta:sweep` (CTA labels are script-owned), then regenerate the sitemap LAST:
  `node scripts/seo/build-sitemap.mjs` (lastmod comes from git; `check:sitemap` fails on a stale value).

# Step 6 — Gates (all must pass)

```bash
npm run -s check:blog-sync && npm run -s check:sitemap && npm run -s check:seo && npm run -s check:claims \
  && npm run -s check:dupe && npm run -s check:cta && npm run -s check:forbidden && npm run -s check:footer
PAGES=/blog/{slug} npm run -s check:phone
```

Then screenshot the post at 1440 and 390 and read the PNGs.

# Step 7 — Audit, commit, push

Invoke `/audit` against the modified files and fix every Critical or Real issue. Commit path-scoped
(`feat: blog post — {short title}`) and push to `main` per the repo `CLAUDE.md`. End with the live URL and the
posts that now link to it.
