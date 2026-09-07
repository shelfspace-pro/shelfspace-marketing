# Managed-Services Blog Series — Keyword Research + Build List

**Goal:** rank (Google + LLM answer engines) for cannabis operators searching for help with
their back-office money work — AR, AP, vendor credit recovery, collections, outsourced finance
team, outsourced back office. Positioning per the 2026-09-04 overhaul: sell the OUTCOME, be
delivery-model-agnostic (software you drive OR done-for-you managed service), no public pricing,
consult-first CTA → `/contact`.

## Keyword research (Sept 2026)

### What the market actually searches — and who already owns it
Real competitors ranking today (from live SERPs):

| Cluster | Head terms operators type | Who ranks now |
|---|---|---|
| Outsourced back office | "cannabis back office outsourcing", "outsourced bookkeeping cannabis dispensary", "cannabis back office services" | Headquarters (tryheadquarters.com), ORBA Cloud CFO, Sansar, Dark Horse |
| AR / collections | "cannabis accounts receivable management", "cannabis AR collections", "reduce accounts receivable cannabis", "cannabis debt collection agency", "collect unpaid cannabis invoices" | CannaBIZ Collects, Canna Collects, Cannabiz Credit Association, Distru (blog) |
| Accounts payable | "outsourced accounts payable cannabis", "cannabis AP management", "pay cannabis vendors" | (thin — mostly payroll/AP-automation SaaS; real gap) |
| Outsourced finance / CFO | "cannabis CFO outsourcing", "outsourced finance team cannabis", "fractional cannabis CFO", "cannabis finance department" | GreenGrowth CPAs, ORBA, Northstar, Dope CFO, 7Leaf |
| 280E / bookkeeping | "cannabis 280E bookkeeping", "cannabis month-end close", "COGS reconciliation cannabis" | Maxim Liberty, Dark Horse, Citrin Cooperman |

### The wedge (how ShelfSpace is different from all of them)
- The CPA/CFO firms **record** the money after the fact (books, 280E, tax). ShelfSpace **moves**
  the money in real time — pays vendors (Check 21), collects overdue AR, recovers vendor credits,
  runs consignment settlements — and hands the CPA clean books. We are the *operational money
  layer*, not the tax return.
- The collection agencies take a **25–50% contingency cut** of what they recover and can burn the
  vendor relationship. ShelfSpace collection keeps the operator whole (no contingency skim) and
  keeps the relationship intact.
- Headquarters (the closest positioning match) staffs a human pod. ShelfSpace delivers the same
  outcome with software + ShelfiQ as the affordability lever, delivered as software OR done-for-you.
- Cannabis-specific end-to-end (Metrc, consignment, Check 21) — generic AP/AR SaaS is not.

## Build list (12 posts) — priority order

Category values (blog.html): `AP`, `Case Study`, `Consignment`, `Credit Recovery`, `Vendor Management`.
AR / collections / back-office / finance posts all card under **Vendor Management** (the catch-all;
`blog-section-rest`, `data-rank="99"`). Vendor-payment / AP posts card under **AP**.

| # | Slug | Category | Primary keyword | Angle | Status |
|---|---|---|---|---|---|
| 1 | `outsourced-cannabis-back-office` | Vendor Management | cannabis back office outsourcing | PILLAR — AP+AR+credits+collections, handled | ☐ |
| 2 | `cannabis-accounts-receivable-management` | Vendor Management | cannabis accounts receivable management | PILLAR — the AR playbook + how it's run for you | ☐ |
| 3 | `outsource-cannabis-accounts-payable` | AP | outsourced accounts payable cannabis | PILLAR — your vendors paid, on time, no clerk | ☐ |
| 4 | `cannabis-collections-outsourcing` | Vendor Management | cannabis collections outsourcing | Done-for-you collections, keep 100% (no 30% cut) | ☐ |
| 5 | `outsourced-finance-team-cannabis` | Vendor Management | outsourced finance team cannabis | The finance dept that moves money, not just books | ☐ |
| 6 | `cannabis-net-terms-collect-invoices` | Vendor Management | cannabis net 30 terms | Net-30 → net-90 pain; getting paid | ☐ |
| 7 | `cannabis-bookkeeper-vs-back-office` | Vendor Management | cannabis bookkeeper vs back office | Bookkeeper records; we move the money | ☐ |
| 8 | `hire-vs-outsource-cannabis-finance` | Vendor Management | cost of cannabis bookkeeper / AR clerk | Build vs buy — the headcount math | ☐ |
| 9 | `shelfspace-vs-headquarters-cannabis` | Vendor Management | cannabis back office service comparison | vs Headquarters — software+AI vs human pod | ☐ |
| 10 | `cannabis-cash-flow-ap-ar-gap` | Vendor Management | cannabis cash flow management | The pay-vendors-before-you-collect gap | ☐ |
| 11 | `cannabis-back-office-month-end-checklist` | Vendor Management | cannabis month end close checklist | GEO listicle — the monthly back-office checklist | ☐ |
| 12 | `dispensary-owner-buried-in-back-office` | Vendor Management | dispensary owner too busy back office | Top-of-funnel mirror/pain piece | ☐ |

## Per-post build recipe (every post)
Follow `.claude/skills/blog-post/SKILL.md`. Boilerplate (`<style>`, nav, footer, scripts) copied
verbatim from `/blog/outsourced-cannabis-back-office.html` (post #1, the gold standard). Unique per
post: head meta + 3 JSON-LD blocks (Article + BreadcrumbList + FAQPage), hero, At-a-glance card,
~1,600–2,400-word body with the 5-beat arc, 2–4 visuals from the kit (`stat-trio`, `vs-split`,
`meter`, `flow-steps`, `blog-callout`, `compare-table`), FAQ (3–5 Qs, mirrored in FAQPage schema),
consult CTA → `/contact`. Every number in a visual must appear verbatim in the body copy — no
fabricated figures. Forbidden tokens: `automate/automated/automatically` (in heroes), `scan-based
trading`, `SBT`, `Diem` (except Chris's bio), `pilot/trial/60-day`, public pricing/tiers/subscription,
`<br>` in headings, questions as headlines, "learn more" CTAs.

Infra per post (done by orchestrator, sequentially): blog.html card, llms.txt line, sitemap.xml
`<url>`, 1–3 cross-links from related posts, then `marketing/scripts/check-blog-sync.sh` +
`npm run check:forbidden`.
