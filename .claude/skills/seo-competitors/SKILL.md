---
name: seo-competitors
description: Build fair comparison and alternative pages for shelfspace.pro: ShelfSpace vs a named competitor, "X alternatives", "best cannabis AR and collections tools", competitor-vs-competitor, and audits of stale competitor claims. Use on "vs page", "comparison page", "alternative page", "best tools list", "are our comparison pages out of date".
---

<!-- Vendored from https://github.com/coreyhaines31/marketingskills (skills/competitors, v2.3.0)
     at upstream commit 0cd9b3a0ef4c411a1d690419ce843f2a1da32cce. MIT License, Copyright (c) 2025 Corey Haines;
     full license text in ./LICENSE. Adapted for shelfspace.pro on 10/28/2026: ShelfSpace rules
     added, out-of-scope sections removed, human-outreach steps removed. -->

## ShelfSpace rules (read first; they override everything below)

Read `marketing/seo-house-rules.md` before anything else. It covers unattended running (no
questions, no human steps, nothing posted or sent), what never goes in this public repo,
naming, the claims registry, price and trial copy, voice, page style and the gates. Then:

- **Fair or not at all.** Each page says plainly where the competitor fits better (an ERP, a
  marketplace, a distributor), and is accurate enough that the competitor's own team could read it
  without a valid complaint. Facts from their public pages only, each linked and dated.
- **Positioning:** ShelfSpace is cannabis collections software / accounts receivable software for
  brands, done for you. Never an agency. One brand name.
- **Page format:** a post in `blog/` following `marketing/managed-services-blog-agent-brief.md`, with
  a compare-table, the 10/27/2026 page style and the script-owned CTA.
- **Our side of every table** uses only capabilities already described on this site; no new
  claims, no timelines, no price.
- **Self-ranked "best" lists can hand the recommendation to competitors** (see seo-ai-search,
  citations vs recommendations): include real options, and be the honest pick for brands that
  want collections handled.

---

# Competitor & Alternative Pages

You are an expert in creating competitor comparison and alternative pages. Your goal is to build pages that rank for competitive search terms, provide genuine value to evaluators, and position your product effectively.

## Initial Assessment

**Context first:** read `marketing/seo-house-rules.md` and the repo `CLAUDE.md`. The business, audience, voice and naming are set there. Never ask for them, and never ask the questions below: answer them from the repo and the prompt that started you.

**Never guess the competitor.** If your prompt doesn't name one, don't build the page; say so in your final reply.

Before creating competitor pages, understand:

1. **Your Product**
   - Core value proposition
   - Key differentiators
   - Ideal customer profile
   - Pricing model
   - Strengths and honest weaknesses

2. **Competitive Landscape**
   - Direct competitors
   - Indirect/adjacent competitors
   - Market positioning of each
   - Search volume for competitor terms

3. **Goals**
   - SEO traffic capture
   - Sales enablement
   - Conversion from competitor users
   - Brand positioning

---

## Core Principles

### 1. Honesty Builds Trust
- Acknowledge competitor strengths
- Be accurate about your limitations
- Don't misrepresent competitor features
- Readers are comparing—they'll verify claims

### 2. Depth Over Surface
- Go beyond feature checklists
- Explain *why* differences matter
- Include use cases and scenarios
- Show, don't just tell

### 3. Help Them Decide
- Different tools fit different needs
- Be clear about who you're best for
- Be clear about who competitor is best for
- Reduce evaluation friction

### 4. Modular Content Architecture
- Competitor data should be centralized
- Updates propagate to all pages
- Single source of truth per competitor

### 5. Evidence Discipline
Comparison pages are public claims about another company. Every one should survive the competitor's own team reading it.
- **"Not observed" is not "doesn't have."** A pricing page that doesn't list SSO is evidence about the page, not the product. Write "not listed on their pricing page (as of Mar 2026)" or drop the row. Use ✗ or "not available" only when their docs or a hands-on trial confirm the absence.
- **Date competitor facts.** Pricing and features change. Put an "as of" date on pricing tables and in the competitor data file, and re-verify before republishing.
- **One look is a snapshot.** A single visit can't support "they haven't changed pricing in years" or "no new features since 2024." That needs dated history (changelog, archived pages).
- **State what changed, not why.** "They moved SSO to the Enterprise tier" is a fact. "Because they're squeezing upmarket" is a guess. Leave motive out unless they've said it publicly.
- **Separate fact from interpretation.** Keep what their site says apart from what you think it means for the buyer, and keep both apart from what you recommend.

---

## Page Formats

### Format 1: [Competitor] Alternative (Singular)

**Search intent**: User is actively looking to switch from a specific competitor

**URL pattern**: `/alternatives/[competitor]` or `/[competitor]-alternative`

**Target keywords**: "[Competitor] alternative", "alternative to [Competitor]", "switch from [Competitor]"

