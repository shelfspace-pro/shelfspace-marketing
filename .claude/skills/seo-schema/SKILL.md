---
name: seo-schema
description: Add or fix JSON-LD structured data on shelfspace.pro: Article, BreadcrumbList, FAQPage, Organization, SoftwareApplication, HowTo, ItemList. Use on "schema", "structured data", "JSON-LD", "rich results", "FAQ schema", "breadcrumb schema".
---

<!-- Vendored from https://github.com/coreyhaines31/marketingskills (skills/schema, v2.0.2)
     at upstream commit 0cd9b3a0ef4c411a1d690419ce843f2a1da32cce. MIT License, Copyright (c) 2025 Corey Haines;
     full license text in ./LICENSE. Adapted for shelfspace.pro on 10/28/2026: ShelfSpace rules
     added, out-of-scope sections removed, human-outreach steps removed. -->

## ShelfSpace rules (read first; they override everything below)

Read `marketing/seo-house-rules.md` before anything else. It covers unattended running (no
questions, no human steps, nothing posted or sent), what never goes in this public repo,
naming, the claims registry, price and trial copy, voice, page style and the gates. Then:

- **Organization and publisher name is "ShelfSpace"**, never a product sub-brand. Author on posts:
  Chris Mitchem.
- **No `offers` with a price, no `AggregateRating` or `Review`** unless the same numbers are visible
  on the page and real. Today there are none, so don't add them. `SoftwareApplication` is fine
  without `offers.price`.
- **FAQPage stays where a visible FAQ exists**, text matching the visible answers verbatim
  (`check:seo` enforces parity). It is not there for a Google rich result.
- Dates in JSON-LD are ISO (`datePublished`, `dateModified`); visible dates are MM/DD/YYYY.
- Validate: `npm run check:seo`, then the Schema.org validator for anything new.

---

# Schema Markup

You are an expert in structured data and schema markup. Your goal is to implement schema.org markup that helps search engines understand content and enables rich results in search.

## Initial Assessment

**Context first:** read `marketing/seo-house-rules.md` and the repo `CLAUDE.md`. The business, audience, voice and naming are set there. Never ask for them, and never ask the questions below: answer them from the repo and the prompt that started you.

Before implementing schema, understand:

1. **Page Type** - What kind of page? What's the primary content? What rich results are possible?

2. **Current State** - Any existing schema? Errors in implementation? Which rich results already appearing?

3. **Goals** - Which rich results are you targeting? What's the business value?

---

## Core Principles

### 1. Accuracy First
- Schema must accurately represent page content
- Don't markup content that doesn't exist
- Keep updated when content changes

### 2. Use JSON-LD
- Google recommends JSON-LD format
- Easier to implement and maintain
- Place in `<head>` or end of `<body>`

### 3. Follow Google's Guidelines
- Only use markup Google supports
- Avoid spam tactics
- Review eligibility requirements

### 4. Validate Everything
- Test before deploying
- Monitor Search Console
- Fix errors promptly

---

## Common Schema Types

| Type | Use For | Required Properties |
|------|---------|-------------------|
| Organization | Company homepage/about | name, url |
| WebSite | Homepage/site identity | name, url |
| Article | Blog posts, news | headline, image, datePublished, author |
| Product | Product pages | name, image, offers |
| SoftwareApplication | SaaS/app pages | name, offers |
| FAQPage | FAQ content | mainEntity (Q&A array) |
| HowTo | Tutorials | name, step |
| BreadcrumbList | Any page with breadcrumbs | itemListElement |
| LocalBusiness | Local business pages | name, address |
| Event | Events, webinars | name, startDate, location |

**For complete JSON-LD examples**: See [references/schema-examples.md](references/schema-examples.md)

### Check Google Feature Support First

Schema.org vocabulary validity does not establish Google feature eligibility. Before implementing markup for a requested search appearance, check Google's current [supported structured data gallery](https://developers.google.com/search/docs/appearance/structured-data/search-gallery).

- **FAQPage:** Google stopped showing FAQ rich results on May 7, 2026, and removed the feature's documentation in June. The earlier government/health-site exception is no longer a route to FAQ rich results. See Google's [documentation updates](https://developers.google.com/search/updates).
- **HowTo:** Google retired HowTo rich results in September 2023. See the [retirement announcement](https://developers.google.com/search/blog/2023/08/howto-faq-changes).
- **WebSite / SearchAction:** Google retired the sitelinks search box in November 2024; `WebSite` still supports site names. See the [search box announcement](https://developers.google.com/search/blog/2024/10/sitelinks-search-box).

These types can still describe matching visible content in Schema.org. Explain that distinction, ask which consumer needs the markup, and do not recommend implementation to obtain a retired Google appearance. Do not treat missing retired-feature reports or Rich Results Test detection as a broken implementation, or remove unrelated supported markup.

---

## Quick Reference

### Organization (Company Page)
Required: name, url
Recommended: logo, sameAs (social profiles), contactPoint

### Article/BlogPosting
Required: headline, image, datePublished, author
Recommended: dateModified, publisher, description

### Product
Required: name, image, offers (price + availability)
Recommended: sku, brand, aggregateRating, review

### FAQPage
Required: mainEntity (array of Question/Answer pairs)
Optional semantic markup for visible FAQs; not a way to obtain Google FAQ rich results. Check the feature-support guidance above before offering code.

### BreadcrumbList
Required: itemListElement (array with position, name, item)

---

## Multiple Schema Types

You can combine multiple schema types on one page using `@graph`:

```json
{
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", ... },
    { "@type": "WebSite", ... },
    { "@type": "BreadcrumbList", ... }
  ]
}
```

---

## Validation and Testing

### Tools
- **Google Rich Results Test**: https://search.google.com/test/rich-results — test Google's currently supported features, not every Schema.org type
- **Schema.org Validator**: https://validator.schema.org/
- **Search Console**: available enhancement reports for supported features; retired types need not have a report

### Common Errors

**Missing required properties** - Check Google's documentation for required fields

**Invalid values** - Dates must be ISO 8601, URLs fully qualified, enumerations exact

**Mismatch with page content** - Schema doesn't match visible content

---

## Implementation

### Static Sites
- This site: JSON-LD is inline `<script type="application/ld+json">` blocks in each page's `<head>` (blog posts carry Article + BreadcrumbList + FAQPage)
- No includes or partials; copy the block from the reference post and edit it

## Output Format

### Schema Implementation
```json
// Full JSON-LD code block
{
  "@context": "https://schema.org",
  "@type": "...",
  // Complete markup
}
```

### Testing Checklist
- [ ] Requested Google appearance is currently supported, or a separate semantic consumer is identified
- [ ] Validates in Schema.org Validator; supported Google features also pass Rich Results Test
- [ ] Required-field errors resolved; recommended-field warnings reviewed
- [ ] Matches page content
- [ ] All required properties included

---

## Related Skills

- **seo-audit**: overall SEO including schema review
- **seo-ai-search**: structured context for AI answers
- **seo-programmatic**: templated schema at scale
- **seo-site-architecture**: breadcrumb structure
