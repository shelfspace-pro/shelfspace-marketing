# Vendor-Friendly Reframe — Spec

**Status:** spec only. Not implemented.
**Audience:** retailers (primary buyer) + vendors (who increasingly land on these pages via Google, AI search, and retailer outreach).
**Goal:** reposition ShelfSpace from "tool weaponized against vendors" to "shared transparency layer that helps both sides." Without sacrificing retailer-conversion or SEO.

---

## 1. Strategic shift in one paragraph

The current site frames vendors as adversaries: "chase," "catch," "defend against," "discrepancies found." Vendors who land here see a tool used *on* them. The reframe is operationally small (verb swaps, system-blame instead of actor-blame, naming the mutual win) but strategically significant: it converts vendor objections into vendor advocacy, because the actual product *does* help vendors (faster pay, sell-through visibility, documented memos, ShelfiQ instant answers, fewer "where's my check" calls).

Three operating principles:

1. **Blame the system, not the actor.** "Records get lost between systems" beats "Vendors lose invoices."
2. **Name the mutual win.** Wherever a sentence describes a retailer benefit, add the vendor benefit if one exists.
3. **Use neutral verbs.** Reconcile / verify / match / surface / document — not catch / chase / fight / defend / extract / hold-accountable.

## 2. Model lines (already in copy — pattern from these)

These existing sentences nail the tone. Pattern every reframe against one of them:

- **`credit-recovery.html:256, 562`** — *"Vendors appreciate the structure — it's transparent and fair for both sides."*
- **`accounts-payable.html:573`** — *"Your vendors get instant answers. Your team gets zero AP emails. First of its kind in cannabis."* (vendor-win + retailer-win + differentiator, in three short sentences)
- **`about.html` mission** — *"Replace the broken 'Net 30' standard with a system that actually works for everyone."*
- **`how-it-works.html`** Transparency section — *"Both sides see the same data. Different perspective. Retailers and vendors see the same settlement data from their own portal. No black box. No disputes over what sold."*
- **`blog/how-cannabis-consignment-works.html:283`** — *"Operators get wrong about consignment: they think vendors won't go for it. In reality, most vendors — especially the ones who believe in their product — prefer consignment because it gets them into more doors."*
- **`blog/cannabis-accounts-payable-cost.html:283`** — vendor-empathy paragraph about disorganized AP from the vendor's perspective. Worth re-reading before any rewrite.

## 3. Voice constraints (binding)

The reframe must hold against `landing-page-playbook.md` rules:

- **Loss aversion is a stated conversion principle.** Don't trade loss-framing for gain-framing.
- **"If a sentence doesn't make someone FEEL something, cut it."** No clinical replacements that read as a press release.
- **"Short > long. Specific > clever."** A reframe is a verb swap, not a sentence expansion.
- **Meta descriptions: ≤160 characters.** SERPs truncate.
- **One H1 per page, primary keyword in H1.** H1 swaps must keep the keyword stem.

A reframe that loses emotional punch *and* loses keyword weight is a bad trade. Soften the verb, keep the noun and the punch.

## 4. Approved-terms glossary (grep-able)

Use this for sitewide search-and-replace passes. Always review in context — these are defaults, not blanket rules.

| Replace | With | Notes |
|---|---|---|
| chase vendors / chasing vendors | coordinate with vendors / handle vendor paperwork | Keep "chase" only when the *vendor* is the one chasing payment from retailer (true today on Net 60). |
| caught it / nobody caught it | flagged it / nobody had time to reconcile | "Caught" implies vendor was hiding something. |
| Discrepancies (as a section title) | Mismatches | Keep "discrepancy" mid-sentence where natural. |
| Find / Found (paired with vendor problem) | Surface / Surfaced / Reconcile / Reconciled | "Find" implies hidden. |
| hidden / what's hiding (re: credits) | untracked / unreconciled | |
| should have shared (re: vendor obligation) | committed in the agreement | |
| defended (re: settlement) | confirmed with shared data | |
| vendor demands | vendor questions / vendor inquiries | |
| recover from vendors | reconcile with vendors / get credits your agreement promised | Keep "credit recovery" as the service name. |
| **(do not change)** "Credit Recovery", "Vendor Portal", "Vendor Management" | — | Service/feature taxonomy. SEO load-bearing. |

