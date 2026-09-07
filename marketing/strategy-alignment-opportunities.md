# Website Strategy-Alignment Opportunities — REVIEW (decisions locked 2026-09-07)

**Status:** finalized review/plan, NOT yet executed. Nothing on the site has been changed. Line numbers were captured in an audit pass — re-verify before editing.

**Source of truth:** `shelfspace-platform:docs/roadmap/00-strategy.md` (2026-09-07). ShelfSpace = an AI-driven **managed-services money rail** for cannabis retailer↔vendor money (AP, AR, payments, credit recovery, settlements). **Done-for-you** is the lead; self-serve stays an available option (D1). GTM = displace the ~$4k/mo manual AP/bookkeeping firm. Endgame (rail → finance the flow) stays **internal / silent on the site** (D2).

**Governing constraints when executed** (`CLAUDE.md` + `landing-page-playbook.md`): no "automate" in heroes; no "scan-based trading"/"SBT"; "Diem" only in Chris's bio; no `<br>` in headings; no questions as headlines; no "learn more" CTAs; verb split (we / the platform / you); `check-docs-forbidden.sh` + `check:forbidden` stay green.

---

## Decisions — LOCKED (Chris, 2026-09-07)

- **D1 — Self-serve: leave the door OPEN.** Managed-services / done-for-you is the LEAD everywhere, but keep self-serve as an available option — **demote it, don't delete it.** "Software you drive, or done for you" may remain as a secondary mention; it must never be the hero lead and never a CTA destination (see D3).
- **D2 — Financing/rail endgame: SILENT.** No rail/financing/factoring language on the public site for now. (Theme F below is DROPPED.)
- **D3 — Every page drives to `https://shelfspace.pro/contact`.** Every PRIMARY CTA → `/contact`, never a self-serve signup. Rename every **"Book a demo" → "Book a Free Consult"** (→ `/contact`). The self-serve signup stays reachable for anyone who wants it (D1), but NO page funnels to it.
- **D4 — Pricing lives ONLY on `https://shelfspace.pro/pricing`.** Every pricing reference anywhere else on the site is removed or converted to a link to `/pricing`. There is **no mention of pricing on any other page** — no "custom pricing," no cost FAQs, no "no cut / keep 100%," no tier/plan/fee language outside `/pricing`.
  - **One sub-question for you:** does the free **"see what you're owed" diagnostic on-ramp** count as a "pricing mention"? It's the funnel's entry (a lead magnet, $0 to look), not a price/tier. **Recommendation: keep it as the on-ramp, treat it as not-pricing.** If you want it gone too, say so and it routes to `/contact` with no "free" language.

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
- `signup.html` stays reachable (D1) but is not a CTA destination anywhere. (No auth-flow change needed — just stop funneling to it.)

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

## Theme J — CORRECTION: the blog series is BUILT; sweep the 108 posts instead
**I was wrong in the first draft** — all 12 managed-services posts exist and are live (`/blog/`, 108 posts total). The `managed-services-blog-build.md` checkboxes are stale; update them to done.
**Real opportunity:** the 108 blog posts were **never combed** (the audit only covered the 22 top-level pages). They need the same sweep, especially:
- **D4 pricing mentions** — any post that states cost/tiers/fees must route to `/pricing` or drop it.
- **"no cut / keep 100%"** language (the P0 promise likely echoes in posts).
- **CTA routing** — every post's CTA → `/contact`; any "Book a demo" → "Book a Free Consult".
- **Self-serve lead framing** — demote per D1.
Recommend a follow-up comber pass over `/blog/*.html` before executing, so the sweep is complete.

---

## Leave alone — already aligned
- **Retired per-artifact pricing** — no per-check/per-CM/per-invoice/flat-SaaS number on any page. Clean.
- **The done-for-you spine** — `index.html` hero rotator ~806, `how-it-works.html` ~596, `about.html` ~216, `consignment.html` S12, `credit-recovery.html` ~504, `vendors.html` ~507. Reuse as templates.
- **No-VC / solo-operator framing** — clean sitewide.
- **No-custody / rail-safe messaging** — `accounts-receivable.html` ~659, `collections.html` ~591.
- **`contact.html`** — strongest managed-services-motion page (consult intake, channel capture via "Other"). This is the funnel destination D3 points everything to.

---

## Execution order (on your go)
1. **Answer the D4 sub-question** (free on-ramp = pricing or not).
2. **Comber pass over `/blog/*.html`** (108 posts) to complete the audit — Theme J.
3. **P0 Theme A** — remove "no cut / keep 100%" (~11 spots).
4. **P1 Themes B–E** — demote self-serve, CTA routing + "Book a Free Consult", tool-voice→we-voice, ShelfiQ reposition + schema.
5. **P2 Themes F–I** — consolidate pricing to `/pricing`, platform.html reposition, consignment reframe, bookkeeper page.
6. **Blog sweep** — apply A/B/C/D4 fixes across the 108 posts.

Every change routes through `landing-page-playbook.md` + the forbidden-token checks. Still nothing executed — awaiting your go.