**Page structure**:
1. Why people look for alternatives (validate their pain)
2. Summary: You as the alternative (quick positioning)
3. Detailed comparison (features, service, pricing)
4. Who should switch (and who shouldn't)
5. Migration path
6. Social proof from switchers
7. CTA

---

### Format 2: [Competitor] Alternatives (Plural)

**Search intent**: User is researching options, earlier in journey

**URL pattern**: `/alternatives/[competitor]-alternatives`

**Target keywords**: "[Competitor] alternatives", "best [Competitor] alternatives", "tools like [Competitor]"

**Page structure**:
1. Why people look for alternatives (common pain points)
2. What to look for in an alternative (criteria framework)
3. List of alternatives (you first, but include real options)
4. Comparison table (summary)
5. Detailed breakdown of each alternative
6. Recommendation by use case
7. CTA

**Important**: Include 4-7 real alternatives. Being genuinely helpful builds trust and ranks better.

**AI-answer expectations by stage**: these pages often earn *citations* in AI answers, but whether AI *recommends* your brand from them depends on offsite consensus (reviews, forums, analysts) — for emerging brands, a self-ranked list can surface the competitors in the AI answer while you get only the citation. Still publish for search intent and category framing, but set expectations accordingly — see ai-seo's citations-vs-recommendations reference for the data.

---

### Format 3: You vs [Competitor]

**Search intent**: User is directly comparing you to a specific competitor

**URL pattern**: `/vs/[competitor]` or `/compare/[you]-vs-[competitor]`

**Target keywords**: "[You] vs [Competitor]", "[Competitor] vs [You]"

**Page structure**:
1. TL;DR summary (key differences in 2-3 sentences)
2. At-a-glance comparison table
3. Detailed comparison by category (Features, Pricing, Support, Ease of use, Integrations)
4. Who [You] is best for
5. Who [Competitor] is best for (be honest)
6. What customers say (testimonials from switchers)
7. Migration support
8. CTA

---

### Format 4: [Competitor A] vs [Competitor B]

**Search intent**: User comparing two competitors (not you directly)

**URL pattern**: `/compare/[competitor-a]-vs-[competitor-b]`

**Page structure**:
1. Overview of both products
2. Comparison by category
3. Who each is best for
4. The third option (introduce yourself)
5. Comparison table (all three)
6. CTA

**Why this works**: Captures search traffic for competitor terms, positions you as knowledgeable.

---

## Essential Sections

### TL;DR Summary
Start every page with a quick summary for scanners—key differences in 2-3 sentences.

### Paragraph Comparisons
Go beyond tables. For each dimension, write a paragraph explaining the differences and when each matters.

### Feature Comparison
For each category: describe how each handles it, list strengths and limitations, give bottom line recommendation.

### Pricing Comparison
Only the competitor's own published prices, linked and dated "as of MM/DD/YYYY". ShelfSpace's cell reads "Quoted after a free review". No total-cost math that implies our price.

### Who It's For
Be explicit about ideal customer for each option. Honest recommendations build trust.

### Migration Section
Cover what transfers and what support exists, using only product facts already published on this site. No switcher quotes unless they are real and already published.

**For detailed templates**: See [references/templates.md](references/templates.md)

---

## Content Architecture

### Competitor Facts Live on the Page
This repo is public, so there is no central competitor data file here (it would be competitor strategy in public). Each fact sits on the page that uses it, with its source link and check date. When a fact changes, grep the repo for it and fix every page in the same change.

---

## Research Process

### Deep Competitor Research

For each competitor, gather:

1. **Product research**: their public site, docs, help center and changelog. Don't create accounts on their product
2. **Pricing research**: Current pricing, what's included, hidden costs
3. **Review mining**: G2, Capterra, TrustRadius for common praise/complaint themes
4. **Content research**: Their positioning, their comparison pages, their changelog

### Ongoing Updates

- **Quarterly**: Verify pricing, check for major feature changes
- **Annually**: Full refresh of all competitor data

### Competitive Asset Audit

When asked to check existing competitive content for stale or risky claims, audit every page in this repo that makes claims about competitors: vs and alternative pages, comparison tables in posts, and `llms.txt`.

1. **List each claim** about a competitor, with the asset and line it lives in.
2. **Re-verify each claim** against the competitor's current site, docs, or changelog, and note the date you checked. If you can't browse, mark claims unchecked and list what to verify. Never mark one Current without a check date.
3. **Mark each one**:
   - **Current**: still true, source and date updated
   - **Changed**: now wrong, with what it says now
   - **Unverifiable**: had a source once, but nothing current confirms or rules it out. Soften to "not listed (as of date)" or remove
   - **Overclaimed**: stated as fact with no source behind it (an unconfirmed ✗, a guessed motive, a "why we win" with no evidence). Rewrite to what the evidence supports or remove
4. **Prioritize fixes**: the pages with the most traffic first.
5. **Report**: assets audited, claims checked, counts by status, and a fix list with the replacement wording.

Apply the Evidence Discipline rules above to every claim. Where several pages repeat one fact, grep for it and fix every page in the same change.

---

## SEO Considerations

### Keyword Targeting

| Format | Primary Keywords |
|--------|-----------------|
| Alternative (singular) | [Competitor] alternative, alternative to [Competitor] |
| Alternatives (plural) | [Competitor] alternatives, best [Competitor] alternatives |
| You vs Competitor | [You] vs [Competitor], [Competitor] vs [You] |
| Competitor vs Competitor | [A] vs [B], [B] vs [A] |

### Internal Linking
- Link between related competitor pages
- Link from feature pages to relevant comparisons
- Create hub page linking to all competitor content

### Schema Markup
Consider FAQ schema for common questions like "What is the best alternative to [Competitor]?"

---

## Output Format

### Page Content
For each page: URL, meta tags, full page copy organized by section, comparison tables, CTAs.

### Page Set Plan
Recommended pages in priority order, in your final reply (never as a file in this repo).

### Asset Audit Report
Claims checked per asset, status counts (current / changed / unverifiable / overclaimed), and a prioritized fix list with replacement wording.

---

## Related Skills

- **seo-programmatic**: comparison pages at scale
- **seo-audit**: optimizing comparison pages
- **seo-schema**: FAQ and ItemList schema
- **seo-ai-search**: getting comparisons cited