## 5. SEO guardrails — never change

| Element | Why |
|---|---|
| URL slugs (all of them) | Redirect cost; current SEO equity |
| H1 keyword stems: "Cannabis Vendor Credit Recovery", "Accounts Payable", "Consignment" | Primary keyword targeting |
| `canonical`, `og:type`, schema.org `@type` and `name` fields | Structural |
| Service/feature taxonomy (above) | |
| Specific dollar amounts and case study numbers | Proof, load-bearing |
| FAQ *questions* (in `<summary>` and JSON-LD `name`) | SERP rich-result indexing — only change *answers* |
| `terms.html`, `privacy.html` | Legal docs (per CLAUDE.md) |
| Tagline `Every Vendor. Every Payment. One Engine.` | Already does the work |

## 6. Off-limits — don't reintroduce

- "automate / automated / automatically / automation" (CLAUDE.md)
- "scan-based trading" / "SBT" (CLAUDE.md)
- "Diem Cannabis" (CLAUDE.md)
- "60-day pilot" or pilot/trial language (memory: free eval → paid on results)
- `<br>` in headings (CLAUDE.md)
- New product claims not verified against `marketing/platform-map.md` (memory: verify-product-claims)

---

## 7. Tier 1 — Service & Home pages

### `index.html` — homepage

| # | Location | Current | Proposed | Notes |
|---|---|---|---|---|
| 1.1 | `:7,12,19` meta/og/twitter description | `We found $500,000 at a two-store dispensary chain. Trapped inventory, overpaid invoices, untracked credits. One team found it all. Free analysis.` | `We found $500,000 at a two-store dispensary chain. Mismatched invoices, untracked credits, trapped inventory — surfaced for retailers and vendors.` (146c) | ≤160 ✓. Keeps $500K proof point at front. |
| 1.2 | `:299` JSON-LD Organization description | mirror of 1.1 | mirror of 1.1 | |
| 1.3 | `:425` hero demo Slide 2 title | `Discrepancies Found` | `Mismatches Surfaced` | Red kept — color signals dollar at risk, not vendor blame |
| 1.4 | `:444` hero demo caption | `Connect → Find → Recover` | `Connect → Reconcile → Recover` | |
| 1.5 | `:467–469` Chapter 2 subtitle + body | subtitle: `lost to overpaid invoices and manual AP.` body: `Vendors sent invoices. Staff paid them without checking. Deliveries came short but nobody noticed. One person spent 15 hours a week matching invoices, writing checks, and fielding vendor calls.` | subtitle: `lost to invoice/delivery mismatches nobody had time to reconcile.` body: `Invoices arrived from forty vendors a month. Receiving counts lived on a clipboard. Short deliveries quietly cleared. One person spent 15 hours a week matching invoices, writing checks, and fielding vendor calls.` | Same word count. Drops "Staff paid them without checking" (reads as retailer-blame to vendors AND retailers). |
| 1.6 | `:470` Chapter 2 resolution | `Vendors email us, not them.` | `Vendors email us, not them — and ShelfiQ answers most of them in seconds with live Metrc data, so vendors get faster answers too.` | Adds vendor-win. |
| 1.7 | `:479` Chapter 3 body | `Discounts the retailers absorbed that vendors should have shared.` | `Co-marketing dollars and shared promo costs committed in vendor agreements but never invoiced back.` | Removes "should have shared" accusation; keeps SEO terms. |
| 1.8 | `:480` Chapter 3 resolution | `…created credit memos for every qualifying event, and worked with vendors to get them approved.` | `…built documented credit memos against the agreement terms both sides already signed, sent them with line-item Metrc backup, and got cleaner approvals because the math was auditable.` | Vendors approve faster *because* the doc is clean. Verifies against platform-map (`credit_memo_documents` table exists). No SLA claim. |
| 1.9 | `:631` Case card #6 headline | `Settlement dispute resolved in 24 hours with data` | `Settlement question answered in 24 hours with shared data` | "Dispute" implies adversaries. |
| 1.10 | `:761–762` Case card #18 (CEO email) | `We took over vendor emails — the owner never answered another one.` / `He hasn't answered one since.` | `We took over vendor emails — vendors get instant answers, the owner gets his inbox back.` / `Vendors now get answers in seconds; he hasn't had to triage a vendor email since.` | Today the vendor reads as an interruption. |
| 1.11 | `:583` case summary | `…killed it the same day.` | `…stopped it the same day.` | Glossary: "killed" is gotcha-coded. |
| 1.12 | `:585, :595` case-speed labels | `Same-day catch` (×2) | `Same-day fix` (×2) | Glossary: "catch" is gotcha-coded. |
| 1.13 | `:592` Case card headline | `Caught a shorted delivery before payment went out` | `Flagged a shorted delivery before payment went out` | Glossary. |
| 1.14 | `:703` case summary | `…caught 3 shortages in 14 days.` | `…flagged 3 shortages in 14 days.` | Glossary. |
| 1.15 | `:742` Case card headline | `We caught 12 wrong invoices in one month using Metrc` | `We flagged 12 invoice mismatches in one month using Metrc` | Glossary: "caught" + softens "wrong" to "mismatches". |

