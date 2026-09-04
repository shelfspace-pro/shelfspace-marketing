# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

ShelfSpace marketing site — static HTML/CSS deployed on Vercel at shelfspace.pro. The public-facing website for ShelfSpace, a cannabis-specific back-office for the money side of the business — accounts payable, consignment, accounts receivable / collections, and vendor credit recovery for cannabis dispensaries and the brands that supply them.

## Workflow

- **Always push to production**: After completing work, commit and push directly to `main`. Do not wait for confirmation.

## Positioning & Voice (the current law — 2026-09-04 overhaul)

The site sells the **OUTCOME**, stays agnostic on who does the work, and shows **no public pricing**. Full rationale + build history: `WEBSITE-OVERHAUL.md`.

- **Positioning — OUTCOME-FIRST, delivery-model-agnostic**: ShelfSpace sells the outcome — *"the money side of cannabis, handled."* Each account is scoped in the sales conversation and may be delivered as **software the operator drives** OR a **done-for-you managed service** — we do NOT force that choice on the website. **Managed-service framing is ALLOWED** ("we run your AP/AR," "done for you," "hands-off"). This deliberately **reverses** the 2026-05-19 "system, not a managed service" rule. Lead with results — *"Your vendors, paid. Credits recovered every month. Overdue invoices, collected."* — never with "the platform automates X." Keep "automate/automation" out of heroes; it's a supporting proof point at most.
- **NO public pricing — anywhere**: no dollar plans, no tiers, no "$X/location," no "30-day free trial," no "subscription," no "cancel anytime," no "$20/artifact." Engagements are **custom, scoped per operation**. The retired two-tier Visibility/Automate subscription model and its numbers ($999/$899/$799/$749 retailer, $499+ vendor) are GONE from the site. **Illustrative example dollar amounts inside worked examples STAY** (a $1,250 settlement, a $7,200 overdue invoice) — only pricing-tier / plan / trial / subscription copy is removed. `marketing/scripts/check-docs-forbidden.sh` (Scan B) now blocks the pricing/trial tokens.
- **Consult-first CTAs → `/contact`**: every PRIMARY CTA is "Talk to us" / "See what you're owed" / "Get started" → `/contact`. No trial-signup and no self-serve "Sign Up" as a primary action. Keep a **free "see what you're owed" on-ramp** as the first step of the conversation (a lead magnet, framed as a first step — not a plan) → `/contact`.
- **Demote AI**: ShelfiQ/AI is HOW we deliver affordably, not WHAT we sell. Strip AI/robot iconography from heroes; keep the dedicated `/shelfiq` feature page. No hero leads with "our AI does X."
- **Diem — Chris's BIO ONLY**: "Founder & CEO, Diem Cannabis" is permitted ONLY as Chris's personal background/credential (`about.html`, the one-pager). NEVER as a ShelfSpace customer, reference, testimonial, logo, or "ShelfSpace runs Diem" usage claim. (This is the one exception to the old blanket "no Diem" ban.)
- **No customer names anywhere** — proof is anonymized case studies (`marketing/case-studies.md`, de-identified per its rules), the Metrc-certified badge, founder-as-operator credibility, aggregate numbers, and product sample renders (the "Holistic Cannabis Co." demo fiction is safe).
- **No "scan-based trading" or "SBT"**: use "consignment." Exception: terms.html, privacy.html (legal docs, don't touch).
- **No demo-modal** (deleted, don't recreate). **No `<br>` in headings** (let text wrap). **No questions as headlines** (they give permission to say "no"). **No "learn more" CTAs** (a dead end, not an action).
- **Verb split**: use "we" for brand + managed-delivery statements ("we run your AP," "we recover your credits"); "the platform" / "ShelfiQ" for software-action descriptions ("the platform three-way matches every invoice"); 2nd-person "you" for operator-driven actions ("you approve, we execute"). **Outcome voice** ("your vendors get paid") sidesteps the who-does-it question — prefer it in heroes. Never "ShelfSpace does X" — pick "we" or "the platform."

## Design System

- Fonts: DM Sans (display) + Space Mono (monospace — the hero of every dollar/number moment)
- Colors: `--green-deep` (#1b4332) through `--green-ghost` (#f0faf4), slate palette. **Design tokens only — never hardcoded hex.**
- Shadows: green-tinted. Whitespace = confidence — let numbers breathe. **One dark (`--green-deep`) section per page, max**, reserved for the emotional peak.
- ShelfiQ widget: `/shelfiq-widget.js` included on ALL pages as last script
- Apollo tracking: `initApollo()` script before `</head>` on all pages
- fi ligature fix: `font-variant-ligatures: none` when "Shelf" and "iQ" span split

## Nav (all pages)

Accounts Payable | Consignment | Credit Recovery | Platform ▾ | How We Work | About | Login | **Talk to us**

- **How We Work** replaces the old "Pricing" nav item. Its href stays **`/pricing`** — the repurposed numberless "How We Work With You" page, kept at that URL to preserve SEO equity.
- **"Talk to us"** (primary button → `/contact`) replaces the old "Sign Up." **Login** stays (→ `ourshelf.space/login`).
- The **Platform ▾** dropdown (`<li class="nav-dropdown">`, primitive in styles.css) contains: Vendor Management (→ `/vendor-management` alias) · How It Works · Features · ShelfiQ · Check Payments · Tutorials (→ `/tutorials`). It's inserted in every page's nav between the Credit Recovery `<li>` and the **How We Work** `<li>`. Desktop = CSS hover + `:focus-within` (no JS); mobile = inline always-expanded accordion. To re-roll sitewide, anchor on the nav `Credit Recovery</a></li>`→`How We Work` adjacency (newline-separated = nav-only; the footer's identical CR link is single-line and safe).

## Marketing & Copy

When writing or rewriting ANY marketing page, read `marketing/landing-page-playbook.md` first — the full framework: 5-beat emotional arc, psychological triggers, visual design rules, copy rules, CTA rules, page structure template. Every page follows this playbook.

Key references:
- `marketing/landing-page-playbook.md` — the conversion playbook (5-beat arc, design rules, copy rules, consult-first CTAs, SEO rules)
- `marketing/case-studies.md` — case-study system (de-identification rules, blog template, homepage cards, SEO targets) — the names-free proof engine
- `marketing/docs-instructions.md` — writing rules for documentation pages (different from marketing pages)

## Case Study System

When the user drops an email chain, PDF, or describes a situation they want turned into a case study:
1. Read `marketing/case-studies.md` first — it has the full playbook
2. De-identify (no names, no round dollar amounts, no dates)
3. Create the blog post at `/blog/case-study-{slug}.html`
4. Add a card to the homepage case study section in `index.html`
5. Update sitemap.xml and llms.txt
6. Add a card to `blog.html` (see Blog System below)

## Blog System

### How it works
- `blog.html` — Blog landing page card grid; every post in `/blog/` MUST have a card
- `llms.txt` — AI-readable site reference; lists every blog article under "Blog Articles"
- `marketing/scripts/check-blog-sync.sh` — Detects orphans (filesystem ↔ blog.html ↔ llms.txt) and broken links

### When creating a new blog post
The `/blog-post` and `/case-study` skills handle the full rollout. Manual checklist if you bypass the skills:
1. Add a compact-row card to the matching category section's `.section-list` in `blog.html` (e.g., for an AP post: top of `<div class="section-list">` inside `<section class="blog-section" data-section-cat="AP">`). Set `data-rank="1"` and bump prior cards' ranks. Categories: `AP`, `Case Study`, `Consignment`, `Credit Recovery`, `Vendor Management`. Small categories (Credit Recovery, Vendor Management) live in `<div class="blog-section-rest">` instead — all cards there carry `data-rank="99"`.
2. Optionally promote to the **featured slot** at the top of `blog.html` (replace the existing `.featured-card` body). The previous featured drops back to its category's section list.
3. Add a line to `llms.txt` under the "Blog Articles" section
4. Add a `<url>` to `sitemap.xml`
5. Run `marketing/scripts/check-blog-sync.sh` to verify

## Documentation System

### How it works
- `marketing/platform-map.md` — Feature map of the ShelfSpace platform (modules, files, tables)
- `marketing/docs-plan.md` — Which doc pages to write, URLs, keywords, source files
- `marketing/docs-instructions.md` — Full writing rules for doc pages (voice, SEO, template, CTA)
- `marketing/docs-manifest.json` — Maps each doc page to its platform source files + last synced date
- `marketing/scripts/check-docs-sync.sh` — Detects stale docs by comparing platform git changes to manifest

### When updating docs
1. Read `marketing/docs-manifest.json` to find which doc is stale
2. Read the platform source files listed in the manifest entry
3. Read the existing doc page
4. Update only what changed (preserve SEO juice)
5. Update `lastSynced` in docs-manifest.json
6. Update sitemap.xml lastmod date

### When creating new docs
1. Read `marketing/platform-map.md` for context
2. Read `marketing/docs-plan.md` for the planned page
3. Follow ALL rules in `marketing/docs-instructions.md`
4. Add entry to `docs-manifest.json`
5. Add entry to `sitemap.xml`
6. Add entry to the DOCS array in `/docs-search.js` (title, description, section, url, optional synonym keywords) and bump `?v=N` on every `<script src="/docs-search.js?v=N">` reference site-wide
7. **Link the new page from every sibling in the same `docs/<section>/` directory** — add it to each sibling's `<div class="docs-related-links">` block. The `/docs` section card routes to one article, not a section index; without sibling Related links the new page is invisible to anyone whose search-index cache is stale.
8. Bump the section-card article count and description on `docs/index.html`
9. Append a descriptive line under the matching section of `llms.txt`

## Repo Structure

```
/                     — HTML pages (index.html, about.html, etc.)
/blog/                — Blog articles
/docs/                — Documentation pages
/api/                 — Serverless functions (shelfiq-chat.js)
/logos/               — POS integration logos
/marketing/           — Internal marketing files (playbook, case-studies, docs-plan, etc.)
/styles.css           — Shared design system CSS
/shelfiq-widget.js    — Chat widget (included on all pages)
/docs-search.js       — Docs search (DOCS index + auto-mount; included on all /docs pages)
/llms.txt             — AI-readable site reference
/sitemap.xml          — All indexable URLs
/robots.txt           — Crawl rules
/vercel.json          — Vercel config (rewrites, redirects, headers)
```
