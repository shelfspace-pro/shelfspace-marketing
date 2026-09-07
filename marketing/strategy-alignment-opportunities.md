# Website Strategy-Alignment Opportunities — REVIEW (decisions locked 2026-09-07)

**Status:** finalized review/plan, NOT yet executed. Nothing on the site has been changed. Line numbers were captured in an audit pass — re-verify before editing.

**Source of truth:** `shelfspace-platform:docs/roadmap/00-strategy.md` (2026-09-07). ShelfSpace = an AI-driven **managed-services money rail** for cannabis retailer↔vendor money (AP, AR, payments, credit recovery, settlements). **Done-for-you** is the lead; self-serve stays an available option (D1). GTM = displace the ~$4k/mo manual AP/bookkeeping firm. Endgame (rail → finance the flow) stays **internal / silent on the site** (D2).

**Governing constraints when executed** (`CLAUDE.md` + `landing-page-playbook.md`): no "automate" in heroes; no "scan-based trading"/"SBT"; "Diem" only in Chris's bio; no `<br>` in headings; no questions as headlines; no "learn more" CTAs; verb split (we / the platform / you); `check-docs-forbidden.sh` + `check:forbidden` stay green.

---

## Decisions — LOCKED (Chris, 2026-09-07)

- **D1 — Self-serve as a DELIVERY MODE only; NO self-serve signup.** Done-for-you is the lead everywhere. Self-serve survives ONLY as a delivery option arranged in the consult ("if you'd rather drive it yourself, we set that up") — there is **NO public self-serve signup flow, and nothing on the site is reachable to one.** "Software you drive" may appear as a demoted secondary mention in copy, never a hero lead, never a link/CTA target.
- **D2 — Financing/rail endgame: SILENT.** No rail/financing/factoring language on the public site for now. (Theme F below is DROPPED.)
- **D3 — Every path → `https://shelfspace.pro/contact`. Signup is NOT reachable.** Every CTA/button/link routes to `/contact`. Remove every inbound link to `signup.html`; `signup.html` itself redirects to `/contact` (no public account-creation entry). Rename every **"Book a demo" → "Book a Free Consult"** (→ `/contact`).
- **D4 — Pricing lives ONLY on `https://shelfspace.pro/pricing`.** Every pricing reference anywhere else is removed or converted to a link to `/pricing`. **No mention of pricing on any other page** — no "custom pricing," no cost FAQs, no "no cut / keep 100%," no tier/plan/fee language outside `/pricing`.
  - **Resolved (kept):** the free **"see what you're owed" diagnostic on-ramp** stays — it's the funnel entry (a $0 look that routes to `/contact`), not a price/tier. It is NOT treated as a pricing mention.