**No-change (audited and intentionally unchanged):** hero H1 `:387` (already system-framed), Chapter 1 (consignment story is bilateral), pivot section copy `:487–488`, calculator subtag `:552`, Metrc integration callout, all Apollo/GA scripts, all SVG iconography.

### `credit-recovery.html` — highest vendor-blame density on site

| # | Location | Current | Proposed | Notes |
|---|---|---|---|---|
| 2.1 | `:7,12,19` meta description | `Your dispensary is losing $200,000+ a year in vendor credits nobody's tracking. We recover it — no risk, no fee if we don't deliver. Free evaluation.` (159c) | `$200,000+ a year in vendor credits go untracked. We document and reconcile them with your vendors. No fee unless we deliver. Free evaluation.` (146c) | ≤160 ✓. Keeps "vendor credits", "$200,000", "evaluation". |
| 2.2 | `:292` JSON-LD Service description | mirror of 2.1 | mirror of 2.1 | |
| 2.3 | `:339` hero demo Slide 1 sub-line | `Returns filed. Expirations ignored. Credits unclaimed.` | `Returns un-memo'd. Expirations untracked. Credits unclaimed.` | "Ignored" reads as vendor refusal. Same parallel structure. |
| 2.4 | `:353` hero demo Slide 3 sub-line | `Deducted from next payment. One cycle.` | `Applied to the next settlement. Vendor sees the math. One cycle.` | "Deducted" is unilateral. |
| 2.5 | `:357` hero demo caption | `Unclaimed → Found → Recovered` | `Unclaimed → Documented → Recovered` | |
| 2.6 | `:371` pain pivot pill | `Discounts vendors should have shared` | `Shared promo costs not split per agreement` | |
| 2.7 | `:373` pain pivot tagline (**HIGH conversion risk — A/B test**) | `We recover your vendor credits. You keep the money.` (9 words, loss-frame) | `We get the credits your agreements already promised. You keep the money.` (12 words, loss-frame preserved) | **Keeps "you keep the money" punch.** Drops "recover from vendors" implication; replaces with "agreement already promised" (contractual, not extractive). Run as A/B vs. control if possible. |
| 2.8 | `:380` calculator H2 | `How much are you losing in vendor credits?` | `How much in vendor credits is going un-reconciled at your stores?` | Keeps loss frame ("losing"→"un-reconciled" still implies missing money). |
| 2.9 | `:505` proof timeline Day 14 | `…cross-reference every delivery, return, and waste event in Metrc against what your vendors invoiced.` | `…cross-reference every delivery, return, and waste event in Metrc against existing invoices and vendor agreements — the same data we share with vendors during approval.` | Establishes shared-data principle. |
| 2.10 | `:513` proof timeline Day 60 | `$200K+ identified. Money that was always yours — now it's back.` | `$200K+ documented and approved. Money your agreements already promised — now in your account.` | "Always yours" implies someone took it. "In your account" preserves the emotional landing of "back". |
| 2.11 | `:280, 574` FAQ #4 answer (collection-agency Q) | `…Vendors actually prefer the structure because it's transparent and fair.` | append: `It also makes approval easier on the vendor side — credit memos arrive with line-item Metrc backup, so there's documentation to confirm instead of invoicing back-and-forth.` | Most-likely landing point for skeptical vendor. JSON-LD mirror at `:280`. No SLA claim. |

