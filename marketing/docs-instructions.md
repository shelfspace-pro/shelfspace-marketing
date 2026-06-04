# ShelfSpace Documentation Writing Instructions
# Every agent writing docs MUST follow these rules.

## Voice & Tone
- Write retailer-voiced — these docs are for cannabis dispensary owners and GMs driving ShelfSpace day-to-day
- Verb split (per CLAUDE.md L22): "we" for brand-level statements ("we're allergic to subscriptions"); "the platform" / "ShelfiQ" for software actions ("the platform pulls POS data," "ShelfiQ answers vendor email"); "you" for retailer actions on the platform ("you approve the settlement"). Never "ShelfSpace does X" — pick "we" or "the platform" based on context
- Frame: ShelfSpace is a cannabis-specific system the retailer drives. The platform runs the data, the math, the payments, and the reports; you own the vendor relationship. NOT a managed service
- "Here's how the platform runs your weekly settlements" — not "Here's how we handle your weekly settlements"
- Assume the reader is a cannabis dispensary owner or GM
- Short sentences, short paragraphs, no filler

## SEO Rules

### Keyword Placement (every page)
- Title tag: primary keyword + "ShelfSpace" (under 60 chars)
- H1: contains primary keyword naturally (question format OK)
- Meta description: primary keyword in first 50 chars, under 155 total
- First paragraph: contains primary keyword within first 2 sentences
- At least one H2: contains primary or secondary keyword
- URL slug: contains primary keyword, hyphenated
- At-a-glance box: keyword in at least one bullet

### Content Length
- 400-800 words per doc page (concise, not blog-length)
- If a topic needs more depth, split into multiple pages (more pages = more keyword targets)
- **Exception — procedural SOPs:** Step-by-step training pages (e.g. "How to receive a delivery") are exempt; target ~1000-1500 words on a single URL. Splitting hurts the reader's workflow narrative and produces thin pages that don't rank.

### Internal Linking (every page)
- At least 1 link to another doc page ("See also: Settlement Reports")
- At least 1 link to the relevant marketing service page (/consignment, /accounts-payable, /credit-recovery)
- At least 1 link to a blog article if one exists
- Use keyword-rich anchor text, not "click here"

### Structured Data
- Every doc page: TechArticle JSON-LD with headline, datePublished, dateModified, author (ShelfSpace)
- Docs index page: WebPage schema

## Page Template (every doc page)

```
1. Compact page hero
   - Section label: category name (Consignment, Credit Recovery, AP, etc.)
   - H1: clear question or topic name with primary keyword

2. At-a-glance box
   - Green ghost background, rounded corners
   - 3-5 bullet points directly answering the topic
   - This is what LLMs and scanners extract first

3. Body content
   - H2 subheadings (scannable sections)
   - Short paragraphs (2-4 sentences)
   - Bullet lists for 3+ items
   - Highlight boxes (green-ghost) for "what the platform runs" / "what you own" emphasis
   - NO AI-generated images
   - Subtle visual elements: dividers, callout boxes, bold, inline SVG icons

4. Related docs
   - 2-3 links to other doc pages at the bottom
   - Subtle row of links, not a full section

5. CTA (EVERY page, no exceptions)
   - Single CTA pushing to /contact
   - Copy varies by section:
     - Consignment: "Ready to free up your capital? Let's talk."
     - Credit Recovery: "Ready to start recovering what you're owed? Let's talk."
     - AP: "Ready to upgrade your AP? Let's talk."
     - Vendor Portal: "Want your vendors on a portal? Let's talk."
     - Integrations: "Ready to connect your systems? Let's talk."
     - Generic: "Ready for a free evaluation? Let's talk."
   - One button: "Talk to Us →" → /contact
   - Below button: "Free evaluation. We handle setup."
   - No secondary CTA
```

