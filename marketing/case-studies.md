# Case Study System

Instructions for creating case studies from real ShelfSpace stories. When the user drops an email chain, PDF, or describes a situation, follow this playbook exactly.

## Two Deliverables Per Story

Every case study produces:
1. **A card** on the homepage case study section (`index.html`)
2. **A blog post** at `/blog/case-study-{slug}.html`

## Step-by-Step Process

### 1. Read the source material
- Read the email/PDF/description the user provides
- Identify: what went wrong, what ShelfSpace caught, which features were used, how much was saved

### 2. De-identify
- **No company names.** Use "a multi-location retailer," "a single-store dispensary," "a vendor," etc.
- **No people names.** Remove all.
- **No location names.** Use "Location A / Location B" or "their second store."
- **Fuzz the dollar amount.** Never use a round number ($5,000 looks fake). Offset by a realistic amount. $5,290 → $4,873. $4,330 → $4,180. Make it feel like a real number someone would encounter on an invoice.
- **No dates** that could identify the parties. Use relative timing ("within 24 hours," "during the first 14 days").

### 3. Classify the category
Each case study belongs to exactly one category:
- `accounts-payable` — duplicate invoices, overpayments, shorted deliveries, wrong-entity billing, AP errors
- `consignment` — vendor onboarding, inventory conversion, waste reduction, margin protection
- `credit-recovery` — vendor credits, co-marketing credits, return credits, promo reimbursements

### 4. SEO optimization
Before writing, determine:
- **Primary keyword** (1 phrase, high-intent for cannabis dispensary operators)
- **3-5 secondary keywords**
- **Title tag** (under 60 characters, includes primary keyword + ShelfSpace)
- **Meta description** (150-160 chars, direct answer to what someone would Google)
- **URL slug** (`/blog/case-study-{descriptive-slug}`)

Blue-ocean keywords to target (very low cannabis-specific competition as of 2026):
- AP: `dispensary accounts payable errors`, `duplicate invoice prevention cannabis`, `dispensary invoice verification`
- Consignment: `cannabis consignment for dispensaries`, `consignment vs wholesale cannabis`, `dispensary inventory waste`
- Credit Recovery: `cannabis vendor credit recovery`, `dispensary vendor credits`, `cannabis co-marketing credits`

### 5. Write the blog post

**Structure (5 sections + CTA, no more):**

1. **The Setup** (2-3 sentences) — De-identified retailer context. Set the scene. What did the situation look like before ShelfSpace got involved?

2. **What We Caught** — The specific error, opportunity, or savings. Lead with the dollar amount. Be specific enough to be credible but vague enough to protect identity.

3. **How We Caught It** — Which ShelfSpace features/processes were involved. This is the product marketing section. Include internal links to the relevant service page (`/accounts-payable`, `/consignment`, `/credit-recovery`). Explain the mechanics — readers should understand *why* this gets missed and *how* ShelfSpace catches it.

4. **The Result** — Dollar amount saved, what would have happened without ShelfSpace, and the broader implication (how often this happens industry-wide).

5. **The Takeaway** — One punchy sentence. The kind of line someone screenshots and sends to their business partner.

6. **CTA card** — "Get My Free Evaluation" with Chris's photo, risk reversal line.