**No-change:** H1 `:324` (system-framed already), title tag `:6` (primary keyword), FAQ #1 `:256, 562` (model line), sample-eval section.

### `accounts-payable.html`

| # | Location | Current | Proposed | Notes |
|---|---|---|---|---|
| 3.1 | `:7,12,19` meta | `You're overpaying vendors every week. ShelfSpace verifies every invoice against what was actually received. $45K+/year saved. Free evaluation.` (143c) | `Invoice/delivery mismatches cost dispensaries $45K+/year. We verify every invoice against Metrc — so vendors get paid the right amount, fast.` (146c) | ≤160 ✓. Vendor-win in the meta. |
| 3.2 | `:316` JSON-LD Service description | mirror of 3.1 | mirror of 3.1 | |
| 3.3 | `:396` hero H1 (**HIGH conversion risk — A/B test**) | `You're paying vendors for product that never showed up.` (9 words, accusatory of vendor) | `You paid for product that never showed up.` (8 words, second-person punch preserved, "vendors" dropped from H1) | Loses "vendors" keyword from H1 — small SEO cost. Removes the line that, quoted to a vendor, kills deals. **A/B test against original.** |
| 3.4 | `:411` hero demo Slide 1 sub-line | `Vendor says you owe this.` | `Invoice received from vendor.` | "Vendor says…" is implicitly suspicious. |
| 3.5 | `:451` Pain card #1 loss line | `You overpaid by 2 units. Nobody caught it.` | `You paid for 2 units the delivery never included. The mismatch never got reconciled.` | Same length-ish, system-blame. |
| 3.6 | `:467` Pain card #2 loss line | `$400 overpaid. Vendor emailed 6 times — easier to just pay.` | `$400 paid in error. Six emails of back-and-forth — paying was easier than reconciling.` | Reframes the back-and-forth as the enemy. |
| 3.7 | `:471` pain pivot sub | `…without a single vendor call landing on your desk.` | `…and vendors get instant answers from ShelfiQ instead of waiting on you.` | Vendor-win. |
| 3.8 | `:537` ShelfiQ section H2 | `Never answer another AP email.` | `Vendors get instant answers. Your team gets zero AP emails.` | Promotes the existing body line `:573` to H2. **The body line `:573` is already the model line — don't change it.** |

**No-change:** title tag, hero demo Slides 2 and 3 (factual), FAQ schema (already balanced).

### `consignment.html`

| # | Location | Current | Proposed | Notes |
|---|---|---|---|---|
| 4.1 | `:7,12,19` meta | `Stop paying for inventory upfront. ShelfSpace runs consignment for cannabis dispensaries — vendors own the product until it sells. $250K freed. We handle everything.` (165c — over budget) | `Vendors own the product until it sells. Retailers free $250K of trapped cash; vendors get weekly settlements with sell-through data. We run it end-to-end.` (158c) | ≤160 ✓. Mutual-win in meta. |
| 4.2 | `:294` JSON-LD Service description | mirror of 4.1 | mirror of 4.1 | |
| 4.3 | `:380` pain pivot | `Unless you switch to consignment — and your vendors own it instead of you.` | `Unless you switch to consignment — vendors own the product, take the expiration risk, and get paid weekly on actual sales.` | Names the vendor benefit (weekly cash, sell-through) — directly defuses the "will my vendors agree" objection. |
| 4.4 | `:248, 508` FAQ #1 ("Will my vendors agree?") | `Most do. They get guaranteed weekly payments instead of chasing you for months. We handle every conversation.` | `Most do — and most are eager once they see the structure. They get guaranteed weekly settlements with sell-through data on every SKU, instead of chasing payment for months on Net 60. We handle every conversation, contract, and weekly payment cycle.` | Triple down on vendor benefits. JSON-LD mirror required. |
| 4.5 | `:266, 516` FAQ #3 ("What if product doesn't sell?") | `You haven't paid for it. It goes back to the vendor. That's the entire point.` | **No change at this time.** Vendor-friendly "documented return through Metrc" framing was considered but pulled — feature surface unverified per §12. Original line is already neutral and accurate. Revisit after platform verification. |

