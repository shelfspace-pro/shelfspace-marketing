---
name: blog-post
description: Workflow for creating a new blog post. Reads the playbook, picks template (educational guide, case study, competitor comparison, platform feature explainer), writes the HTML, adds schema, updates sitemap and llms.txt, cross-links from related posts, runs the voice check, and commits. Use when adding a new blog article. For editing an existing post, use direct Edit instead.
---

# /blog-post — create a new blog post

ultrathink

You are creating a new blog post. Topic from $ARGUMENTS.

# Step 1 — Pin down the basics

Confirm with the user (or infer from $ARGUMENTS if clear):
- Topic and angle
- Audience (default: dispensary operator; rare: vendor)
- Primary keyword target
- Slug (kebab-case, descriptive, ≤8 words)
- Type: educational guide · case study · competitor comparison · platform feature explainer
- Length target (default ~1,500-2,500 words)

If anything material is unclear, ASK before writing. Do NOT proceed past this step on assumptions.

# Step 2 — Read the playbook + similar posts

- Always: `CLAUDE.md` voice rules
- Educational guides: `marketing/landing-page-playbook.md`
- Case studies: `marketing/case-studies.md` (de-identification rules, blog template, homepage cards, SEO targets)
- Read 1-2 most-similar existing blog posts in `blog/` to confirm visual conventions (CSS reuse, schema patterns, At-a-glance card, FAQ structure)

# Step 3 — Draft the HTML

Required elements:
- `<head>`: unique title (≤60 chars, includes "ShelfSpace" where appropriate), unique meta description (≤160 chars, direct-answer style), canonical, OG, Twitter, JSON-LD schema (Article + BreadcrumbList; FAQPage if there's an FAQ section)
- Standard nav (current site format — includes "For Vendors" link with `class="nav-secondary"`)
- Hero with `section-label`, H1, optional subhead
- "At a glance" green-ghost card (`article-glance` primitive — 4-6 bullets max)
- Article body: ~1,500-2,500 words following the 5-beat arc where applicable. Educational posts: opening pain → claim → evidence → solution → CTA. Case studies: setup → problem → resolution → result → quote → CTA.
- Inline visuals where they earn their place: deal cards, step-flow, compare-table, stat triplet
- FAQ section (optional but recommended for SEO — AI search models pull FAQPage answers verbatim)
- CTA section (existing primitive)
- Footer (current standard, includes "For Vendors" link in Access column)

# Step 4 — Verify voice

Grep the new file for forbidden tokens. Fix any found.
- `automate`, `automated`, `automatically`
- `scan-based trading`, `SBT`
- `Diem`
- `pilot`, `trial`, `60-day`
- `<br>` inside `<h1>`, `<h2>`, `<h3>`

Also check for AI-residue: em-dash overuse, "X, then Y, but Z" cadence, "this isn't just X — it's Y", "not just A but B" patterns. Edit out.

# Step 5 — Update site infrastructure

- `sitemap.xml`: add `<url>` entry with today's `lastmod` and `<priority>0.6</priority>`
- `llms.txt`: add line under "Blog Articles" — `- {Title}: https://shelfspace.pro/blog/{slug}`
- `blog.html` (REQUIRED — landing page sectioned layout): insert a new compact-row card at the top of the matching category section's `.section-list` (e.g., for an AP post: top of `<div class="section-list">` inside `<section class="blog-section" data-section-cat="AP">`). Set `data-rank="1"` and bump existing cards' ranks. Pick `data-category` from the 5 valid values: `AP`, `Case Study`, `Consignment`, `Credit Recovery`, `Vendor Management`. **Small categories** (Credit Recovery, Vendor Management) go in `<div class="blog-section-rest">` instead — all cards there carry `data-rank="99"`. Card structure:
  ```html
  <a href="/blog/{slug}" class="blog-card" data-category="{Category}" data-rank="1">
    <span class="blog-card-tag">{Category}</span>
    <div class="blog-card-content">
      <div class="blog-card-title">{post-title minus " — ShelfSpace" suffix}</div>
      <div class="blog-card-desc">{≤170-char one-line summary; trim from meta description}</div>
    </div>
    <svg class="blog-card-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
  </a>
  ```
  Optionally promote the new post to the **featured slot** at the top of the page (replace `.featured-card` body). The previous featured drops back into its category's `.section-list` at `data-rank="1"`.
- Cross-link from 1-3 related existing blog posts (find adjacent topics; add a one-line "See also" reference at a natural pivot point — usually toward the end of a related section or near the post's CTA)
- Case studies: also add the homepage card per `marketing/case-studies.md` rules
- After all infrastructure edits, run `marketing/scripts/check-blog-sync.sh` to verify zero orphans across blog.html ↔ filesystem ↔ llms.txt

# Step 6 — Audit before commit

Invoke `/audit` against the modified files. Fix any Critical or Real issues. Nits optional.

# Step 7 — Commit + push

Per CLAUDE.md "Always push to production." Commit with a message like:
```
feat: blog post — {short title}
```

End with: live URL of the post + which existing posts cross-link to it.