## Visual Design
- Same fonts (DM Sans + Space Mono), colors, nav, footer as marketing site
- 720px max-width content area
- Left sidebar TOC (all 14 sections + 45 articles), sticky on scroll, collapses to `<details>` dropdown on mobile. Rendered client-side by `docs-search.js` from the DOCS array — single source of truth. Mount point: `<aside class="docs-sidebar" data-docs-sidebar>` placed inside `<div class="docs-layout docs-with-sidebar">` BEFORE `<main class="docs-content">`.
- Right rail "On this page" anchor list, auto-built from `<h2>` elements in `.docs-content`. Gates on ≥3 H2s (shorter pages hide it). Mount point: `<aside class="docs-on-this-page" data-on-this-page></aside>` placed AFTER `</main>` inside the layout div. Hidden ≤1199px viewport.
- More whitespace than marketing pages
- var(--green-ghost) for callout boxes
- var(--slate-50) for technical blocks
- Subtle 1px borders between sections

## Forbidden Content
- No "managed service" / "we cut the check" / "we run your AP" / "we handle the math" framing — ShelfSpace is a cannabis-specific system retailers drive on (see CLAUDE.md L15)
- No "scan-based trading" or "SBT"
- No "demo-modal" references
- No "Diem Cannabis"
- No `<br>` tags in headings — let text flow and wrap naturally

## Allowed (post-pivot, prior bans retired)
- "Automate / automated / automatically / automation" are OK when describing what the platform or ShelfiQ does (the 2026-05-19 pivot retired the prior ban; see CLAUDE.md L15)

## Required Elements (checklist)
1. Primary keyword in title, H1, meta description, first paragraph, at least one H2
2. No forbidden words
3. CTA to /contact at bottom
4. At-a-glance box with 3-5 bullets
5. At least 1 link to another doc page
6. At least 1 link to a marketing service page
7. <!-- last-synced: YYYY-MM-DD --> comment in HTML
8. Entry in docs-manifest.json
9. Entry in sitemap.xml
10. Apollo tracking script before </head>
11. shelfiq-widget.js as last script
12. Nav: 7 items, no active state
13. Footer: Blog in Platform column, Credit Recovery in Services column
14. TechArticle JSON-LD schema
15. For new pages in an existing section: **add the new page to every sibling page's `<div class="docs-related-links">` block.** The sidebar TOC is rendered from the DOCS array in `docs-search.js`, so adding the page there populates the sidebar everywhere — but the contextual `.docs-related-links` pill row is still hand-authored per article. Ship in the same commit. Update the section card count + add a new compact row in the relevant section of `docs/index.html`. Bump `?v=N` on `docs-search.js` site-wide.
16. **Source of truth sync (every new doc):** add to (a) DOCS array in `docs-search.js` with `t` (full SEO title), `n` (short sidebar nickname), `d`, `s`, `u`, `k` fields; (b) the appropriate section's `.docs-section-list` in `docs/index.html` as a new `.docs-row`; (c) sitemap.xml; (d) llms.txt Docs Articles block; (e) `<div data-docs-sidebar>` and `<div data-on-this-page>` mount points in the new article's layout (matches existing articles); (f) **the global guide count in the `docs/index.html` hero subline** (`<p class="section-desc">N guides across…`) — easy to miss, it is NOT the per-section count.
17. **New section (not just a new page in an existing section):** also (a) add the section name to the **`SECTION_ORDER` array in `docs-search.js`** — without it the sidebar won't group/render the section; (b) add a new `<section class="docs-section reveal" id="section-{slug}" data-section-cat="{Name}" data-filter-bucket="Setup">` block (header with `<span class="docs-section-count">` + a `.docs-section-list`) to `docs/index.html`; (c) set the new doc's `s` field in the DOCS array to the new section name. Confirmed 2026-06-04 building the Inventory section for `/docs/inventory/slots`. A one-page section is acceptable if the topic has expansion runway.

## Freshness Rules
- Every doc has a last-synced date
- When regenerating stale docs, update only what changed (preserve SEO juice)
- New features get new doc pages (don't cram into existing)
- Removed features get pages deleted or redirected