**No-change:** H1, title tag, calculator section.

---

## 8. Tier 2 — Supporting pages

### `about.html`

No changes. The mission statement and founder bio already nail the both-sides framing. Use `about.html` as the brand voice anchor for everything else.

### `how-it-works.html`

| # | Location | Current | Proposed |
|---|---|---|---|
| 5.1 | Credit Recovery section: `Vendor approval, then applied to settlements.` | `Vendor reviews the documented memo, approves, and the credit applies to the next settlement.` | Verified against platform-map (`Pending_Vendor_Response → Applied` is real). Drop "typically within days" — that's a perf claim, not in the platform-map. |

The `Transparency` section is a model section. Recommend linking to it from the homepage Pivot Section via anchor (`#transparency`) instead of duplicating copy.

### `shelfiq.html`

| # | Location | Current | Proposed |
|---|---|---|---|
| 6.1 | After current closing copy | (none) | Add: `Vendors love ShelfiQ too — they get sub-30-second answers about payment status, balances, and settlements, instead of waiting days for a human reply.` |

### `pricing.html`

| # | Location | Current | Proposed |
|---|---|---|---|
| 7.1 | `:292, 421, 516` (3 instances of same phrase) | `we're inside more of your vendor data, so we catch more` | `we're inside more of your vendor data, so we surface more` | "Catch" is gotcha-coded. JSON-LD mirror at `:292`. |

### `features.html`

| # | Location | Current | Proposed |
|---|---|---|---|
| 8.1 | `:319` H1 | `Every feature your cannabis dispensary needs to manage vendors.` | `Every feature your cannabis dispensary needs to manage vendor finances.` | "Manage vendors" treats vendors as the object; "manage vendor finances" treats the workflow as the object. Keeps SEO. |
| 8.2 | `:472` body | `Invoice parsing, payment questions, credit memo disputes — handled before your team sees them.` | `Invoice parsing, payment questions, credit memo questions — answered before your team sees them.` | "Disputes" → "questions"; "handled" → "answered" (vendor sees a reply). |

### `checks.html`

No changes. Tone is technical/educational, not adversarial. Vendor portal is already framed positively.

### `llms.txt`

No changes to body. Note: `:95` references `blog/dispensaries-overpay-vendors` URL. If that blog title is reframed (Tier 3), llms.txt link still works (URL slug unchanged).

---

## 9. Tier 3 — Blog posts (corrected from direct re-audit)

The original Explore-agent audit missed the worst offenders. Direct re-read of all 43 blog posts via grep + manual confirmation produced this corrected list:

| File | Location | Current | Proposed |
|---|---|---|---|
| `blog/dispensaries-overpay-vendors.html` | title, H1, meta | `Why Dispensaries Overpay Vendors` (title); slug = `/blog/dispensaries-overpay-vendors` | **Title only:** `Why Cannabis Dispensaries Overpay on Vendor Invoices`. **Do not rename slug** (SEO redirect cost). The body of this post is actually fine — it blames retailer process, not vendors. The title is the only vendor-facing line. |
| `blog/dispensary-vendor-costs.html` | `:267` | `Vendors overcharge. Quantities don't match. Pricing tiers get applied wrong.` | `Quantities don't match. Pricing tiers get applied wrong. Errors slip through both ways.` | Drops the direct vendor accusation; keeps the operational point. |
| `blog/case-study-expired-returns.html` | `:277` | `The dispensary didn't chase vendors or negotiate credits. We took care of it.` | `The dispensary didn't have to handle the paperwork or coordinate the return — we ran the documented return-and-credit process with the vendor.` |
| `blog/case-study-expiration-credit.html` | `:259` | "feels like a confrontation" paragraph | `Many retailers don't file these credits because the documentation is tedious — even when the credits are clearly owed under the agreement. ShelfSpace builds the memo with line-item Metrc backup so the conversation with the vendor is about confirming numbers, not negotiating them.` |
| `blog/case-study-vendor-credit-recovery.html` | `:266` | same "confrontation" framing | parallel rewrite to row above |
| `blog/case-study-settlement-dispute.html` | `:351` | `$6,230 settlement defended. Dispute resolved in 24 hours.` | `$6,230 settlement confirmed. Question resolved in 24 hours with shared data.` |
| `blog/case-study-ceo-email-relief.html` | `:282` | `vendor demands` | `vendor questions` |
| `blog/cannabis-accounts-payable-cost.html` | `:279` | `that's real margin that went straight to your vendors instead of staying in your business.` | `that's real margin that quietly stayed unpaid against your agreements.` |
| `blog/cannabis-consignment-erp-vs-managed-service.html` | `:287, 301` | repeated `vendors owe you` | Vary: `your vendor agreement entitles you to credits for…` (×1) and `under your vendor agreement, credits are due for…` (×1) |
| `blog/cannabis-consignment-spreadsheets-cost.html` | `:306` | `It just sits there, calculating what you owe the vendor — never what the vendor owes you.` | `It tracks one direction — what you owe — and not the other side of the ledger your agreement entitles you to.` |

