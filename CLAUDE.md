# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

ShelfSpace marketing site — static HTML/CSS deployed on Vercel at shelfspace.pro. Serves as the public-facing website for ShelfSpace, a cannabis-specific system for profit optimization — AP, consignment, and credit recovery workflows for cannabis dispensaries.

## Workflow

- **Always push to production**: After completing work, commit and push directly to `main`. Do not wait for confirmation.

## Key Rules

- **No "managed service" / "we cut the check" / "we run your AP" framing**: As of 2026-05-19 ShelfSpace is a cannabis-specific system, not a managed service. AP, consignment, and credit recovery all run on a system retailers drive: ShelfiQ handles first-line vendor email on AP; retailer owns vendor outreach, contracts, and disputes on consignment; the platform pulls data + builds and sends credit memos and reminders on credit recovery, retailer team handles vendor negotiations. Customer-facing copy uses "system" as the brand noun; "software" stays for competitor/category references and the "software seats" pricing idiom. "Automate/automated" is now acceptable when describing what the platform or ShelfiQ does. See `memory/project_software_platform_pivot.md` and `memory/project_consignment_positioning.md`.
- **No "scan-based trading" or "SBT"**: Use "consignment" instead. Exception: terms.html and privacy.html (legal docs, don't touch).
- **No "Diem Cannabis"**: Removed from site, don't reintroduce.
- **No demo-modal**: Deleted. Don't reference or recreate.
- **No `<br>` in headings**: Let text flow and wrap naturally.
- **CTAs — primary → free-trial signup, secondary → /contact**: The primary CTA on pricing/feature pages is "Start your free 30-day trial" → the app signup (the platform ships self-serve trial signup + self-serve upgrade). "Talk to us" → `/contact` is the SECONDARY CTA. (Legacy pages that still route every button to `/contact` are fine until re-templated, but new/rewritten pages lead with the trial signup.)
- **Subscription + trial language is SANCTIONED (updated 2026-08-09)**: ShelfSpace pricing is a **two-tier subscription** model. Say "30-day free trial, then $X/mo — cancel anytime before renewal", and include an **auto-renewal disclosure** wherever the trial is offered (legal requirement — the trial auto-converts to paid and the payment method is captured at trial start). Do NOT reintroduce the retired "allergic to subscriptions", "$20 per artifact / per check / per credit memo", "1% capped at $100", or "free evaluation, not a trial / pay on results" framing — those are the OLD model and are now blocked by `marketing/scripts/check-docs-forbidden.sh`.
- **Two-tier positioning (Visibility vs Automate)**: The one-line rule is **Free = SEE and RECEIVE; Paid = AUTOMATE, INTEGRATE, ORIGINATE.**
  - **Visibility (Free)** — both retailers and vendors: track transactions, see money owed/stuck/overdue quantified on every login, receive checks/settlement reports, upload/Metrc sync, get verified, reactive ShelfiQ Q&A metered at **25 msgs/mo**.
  - **Automate (Paid)** — a fixed monthly subscription that unlocks the tools that ACT on the pain: Metrc↔invoice verification, short-pay/adjust, cut checks + ACH origination, the credit-recovery engine, proactive AP/AR bots + unlimited ShelfiQ, QuickBooks sync, slots/demand planning, promotions + price-drop actions.
  - **Retailer pricing** — per billable location, bulk-discount curve, **one bundled Automate tier** (everything included): **1 = $999 · 2–3 = $899 · 4–9 = $799 · 10+ = $749** per location. Billed **per shop/license** (each dispensary is its own LLC/bank), and every shop in a chain gets the chain rate on its own invoice (e.g. MedsCafe's 7 shops each bill at **$799**, the 4–9 band — **never $749**).
  - **Vendor pricing** — banded by # of retailers the vendor collects from: **Starter 1–16 = $499 · Growth 17–50 = $899 · Scale 51–150 = $1,499 · Enterprise 150–500+ = $3,000–5,000+ / custom.**
  - **Payment rails** — **ACH included** in the subscription; **mailed checks $5 each**.
  - Canonical source of truth (numbers, feature matrices, never-gate rules): `docs/specs/pricing-packaging-free-vs-paid.md` in the platform repo. Do not round, rename, or invent bands.
- **Verb split**: Use "we" for brand-level statements ("we work in every state"). Use "the platform" / "ShelfiQ" verbs for software-action descriptions ("the platform three-way matches every invoice," "ShelfiQ answers vendor emails in seconds"). Use 2nd-person "you" for retailer actions on the platform ("you cut the check," "you approve and send"). Never say "ShelfSpace does X" — pick "we" or "the platform" based on context.

## Design System

- Fonts: DM Sans (display) + Space Mono (monospace)
- Colors: --green-deep (#1b4332) through --green-ghost (#f0faf4), slate palette
- ShelfiQ widget: `/shelfiq-widget.js` included on ALL pages as last script
- Apollo tracking: `initApollo()` script before `</head>` on all pages
- fi ligature fix: `font-variant-ligatures: none` when "Shelf" and "iQ" span split

## Nav (all pages)

Accounts Payable | Consignment | Credit Recovery | Platform ▾ | Pricing | About | Login | Sign Up

The **Platform ▾** dropdown (`<li class="nav-dropdown">`, primitive in styles.css) contains: Vendor Management (→ `/vendor-management` alias) · How It Works · Features · ShelfiQ · Check Payments · Tutorials (→ `/tutorials` — video training hub, see `memory/reference_tutorials_system.md`). It's inserted in every page's nav between the Credit Recovery `<li>` and the Pricing `<li>` (139 files). Desktop = CSS hover + `:focus-within` (no JS); mobile = inline always-expanded accordion. To re-roll sitewide, anchor on the nav `Credit Recovery</a></li>`→`Pricing` adjacency (newline-separated = nav-only; the footer's identical CR link is single-line and safe).

## Marketing & Copy

When writing or rewriting ANY marketing page, read `marketing/landing-page-playbook.md` first. It contains the full framework: 5-beat emotional arc, psychological triggers, visual design rules, copy rules, CTA rules, and page structure template. Every page should follow this playbook.

Key references:
- `marketing/landing-page-playbook.md` — The conversion playbook (5-beat emotional arc, design rules, copy rules)
- `marketing/case-studies.md` — Case study system (de-identification rules, blog template, homepage cards, SEO targets)
- `marketing/docs-instructions.md` — Writing rules for documentation pages (different from marketing pages)

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
/blog/                — Blog articles (8 articles)
/docs/                — Documentation pages (not yet created)
/api/                 — Serverless functions (shelfiq-chat.js)
/logos/               — POS integration logos
/marketing/           — Internal marketing files (platform-map, docs-plan, etc.)
/styles.css           — Shared design system CSS
/shelfiq-widget.js    — Chat widget (included on all pages)
/docs-search.js       — Docs search (DOCS index + auto-mount; included on all /docs pages)
/llms.txt             — AI-readable site reference
/sitemap.xml          — All indexable URLs
/robots.txt           — Crawl rules
/vercel.json          — Vercel config (rewrites, redirects, headers)
```