- **D5 — NEEDS YOUR RULING: is AR / collections commission-priced, or only credit recovery?** The blog comb found that two posts (`cannabis-debt-collection-agency-alternative`, `cannabis-collections-outsourcing`) are built on **"keep 100% — not a 30% agency cut"** as the core *competitive* angle vs debt-collection agencies. Your commission model is named for **credit recovery** (clawing back vendor credits). If **collections (chasing a buyer's overdue AR) stays no-cut**, "keep 100% vs the agency's 30%" is still TRUE — it just moves off-page per D4 (pricing → /pricing) and the competitive angle survives. If **collections is ALSO commission-priced**, that angle is false and those two posts need a real rebuild, not just a copy move. Everything else assumes credit-recovery = commission, collections = TBD by you.

---

## P0 — Remove the pricing promise that contradicts the model (Theme A)
Doubly required now: it foreclosed the commission model AND it's a pricing mention outside `/pricing` (D4). Remove — do not relocate to `/pricing` (the "no cut" claim is simply wrong; on `/pricing`, pricing is "custom, scoped in the consult").

| File | ~Line | Current copy → action |
|---|---|---|
| `index.html` (DFY closer) | ~1356 | "No percentage, no cut — ever." → remove |
| `credit-recovery.html` | ~479, ~509, ~1024, ~1040, ~1063, ~1092, Service-JSON-LD ~442 | "You keep 100%" / "we never take a cut" (7 spots) → remove |
| `collections.html` | ~404 | "We run the collecting. You keep 100%." → "We run the collecting." |
| `accounts-receivable.html` | ~404, ~856 | "You keep 100%." → drop the keep-100% clause |
| `features.html` | ~388 | "You keep every dollar we recover." → remove |

Where "no custody" was the real point, keep a custody-true line ("the money lands straight in your account") — that's not a pricing claim.

---

## P1 — Positioning & routing

### Theme B — DEMOTE the self-serve lane (don't delete) — D1
Managed-services/done-for-you becomes the LEAD in every hero, subhead, FAQ answer, and JSON-LD; the self-serve option may survive as a secondary mention, never the lead, never a CTA target. Instances of "software you drive, or done for you" (grep the string sitewide — not exhaustive):
- `pricing.html` ~299/~317/~334/~540–555/~574 · `how-it-works.html` ~468/~598/~632/~643/~532/~557 · `index.html` JSON-LD ~631/~679, cost FAQ ~692/~1841 · `accounts-payable.html` ~7/~14/~21/~402/~529/~1027 · `accounts-receivable.html` ~803/~832/~841/~856 · `collections.html` ~712/~730/~843 · `ach.html` ~696 · `checks.html` ~1455 · `consignment.html` ~1325 · `shelfiq.html` ~519 · `vendors.html` ~448/~517/~726 · `for-bookkeepers.html` ~413 · `signup.html` ~358
- **Direction:** hero/lead → done-for-you ("we run it for you; you approve anything that moves money" — template: `vendors.html:507`). Keep at most ONE secondary "prefer to drive it yourself? you can" mention per page; strip it from JSON-LD entirely (schema should describe the managed service).

### Theme C — CTA routing + "Book a Free Consult" — D3
- Every primary CTA button → `https://shelfspace.pro/contact`. Audit each page's primary CTA; any that points at `signup.html` (self-serve) re-points to `/contact`.
- `platform.html` "**Book a demo**" (~280, ~294, ~505, ~527) → "**Book a Free Consult**" → `/contact`. Grep "Book a demo" sitewide — replace every instance.
- **`signup.html` is NOT reachable.** Remove every inbound link to it — nav, footer, page CTAs, "Sign Up" buttons, `login.html`'s "create an account" link, blog CTAs. Then make `signup.html` itself redirect to `/contact` (meta-refresh + JS + a `/vercel.json` redirect so the URL can't be reached directly). Grep `signup` / `Sign Up` / `Create account` / `Start free` sitewide.

### Theme D — Tool-voice → we-voice (done-for-you is OUR labor)
- `index.html` AP tour ~945 "The platform three-way matches… **You cut the check.**" → "we three-way match… then cut the check the moment you approve." (also ~910/~976/~977)
- `index.html` credit-recovery tour ~1008 "**Your team handles the conversations**…" → "we run the vendor negotiation; you just approve the recovered credit."
- `how-it-works.html` ~789 "How **the platform** recovers…" → "How **we** recover…"
- `consignment.html` S3 ~841/~864 "**Add** the vendor, **set** the split…" → "tell us the vendor and split; we flip them live and run every settlement."

### Theme E — ShelfiQ: "the AI that runs the money," not a chatbot
- `shelfiq.html` title ~6, hero ~294/~295, CTA ~510, and the "Ask Anything" demo ~302–500 → lead with ShelfiQ *doing* (sends the memos, answers vendors, chases AR, executes; you approve).
- **Schema:** `shelfiq.html` ~247 and `index.html` ~650 declare `@type: SoftwareApplication` for ShelfSpace itself → change to `Service` (consignment/credit-recovery pages already do). ShelfiQ stays described as the internal AI.