**False positives confirmed (no change needed):**
- `blog/shelfspace-vs-orderco-cannabis-ap.html` — grep registered 11 hits, but on direct read all are neutral phrases ("vendor of record", "vendor lifecycle", "managing the financial relationship between you and your vendors"). Skip.
- `blog/how-cannabis-consignment-works.html:283` — debunks the "vendors won't go for it" objection. Keep as-is — it's a model paragraph for the spec.

**Skip Tier 3 entirely on first PR.** Tier 1 + Tier 2 are higher leverage. Re-audit Tier 3 after Tier 1 ships and the model lines are set.

---

## 10. Tier 4 — `/vendors` page (new content, separate PR)

The single highest-leverage move in this entire reframe is a page addressed *to vendors*. Even if no vendor lands on it directly via Google, retailers will link it during vendor outreach ("hey, here's the platform we're moving to — here's what you get"). It also gives the rest of the site cover to be retailer-focused without doing diplomatic work in every paragraph.

**URL:** `/vendors` (or `/for-vendors`)
**Primary keyword:** `cannabis vendor portal` (high-intent vendor search) or `cannabis vendor payments`
**Page outline:**

1. **Hero** — Headline addressed to vendors. e.g., `Get paid weekly. See what's selling. Stop chasing dispensaries for checks.` H1 keeps SEO keyword (`cannabis vendor`).
2. **What you get** — five-card grid:
   - Weekly settlements (vs Net 60 wholesale)
   - Sell-through data per SKU per retailer
   - Documented credit memos with line-item Metrc backup (no surprise chargebacks)
   - Vendor portal — payment status, balances, history, downloadable Check 21 checks
   - ShelfiQ — sub-30-second answers about payment status without waiting on a human
3. **How it works for you** — three-step timeline:
   - Retailer onboards you (no paperwork on your end beyond an email + W-9)
   - Sales happen, ShelfSpace pulls Metrc + POS, calculates settlement
   - Check arrives weekly with full sell-through breakdown
4. **What changes vs wholesale or DIY consignment** — comparison table
5. **FAQ** — 5 questions max, vendor fears first:
   - "What if the retailer doesn't pay?" (ShelfSpace pays — retailer pays us)
   - "Do I have to sign anything new?" (one MSA, takes minutes)
   - "How do I dispute a credit memo?" (vendor portal flow + ShelfiQ)
   - "Can I see what's selling at every retailer?" (yes, per-SKU)
   - "What about returns and expirations?" (documented through Metrc, you decide what to do)