**Writing rules:**
- Follow ALL rules from `marketing/landing-page-playbook.md` (voice, copy rules, forbidden words)
- "We" voice — "We checked the system" not "ShelfSpace's system detected"
- No "automate" language — "We verified" not "Our system automatically flagged"
- Short paragraphs. If a paragraph is more than 3 sentences, split it.
- Every section should make the reader feel something: fear (this could happen to me), relief (there's a way to catch it), or urgency (I need to call these people)
- Include 1-2 FAQ items as `<details>` at the bottom targeting related long-tail queries. Wrap in FAQPage JSON-LD schema.

**Technical requirements:**
- Use the existing blog post template (copy structure from any `/blog/*.html` file)
- JSON-LD Article schema + FAQPage schema
- OG and Twitter Card meta tags
- Canonical URL
- Google Analytics + Apollo tracking
- ShelfiQ widget as last script
- All the same nav, footer, responsive patterns as other blog posts

### 6. Add the homepage card

Add a card to the case study section in `index.html`:

```html
<div class="case-card" data-category="accounts-payable">
  <div class="case-tag case-tag--ap">Accounts Payable</div>
  <div class="case-amount">$4,873</div>
  <div class="case-headline">Stopped a duplicate invoice across two locations</div>
  <p class="case-summary">A vendor billed the wrong entity for an invoice already paid from another location. We caught it the same day.</p>
  <div class="case-meta">
    <span class="case-speed">Same-day catch</span>
    <a href="/blog/case-study-duplicate-invoice" class="case-link">Read the full story <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></a>
  </div>
</div>
```

**Card fields:**
- `data-category`: one of `accounts-payable`, `consignment`, `credit-recovery`
- `.case-tag`: category pill (class varies: `case-tag--ap`, `case-tag--consignment`, `case-tag--credit`)
- `.case-amount`: dollar amount saved (Space Mono, big, bold — the hero of the card)
- `.case-headline`: one line, what ShelfSpace did
- `.case-summary`: 2 sentences max, what happened
- `.case-speed`: how fast ("Same-day catch", "Results in 60 days", "Found in 14 days")
- `.case-link`: link to full blog post

### 7. Update sitemap.xml
Add the new blog post URL with today's date as lastmod.

### 8. Update llms.txt
Add a one-line entry for the new case study under the blog section.

## Existing Case Studies

| # | Slug | Category | Amount | Headline | Status |
|---|---|---|---|---|---|
| 1 | `case-study-duplicate-invoice` | accounts-payable | $4,873 | Stopped a duplicate invoice across two locations | Live |
| 2 | `case-study-shorted-delivery` | accounts-payable | $1,140 | Caught a shorted delivery before payment went out | Live |
| 3 | `case-study-non-cannabis-vendors` | accounts-payable | 12 vendors | Every vendor in one system — cannabis and non-cannabis | Live |
| 4 | `case-study-consignment-conversion` | consignment | $27,350 | Freed trapped inventory with one vendor switch | Live |
| 5 | `case-study-expired-returns` | consignment | $8,370 | $8,370 in expired product returned at zero cost | Live |
| 6 | `case-study-vendor-credit-recovery` | credit-recovery | $2,340 | Recovered co-marketing credits nobody was tracking | Live |
| 7 | `case-study-return-credit` | credit-recovery | $1,847 | Return credit nobody filed — $1,847 recovered | Live |
| 8 | `case-study-expiration-credit` | credit-recovery | $3,180 | Expiration credits from a vendor agreement — $3,180 recovered | Live |
| 9 | `case-study-shelfiq-vendor-emails` | operations | 47 emails | AI handles vendor emails for dispensaries | Live |
| 10 | `case-study-ap-time-savings` | operations | 98% less time | From 15 hours a week to one approve button | Live |
| 11 | `case-study-delivery-dashboard` | operations | Zero spreadsheets | Dispensary delivery reconciliation — no more spreadsheets | Live |
| 12 | `case-study-vendor-portal` | operations | 90% fewer calls | Vendor portal ends payment status calls | Live |
| 13 | `case-study-quickbooks-sync` | operations | Real-time books | Cannabis AP to QuickBooks — real-time sync | Live |
| 14 | `case-study-settlement-dispute` | operations | Resolved in 24h | Settlement dispute resolved in 24 hours | Live |

## SEO Targets

| Case Study | Primary Keyword | Title Tag | Meta Description |
|---|---|---|---|
| Duplicate Invoice | `dispensary accounts payable errors` | How a $4,873 Duplicate Invoice Got Caught — ShelfSpace | A vendor billed the wrong location for an invoice already paid. ShelfSpace caught it the same day. Here's how dispensary AP errors silently drain cash. |
| Consignment | `cannabis consignment for dispensaries` | Cannabis Consignment Freed $27K in Inventory — Case Study | One dispensary freed $27K in tied-up inventory by switching a single vendor to consignment. Dead stock dropped to zero. Margins hit 50%. |
| Credit Recovery | `cannabis vendor credit recovery` | $2,340 in Vendor Credits Recovered — ShelfSpace Case Study | A dispensary was owed co-marketing credits and didn't know it. ShelfSpace calculated, got vendor approval, and applied the credit same cycle. |

## Case Study Details (for blog post content)

### Case Study 1: Duplicate Invoice Catch

**Category:** Accounts Payable
**Amount saved:** $4,873
**Speed:** Same-day catch

**What happened:** A multi-location retailer had a vendor showing ~$14K in open invoices. One invoice — $4,873 — was billed against Location A. We checked our system and realized: that invoice belongs to Location B, not Location A. Our records showed it was already paid from Location B's bank account weeks earlier. We looped in the controller, who confirmed payment had cleared. Without the catch, the retailer would have paid $4,873 twice.

**Features used:**
- Invoice verification (cross-referencing invoice numbers against the system)
- Multi-location entity tracking (knowing which invoices belong to which store/entity)
- Payment reconciliation (records showing the invoice was already paid)
- Vendor communication (handling the back-and-forth with the vendor's AP team and controller)

**Takeaway:** "This is what happens when vendors self-report what you owe. You need someone checking."

### Case Study 2: Consignment Conversion

**Category:** Consignment
**Amount freed:** $27,350
**Speed:** Results in 60 days

**What happened:** A single-location dispensary was buying all inventory wholesale — $310K+ sitting on shelves at any given time. Product expired before it sold. Margins fluctuated because they bore all the risk. We onboarded their top vendor onto consignment within 60 days. That vendor alone represented $27,350 in shelf inventory the dispensary no longer had to pay for upfront. Dead stock from that vendor dropped to near zero (the vendor owns it until it sells). Consignment pricing locked in a 50% margin floor, stabilizing gross margin on that vendor's products. Cash that was tied up in inventory went back to operations.

**Features used:**
- Vendor onboarding (transitioning from wholesale to consignment terms)
- Consignment settlements (weekly settlement cycle synced to POS sales)
- Margin protection (50% floor built into consignment agreement)
- Waste elimination (vendor owns unsold product — expiration is their risk)
- Metrc-synced inventory tracking (real-time visibility into what's on shelf vs. what's sold)

**Takeaway:** "They were paying $310K to stock shelves. Now the vendor owns the product until it sells. Same shelves. Zero risk."

### Case Study 3: Vendor Credit Recovery (Co-Marketing)

**Category:** Credit Recovery
**Amount recovered:** $2,340
**Speed:** Found in 14 days

**What happened:** A dispensary was running in-store promotions for a vendor's products — shelf placement, menu features, budtender recommendations. Standard industry practice: vendors reimburse a percentage of the promotional cost. Nobody was tracking it. We ran the numbers against keystone pricing and identified $2,340 in co-marketing credits owed by one vendor. We built the credit memo, sent it to the vendor for approval, the vendor signed off, and the credit was applied against an open invoice. We paid the net balance. Money the dispensary was owed but never asked for — recovered and applied in one cycle.

**Features used:**
- Co-marketing calculation (comparing actual sell-through against keystone pricing benchmarks)
- Credit memo generation (building the formal credit request with supporting data)
- Vendor approval workflow (sending the memo, tracking approval, handling pushback)
- Invoice offset (applying the approved credit against an open invoice)
- Payment processing (paying the net balance after credit offset)

**Takeaway:** "The vendor owed them $2,340 and would have happily never mentioned it. We asked. They paid."

## Design Notes

**Card styling (for homepage section):**
- Dollar amounts in Space Mono (matches the receipt section aesthetic)
- Category pills: AP = green, Consignment = blue, Credit Recovery = amber/gold
- Cards should feel like receipts or financial documents — clean, mono-spaced numbers, minimal decoration
- Filter pills at top: All | Accounts Payable | Consignment | Credit Recovery
- Grid on desktop (3 columns), horizontal scroll on mobile
- Each card has subtle hover lift effect

**Section header:** "What We Caught This Month" — positions ShelfSpace as active, always finding things. Not a static testimonial section.
