# ShelfSpace Documentation Writing Instructions
# Every agent writing docs MUST follow these rules.

## Voice & Tone
- Write as ShelfSpace explaining what we do for the customer, not as a software manual
- "Here's how we handle your weekly settlements" not "Click Generate Settlement"
- Use "we" for ShelfSpace, "you" for the reader
- Assume the reader is a cannabis dispensary owner or GM
- Short sentences, short paragraphs, no filler
- Managed service framing: emphasize what WE handle vs. what the retailer does (almost nothing)

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
   - Highlight boxes (green-ghost) for "what we handle" emphasis
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
     - AP: "Ready to hand off your AP? Let's talk."
     - Vendor Portal: "Want your vendors on a portal? Let's talk."
     - Integrations: "Ready to connect your systems? Let's talk."
     - Generic: "Ready for a free 60-day pilot? Let's talk."
   - One button: "Talk to Us →" → /contact
   - Below button: "Free 60-day pilot. We handle setup."
   - No secondary CTA
```

## Visual Design
- Same fonts (DM Sans + Space Mono), colors, nav, footer as marketing site
- 720px max-width content area
- Left sidebar navigation (all doc sections/pages), sticky on scroll, collapses to dropdown on mobile
- More whitespace than marketing pages
- var(--green-ghost) for callout boxes
- var(--slate-50) for technical blocks
- Subtle 1px borders between sections

## Forbidden Content
- No "automate/automated/automatically/automation"
- No "scan-based trading" or "SBT"
- No "demo-modal" references
- No "Diem Cannabis"
- No `<br>` tags in headings — let text flow and wrap naturally

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

## Freshness Rules
- Every doc has a last-synced date
- When regenerating stale docs, update only what changed (preserve SEO juice)
- New features get new doc pages (don't cram into existing)
- Removed features get pages deleted or redirected