---

## P2 — Pricing consolidation & structural surfaces

### Theme F — Consolidate ALL pricing to `/pricing` — D4
Sweep every page for pricing language and remove it or link to `/pricing`:
- **Cost FAQs on non-pricing pages** — `index.html` ~692/~1841, `how-it-works.html` ~508, `accounts-payable.html` ~1027, `consignment.html` ~1325, `ach.html` ~696, `checks.html` ~1455, etc. → remove the answer's pricing content; replace with a one-line "Pricing is scoped to your operation — see [Pricing](/pricing)" pointer, or drop the FAQ.
- **The ~$4k/mo bookkeeper-displacement anchor** — put it ONLY on `/pricing` (and it's fair game in blog prose). Do NOT scatter it across service pages.
- **`pricing.html` itself** (the one home for pricing) needs its own cleanup: the freemium two-tier grid ("See it/Free" vs "We run it/For you") + per-unit metering ("ShelfiQ Q&A 25/mo", ~390–507) reads as SaaS-tier feature-gating. Recast as "what the managed service covers," drop the metering. Keep it consult-first (custom, scoped). This is where the $4k anchor and the commission framing (per D-note) can live if you choose to state them.
- **`for-bookkeepers.html`** card ~318 anchors to "$100/hour" → that's a pricing mention; move pricing to `/pricing`, keep the page's value framing without a number.
- **Free-diagnostic on-ramp** — pending your sub-question answer (recommendation: keep as not-pricing).

### Theme G — `platform.html`: reposition off generic SaaS
- "**software-as-a-service platform**" ~292/~471/~554 and "Financial operations, delivered as software" → managed money-movement service (we run it).
- "in **any industry**" ~291 + non-cannabis trust chips ~327 → recenter on cannabis retailer↔vendor money.
- "**No rip-and-replace / connect your books**" self-install ~443 → white-glove setup we perform.
- (CTA "Book a demo" handled in Theme C.)

### Theme H — Consignment = one service in the rail
`consignment.html` presents consignment as the whole product. Add a band framing it as "one service in the ShelfSpace money rail (AP · AR · credit recovery · settlements)" + cross-link siblings. Keep its strong DFY spine (~713) and S12.

### Theme I — `for-bookkeepers.html` dual framing (conscious choice)
Currently 100% "arm the bookkeeper" channel framing. Defensible as a channel page — decide consciously whether it should also speak to displacing a firm's manual AP line item. Keep the strong boundary line ~409 and the referral/white-label monetization ~405. (Its $100/hr pricing → `/pricing` per D4.)

### ~~Theme F (old) — financing/rail seeding~~ — DROPPED per D2. Keep the site silent on rail/financing.

---

## Theme J — Blog audit (COMPLETE — all 108 posts combed 2026-09-07)
Correction to the first draft: the 12 managed-services posts are BUILT and live (`managed-services-blog-build.md` checkboxes are just stale — mark them done). The real work is fixing the same misalignments across the posts. Findings below (line numbers approximate — re-verify). Most posts are clean; the hits cluster into four buckets.

### J1 — "keep 100% / never take a cut" in blogs (P0 — same as Theme A; interacts with D5)
- `cannabis-debt-collection-agency-alternative.html` — **whole post is built on it.** title/meta/OG/Twitter L6/7/11/12/18/19 ("Keep 100%, Not a 30% Cut"), JSON-LD L82/83/96/98, body/FAQ/CTA L140/141/150/165/166/225/229/231/233/246/266/279/286/287/300. → rebuild depends on **D5**.
- `cannabis-collections-outsourcing.html` — L179/187/246/280/314/345/417/428/432 (JSON-LD + body). → depends on **D5**.
- `self-serve-credit-memos-cannabis.html` — L203/260/433 ("no percentage taken; you keep 100%").
- `credit-recovery-scorecard-cannabis.html` — L554 body + L225 JSON-LD.
- `is-shelfspace-safe-for-vendors.html` — L262 ("we never take a cut"). (Vendor-fee context is accurate, but the literal phrase goes.)

### J2 — ShelfSpace's OWN pricing in blogs (→ /pricing only, per D4)
- `cannabis-ap-aging-which-vendors-to-pay.html` L181 (JSON-LD: **$5 mailed-check fee** + custom pricing + no cut)
- `switch-vendor-to-mailed-checks.html` L255/287/369–370/374/206–211/413–414 (**$5 mailed-check fee** + "included in your plan", body + JSON-LD)
- `shelfspace-vs-diy-cannabis-ap.html` L166–169/391–392/318/357/374 + **compare-table cost cell L267** ("custom pricing", "no percentage")
- `cannabis-vendor-quickbooks-setup.html` L489–490 ("Free for vendors. Always."), L424 ("no fees"), L493 CTA "Get a Free Vendor Account"
- `cannabis-vendor-onboarding-shelfspace.html` L426 ("no fees")
- `case-study-vendor-portal.html` L284/369/184 ("no signup fee, no recurring charge")
- `cannabis-consignment-spreadsheets-cost.html` L373 (+ soft "free portal" L342)
- `cannabis-consignment-erp-vs-managed-service.html` L348 (+ soft compare "Free" L263)
- `cannabis-debt-collection-agency-alternative.html` L12/19 ("flat-fee"), L98/235/263/287
- `cannabis-accounts-payable-cost.html` L354/438 ("priced on what we save you")
- `self-serve-credit-memos-cannabis.html` L200–203/432–433/465 ("only pay when recovered")
- `vertically-integrated-cannabis-shelfspace.html` L528 ("No credit card")
- `optimize-profitability-velocity-every-sku.html` L391 ("start free on **Visibility**" — a named tier)
- **Borderline "you only pay if we recover/deliver"** (success-based terms — reviewer judgment; it's *consistent* with the commission model but per D4 belongs on /pricing): anatomy-of-an-ap-email-thread L521, anatomy-of-an-invoice-payment L653, anatomy-of-a-consignment-settlement-report L424, anatomy-of-a-vendor-credit-memo L512, cannabis-ap-aging L508, cannabis-bank-shutdown-payment-infrastructure L440
- **Borderline "costs you nothing (retailer pays us)"** (vendor-side): what-is-shelfspace.html L277/442/494

### J3 — "Get a Demo" CTA label → "Book a Free Consult" (~34 posts; href already `/contact`, LABEL only)
add-consignment-to-existing-cannabis-vendor:399 · advance-vendor-approval-protects-margins:609 · cannabis-accounts-payable-cost:441 · cannabis-consignment-quickbooks-sync:386 · cannabis-consignment-wholesale-same-vendor:454 · cannabis-delivery-short-damaged-non-compliant:512 · cannabis-dispensary-back-office-software:511 · cannabis-erp-system:505 · cannabis-inventory-freshness:539 · cannabis-invoice-metrc-verification:572 · cannabis-moisture-loss-consignment:480 · cannabis-perpetual-inventory-quickbooks:563 · cannabis-retail-management:495 · cannabis-vendor-management-guide:680 · cannabis-vendor-no-response-credit-memo:463 · case-study-ap-time-savings:389 · case-study-consignment-conversion:408 · case-study-delivery-dashboard:448 · case-study-duplicate-invoice:485 · case-study-quickbooks-sync:406 · case-study-shelfiq-vendor-emails:426 · case-study-vendor-credit-recovery:377 · case-study-vendor-portal:408 · dispensaries-overpay-vendors:415 · dispensary-vendor-costs:378 · get-started-cannabis-consignment:437 · how-to-receive-a-cannabis-delivery:485 · manage-cannabis-deliveries-by-email:458 · multi-location-cannabis-consignment-rollout:464 · optimize-profitability-velocity-every-sku:669 · shelfiq-vendor-replies-credit-memos:510 · track-returns-credits-cannabis:417 · what-is-check-21:394 · what-is-shelfspace:507. (Plus relabel `cannabis-vendor-quickbooks-setup:493` "Get a Free Vendor Account".)

### J4 — Self-serve as the LEAD (per D1: demote; no funnel)
- `self-serve-credit-memos-cannabis.html` — the whole post leads with self-serve: title/OG/JSON-LD L6/11/167 ("…Yourself"), hero L248–249, L390 ("your data, your button, your drafts"), H2 L403 ("Why self-serve is the point"). **Biggest single reframe** — recast to done-for-you lead with self-serve as a secondary capability (or retire the post).
- CTA mis-routes to `/vendors` instead of `/contact` (decision — strict all-to-/contact?): `cannabis-vendor-onboarding-shelfspace:428`, `get-retailer-w9-resale-certificate:290`, `is-shelfspace-safe-for-vendors:342` (vendor-audience pages → vendor info page, not a funnel).

**Blog clean-list:** the ~11 `shelfspace-vs-*` comparison posts, `setting-credit-recovery-rates`, `vendor-credit-memo-review-cycle`, `whitelist-shelfspace-emails`, `why-general-consignment-software-doesnt-work-cannabis`, and the bulk of the case studies are clean (competitor prices and customer-cost worked examples correctly left in).

---

## Leave alone — already aligned
- **Retired per-artifact pricing** — no per-check/per-CM/per-invoice/flat-SaaS number on any page. Clean.
- **The done-for-you spine** — `index.html` hero rotator ~806, `how-it-works.html` ~596, `about.html` ~216, `consignment.html` S12, `credit-recovery.html` ~504, `vendors.html` ~507. Reuse as templates.
- **No-VC / solo-operator framing** — clean sitewide.
- **No-custody / rail-safe messaging** — `accounts-receivable.html` ~659, `collections.html` ~591.
- **`contact.html`** — strongest managed-services-motion page (consult intake, channel capture via "Other"). This is the funnel destination D3 points everything to.

---

## Execution order (on your go)
Blog audit is complete (Theme J); the D4 sub-question is resolved (keep the free on-ramp). **Still open: D5** (is collections commission-priced?) — needed before touching the two collections posts (J1) and the collections/AR service pages.
1. **P0 Theme A + J1** — remove "no cut / keep 100%" across pages AND blogs (~11 page spots + the collections posts). The two D5-dependent collections posts wait on your ruling.
2. **Global mechanical sweeps** (safe, high-volume, low-risk):
   - "Get a Demo" / "Get a Free Vendor Account" → **"Book a Free Consult"** (Theme C + J3, ~34 blog CTAs + platform.html "Book a demo").
   - De-link `signup.html` everywhere + redirect it to `/contact` (D3).
   - Move every ShelfSpace-own-pricing mention to `/pricing` (Theme F + J2), incl. the $5 mailed-check fee, "no fees / free for vendors," "custom pricing," compare-table cost cells.
3. **P1 Themes B/D/E** — demote (not delete) the self-serve lane sitewide incl. JSON-LD; tool-voice→we-voice; ShelfiQ reposition + `Service` schema.
4. **P2 Themes G–I** — platform.html off-SaaS reposition, consignment-as-one-service, for-bookkeepers dual framing.
5. **J4 reframes** — recast `self-serve-credit-memos-cannabis.html` to done-for-you lead (or retire); decide the 3 vendor-page `/vendors` CTAs (strict all-to-/contact?).

Every change routes through `landing-page-playbook.md` + the forbidden-token checks (`check-docs-forbidden.sh`, `check:forbidden`, `check-blog-sync.sh`). Still nothing executed — awaiting your go (and the D5 ruling).
