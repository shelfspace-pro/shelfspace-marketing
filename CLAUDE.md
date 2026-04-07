# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

ShelfSpace marketing site — static HTML/CSS deployed on Vercel at shelfspace.pro. Serves as the public-facing website for ShelfSpace, a managed AP, consignment, and credit recovery service for cannabis dispensaries.

## Workflow

- **Always push to production**: After completing work, commit and push directly to `main`. Do not wait for confirmation.

## Key Rules

- **No "automate" language**: Never use automate, automated, automatically, automation. Use "handles," "runs," "manages," "takes care of" instead. ShelfSpace is a managed service, not software.
- **No "scan-based trading" or "SBT"**: Use "consignment" instead. Exception: terms.html and privacy.html (legal docs, don't touch).
- **No "Diem Cannabis"**: Removed from site, don't reintroduce.
- **No demo-modal**: Deleted. Don't reference or recreate.
- **No `<br>` in headings**: Let text flow and wrap naturally.
- **All CTAs → /contact**: Every signup button goes to the contact page.
- **No pilot/trial language**: Never use "60-day pilot" or any pilot/trial framing. The model is free evaluation → paid on results.
- **"We" voice**: Use "we" for ShelfSpace in body copy, not "ShelfSpace does" or "the platform does."

## Design System

- Fonts: DM Sans (display) + Space Mono (monospace)
- Colors: --green-deep (#1b4332) through --green-ghost (#f0faf4), slate palette
- ShelfiQ widget: `/shelfiq-widget.js` included on ALL pages as last script
- Apollo tracking: `initApollo()` script before `</head>` on all pages
- fi ligature fix: `font-variant-ligatures: none` when "Shelf" and "iQ" span split

## Nav (all pages)

Consignment | Accounts Payable | Credit Recovery | Pricing | About | Login | Sign Up

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
/llms.txt             — AI-readable site reference
/sitemap.xml          — All indexable URLs
/robots.txt           — Crawl rules
/vercel.json          — Vercel config (rewrites, redirects, headers)
```