6. **CTA** — `Talk to ShelfSpace` (not `Get My Free Evaluation` — that's retailer-coded). Lands on `/contact` with a vendor-side form variant or pre-filled subject.

**Cross-page links to add:**
- Homepage Pivot Section: `…One transparency layer for retailers and vendors.` link "vendors" to `/vendors`
- Consignment FAQ #1 answer: link "weekly settlements with sell-through data" to `/vendors`
- AP page ShelfiQ section: link "vendors get instant answers" to `/vendors`

**Verification before shipping `/vendors`:**
- Confirm vendor portal MSA flow against platform-map
- Confirm sell-through data is per-SKU per-retailer (vs aggregated)
- Confirm dispute workflow exposes a vendor-initiated path (per platform-map: `disputes` table exists, but UI surface unverified)

---

## 11. JSON-LD mirror checklist

Every FAQ-answer change must update the matching JSON-LD `acceptedAnswer.text`. Mirror locations:

| Page | JSON-LD location | On-page twin location |
|---|---|---|
| `index.html` | `:316–347` (FAQPage) | `:834–846` |
| `index.html` | `:292–315` (Organization) | meta description `:7,12,19` |
| `credit-recovery.html` | `:246–285` (FAQPage) | `:559–576` |
| `credit-recovery.html` | `:286–296` (Service) | meta description `:7,12,19` |
| `accounts-payable.html` | `:316–355` (FAQPage + Service) | meta + FAQ section |
| `consignment.html` | `:246–296` (FAQPage + Service) | meta + FAQ section |
| `pricing.html` | `:268–292` (FAQPage) | FAQ section `:504–516` |

For every Tier 1/2 edit involving an FAQ answer or a Service description, edit BOTH locations in the same commit.

---

## 12. Verification hooks (before publishing)

These claims need cross-check against `marketing/platform-map.md` or the platform repo before the proposed copy ships:

1. **#1.8 — "got approvals in days instead of months."** Performance claim. Either pull a real median from settlement engine telemetry or soften to "got approvals quickly." Platform-map confirms the workflow (`Pending_Vendor_Response → Applied`) but not the SLA.
2. **#4.5 — "documented return through Metrc."** Platform-map shows returns are tracked and credit memos have document attachments, but a vendor-facing return manifest is not explicitly named. If unverifiable, drop the clause.
3. **Tier 4 — vendor sell-through data per-SKU per-retailer.** Confirm UI surface; platform-map mentions settlement reports, not per-vendor portal sell-through.
4. **Tier 4 — vendor-initiated dispute UI.** `disputes` table exists; UI may not be vendor-facing.

Do not ship copy that asserts a feature unless it ships in the platform.

---

## 13. Rollout plan

**PR 1 — Tier 1 (high-traffic pages).** Homepage + credit-recovery + AP + consignment. ~3–4 hours of edits. Bundle JSON-LD mirror updates.

Site has no A/B tooling (static HTML on Vercel + GA4 + Apollo), so ship as straight swaps and monitor. The two highest-conversion-risk swaps to watch closely:
- 2.7 (credit-recovery pivot tagline)
- 3.3 (AP H1)

Watch GA4 for conversion-event drop on `/credit-recovery` and `/accounts-payable` over 2 weeks post-ship. If conversion drops >5% on either page, revert that specific item via single-line Edit.

**PR 2 — Tier 2 (supporting pages).** about / how-it-works / shelfiq / pricing / features. ~1 hour.

**PR 3 — Tier 3 (blog).** Selective fixes from §9 table only. ~1 hour. Defer until PR 1 has run for 2 weeks.

**PR 4 — Tier 4 (`/vendors` page).** Separate, scoped, requires verification hooks completed. ~1 day of new content + design.

**Success metrics:**
- Retailer close rate on "will my vendors agree" objection (qualitative — track in CRM or sales notes)
- Vendor approval time on credit memos (platform telemetry, post-Tier 1)
- Vendor portal NPS (after Tier 4)
- Three-vendor read-through interview before/after Tier 1 ships (qualitative)

---

## 14. Glossary of decisions deferred

- **Should the credit-recovery `<title>` "Cannabis Vendor Credit Recovery — ShelfSpace" be changed?** The phrase "Vendor Credit Recovery" is the highest-volume search term for this page but reads to a vendor as "credits extracted *from* vendors." The page is on this spec's hot list but the title is *not* changed. If post-Tier 1 vendor feedback flags it, test alternatives like "Cannabis Credit Memo Recovery" or "Cannabis Vendor Credit Reconciliation". Currently: hold.
- **Sitewide replace of "discrepancy"?** Glossary says replace as section title; mid-sentence usage is fine. Implementer judgment per instance.
- **Add `/vendors` to nav?** Probably yes once the page exists. Defer to PR 4.
