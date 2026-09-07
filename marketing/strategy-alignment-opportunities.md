# Website Strategy-Alignment Opportunities — REVIEW ONLY

**Created:** 2026-09-07 · **Status:** review list, NOT a build order. Nothing on the site has been changed. Every line/quote below was captured in an audit pass — re-verify line numbers before editing (the pages shift).

**Source of truth:** the locked strategy `shelfspace-platform:docs/roadmap/00-strategy.md` (2026-09-07). ShelfSpace = an **AI-driven managed-services money rail** for cannabis retailer↔vendor money (AP, AR, payments, credit recovery, settlements). **Done-for-you, not self-serve** (customers can't self-serve — structural). GTM = **displace the ~$4k/mo manual AP/bookkeeping firm** operators already pay; take the money-movement slice, not the books. Pricing = **recurring base (vs the ~$4k anchor) + a cut of the money moved (commission on credit recovery) + float**; per-artifact/per-transaction/free-trial/SaaS-tier framings retired. Endgame = **become the rail, then finance the flow** (factor vendor receivables, working-capital advances, float). Solo, self-funded, 100%-owned, forever.

**What the Sept-4 overhaul already did (don't redo):** moved the site to outcome-first, "done-for-you allowed," no public pricing, consult-first → `/contact`. That pass is complete. This file is the **next layer** — the deltas the now-locked (and further-along) strategy adds beyond "done-for-you allowed."

**Governing constraints when any of this is executed** (marketing `CLAUDE.md` + `landing-page-playbook.md`): no public pricing/tiers/trial/subscription tokens; no "automate/automated/automatically" in heroes; no "scan-based trading"/"SBT"; "Diem" only in Chris's bio; no `<br>` in headings; no questions as headlines; no "learn more" CTAs; verb split (we / the platform / you); `check-docs-forbidden.sh` + `check:forbidden` must stay green. Any rewrite below must land inside these rules.

---

## ⚑ Decisions needed FIRST (these gate the copy work)

The audit surfaced four genuine strategic calls. The copy changes below assume a default answer, noted — confirm or override before building.

- **D1 — How hard does the *public* site commit to managed-services-primary?** The site today is deliberately *delivery-agnostic* ("software you drive, OR done-for-you"). The locked strategy is decisive: done-for-you is the model, self-serve is a fallback. Keeping the public framing slightly agnostic *can* be a deliberate funnel choice (don't scare off an operator who thinks they want a tool). **Default assumed below: go managed-services-primary publicly — purge the co-equal self-serve lane.** If you'd rather keep a soft self-serve door, Theme B narrows to "demote, don't delete."
- **D2 — Seed the financing/rail endgame publicly now?** Factoring/working-capital isn't a live product. **Default: seed the *direction* with soft forward language ("the money rail for cannabis," "faster access to your cash as we grow") — never advertise factoring as available.** If you want zero financing signal until it's live, skip Theme F.
- **D3 — Kill the self-serve signup + demo surfaces?** `signup.html` is a live self-serve account-creation/auto-login flow and `platform.html` sells "software-as-a-service." These structurally contradict done-for-you. **Default: convert both to consult/diagnostic intake.** This is bigger than copy (Theme C/I) — confirm before touching auth flows.
- **D4 — Put commission language on the site at all?** The flagship pricing is a *cut of recovered money*, but the site currently promises the opposite ("keep 100%"). At minimum the contradiction must go (Theme A). Whether to state the commission model publicly, or keep it to the consult, is your call. **Default: remove the "no cut" promise; do NOT publish the commission rate; frame as "success-based, we only win when you recover."**

---

## P0 — Critical (a live promise that contradicts the strategy)

### Theme A — Kill "you keep 100% / we never take a cut, ever"
This is the highest-priority item on the site. It's a public promise that **forecloses the commission-on-recovery model** the strategy names as the flagship. Confirmed on four pages:

| File | ~Line | Current copy |
|---|---|---|
| `index.html` (DFY closer band) | ~1356 | "100% Stays yours … Every dollar we recover or collect. **No percentage, no cut — ever.**" |
| `credit-recovery.html` (hero) | ~479 | "You keep 100%." |
| `credit-recovery.html` (DFY step 03) | ~509 | "and you keep 100%." |
| `credit-recovery.html` (calc guarantee) | ~1024 | "You keep every dollar recovered. **We never take a cut of what you recover.**" |
| `credit-recovery.html` (pricing reveal) | ~1040 | "you keep every dollar that's recovered — we never take a cut." |
| `credit-recovery.html` (FAQ) | ~1092 | "you keep every dollar recovered — we never take a cut." |
| `credit-recovery.html` (final CTA) | ~1063 | "No cut of what you recover, ever." |
| `credit-recovery.html` (Service JSON-LD) | ~442 | "you keep every dollar recovered." |
| `collections.html` (hero + DFY) | ~404 | "We run the collecting. You keep 100%." |
| `accounts-receivable.html` (DFY + CTA) | ~404, ~856 | "We run your collections. You keep 100%." |
| `features.html` | ~388 | "You keep **every dollar** we recover." |

**Direction:** remove the "no cut / keep 100%" claims everywhere. Reframe success-based, fee-averse-friendly, no published rate: *"Free to see what you're owed. We recover it for you and take a share only of what actually lands — if you don't get the credit, we don't get paid."* (per D4 default). "The money lands straight in your account" is still true re: no custody — keep that where custody was the point.

---

## P1 — Systemic positioning gaps

### Theme B — Purge the dual "software you drive, or done for you" lane
The single most pervasive misalignment — it appears in heroes, subheads, FAQs, CTAs, **and JSON-LD/schema** on nearly every page. It reopens the self-serve SaaS door the strategy closes. Representative instances (not exhaustive — grep the string sitewide):

- `pricing.html` — hero sub ~299, plan notes ~317/~334, "Two ways to work with us" module ~540–555, FAQ "Do you run it… **Either.**" ~574
- `how-it-works.html` — FAQ schema ~468 ("**Either.** software you drive yourself, or…"), hero subhead ~598, DFY step 02 ~632, why-strip ~643, HowTo schema ~532/~557
- `index.html` — Org/ProfessionalService JSON-LD ~631/~679, cost FAQ ~692/~1841
- `accounts-payable.html` — meta/OG/Service-JSON-LD ~7/~14/~21/~402, hero lede ~529, cost FAQ ~1027
- `accounts-receivable.html` ~803/~832/~841/~856 · `collections.html` ~712/~730/~843 · `ach.html` ~696 · `checks.html` ~1455 · `consignment.html` ~1325 · `shelfiq.html` ~519 · `vendors.html` ~448/~517/~726 · `for-bookkeepers.html` (QBO FAQ ~413) · `signup.html` (~358)

**Direction (D1 default = purge):** replace every "software you drive, or done for you" with the done-for-you spine already used well elsewhere — *"we run it for you; you approve anything that moves money."* Update the JSON-LD strings too (SEO/answer-engines read them). Template line that already works: `vendors.html:507` "we run the collecting for you — you set the terms, we chase the money."

### Theme C — Recast the "the platform… you do X" tool-voice into "we do it on your approval"
Done-for-you means the money-movement labor is *ours*, not the customer's. Fix the copy that puts the work back on them:
- `index.html` AP tour ~945 "The platform three-way matches… **You cut the check.**" → "we three-way match… then cut the check the moment you approve." (also ~910, ~976, CTA ~977)
- `index.html` credit-recovery tour ~1008 "**Your team handles the conversations** that need a human." → "we run the vendor negotiation; you just approve the recovered credit."
- `how-it-works.html` ~789 "How **the platform** recovers…" → "How **we** recover…"
- `consignment.html` S3 ~841/~864 "**Add** the vendor, **set** the split…" → "tell us the vendor and split; we flip them live and run every settlement."

### Theme D — Reposition ShelfiQ from "chatbot/advisor" to "the AI that *runs* the money"
`shelfiq.html` sells passive Q&A visibility; strategy = ShelfiQ is the engine that *does the work*.
- Title ~6 "AI for Cannabis Dispensary Operations"; hero ~294 "answered in seconds"; ~295 "The eyes that see…"; CTA ~510 "Your AI advisor is ready" → lead with ShelfiQ *doing*: "runs your vendor money — sends the credit memos, answers vendors, chases the AR, executes the decision; you approve."
- The whole "Ask Anything / What You Can Ask" chatbot demo (~302–500) reinforces a self-serve tool — reframe around ShelfiQ autonomously handling threads with the operator approving.
- **Schema:** `shelfiq.html` ~247 and `index.html` ~650 declare `@type: SoftwareApplication` — change ShelfSpace's own type to `Service` (as consignment/credit-recovery pages already do); keep ShelfiQ described as the internal AI, not a product the buyer operates.

### Theme E — Add the ~$4k/mo bookkeeper-displacement anchor
The GTM anchor is missing from every pricing/cost surface — "custom pricing" floats with no reference point.
- `pricing.html` cost FAQ / hero — add: "you're already paying a firm ~$4k/mo to move this money by hand; we take that slice for less."
- `index.html` — cost FAQ ~1841, the "replace my bookkeeper?" FAQ ~716 (add: "we take over the vendor money-movement your AP firm bills ~$4k/mo to do by hand"), and tie the "$45K saved on AP ops" stat ~1206 to the outsourced-AP spend.
- `about.html` ~208 (the "reconciling invoices at midnight" setup), `contact.html` hero ~249, `for-bookkeepers.html` benefits card ~318 (currently anchors to "$100/hour" — re-anchor to ~$4k/mo).

---

## P2 — Structural surfaces & strategic seeding

### Theme F — Seed the money-rail / financing endgame (per D2)
Absent everywhere. Add *soft, forward* signal — never advertise unbuilt factoring:
- `ach.html` — **the designated spot, currently zero rail/financing signal.** Add a section positioning ACH as ShelfSpace's money rail: "the bank-to-bank rail your payments ride — and the one that will carry faster access to your cash as ShelfSpace grows."
- `collections.html` ACH-Collect ~564–592 — add one line connecting the no-custody rail to the direction ("the same rail that will one day advance you the cash before the retailer pays").
- `index.html` — a "the money rail for cannabis" beat; reframe the AR "one click and you're paid" ~1230 toward "we advance/settle." Consignment "Working capital" badge ~1064 and vendor "0% installment plans" (pricing ~340) are existing adjacent hooks.

### Theme G — Frame consignment as ONE service in the rail, not the whole product
`consignment.html` presents consignment as self-contained. Add a band positioning it as "one service in the ShelfSpace money rail (AP · AR · credit recovery · settlements)" and cross-link the siblings. (Its DFY spine at ~713 and S12 "We run the engine, you run the relationships" are already strong — keep.)

### Theme H — `for-bookkeepers.html`: make the dual framing a conscious choice
Page is 100% "arm the bookkeeper" channel framing ("best friend," "no overlap"). Strategy allows channel-OR-displace. **Defensible as-is** (channel page), but decide consciously: at minimum let it also work for firms whose manual AP line item we take over. Re-anchor card ~318 from "$100/hour" to the ~$4k/mo incumbent. Keep the strong boundary line ~409 ("we don't do close/payroll/tax — that's your work") and the referral/white-label monetization ~405.

### Theme I — Replace SaaS surfaces that structurally contradict done-for-you (per D3)
- `pricing.html` compare tables ~390–507 — a **freemium two-tier grid** ("See it/Free" vs "We run it/For you") with per-unit metering ("ShelfiQ Q&A 25/mo"). Replace with a "what the managed service covers" list; drop the metering.
- `platform.html` — the most off-strategy page: "**software-as-a-service platform**" (~292/~471/~554), "in **any industry**" + non-cannabis trust chips (~291/~327), "no rip-and-replace / connect your books" self-install (~443), "**Book a demo**" CTA (~280+). Reposition as a managed money-movement service, recenter on cannabis, swap "Book a demo" for the diagnostic/consult CTA.
- `signup.html` — a live **self-serve account-creation + auto-login** flow with "Free evaluation. **No credit card required**" (~199) free-trial language. Convert to the consult/diagnostic intake (route to `/contact`) or gate account creation behind scoped onboarding. Legacy debt: dead trial-disclosure code comment ~357.

### Theme J — Build the planned managed-services blog series (content engine)
`marketing/managed-services-blog-build.md` already specs **12 posts** (pillars: outsourced back office, cannabis AR management, outsource cannabis AP, collections-outsourcing, outsourced finance team) — **all status ☐, none built.** This is the biggest *aligned-content* opportunity and it's already scoped, with a per-post agent brief (`managed-services-blog-agent-brief.md`). Ranking against real competitors (Headquarters, GreenGrowth, CannaBIZ Collects). Recommend running it via the blog-post skill once the copy decisions above are settled so voice matches.

---

## Leave alone — already aligned (do NOT touch)

- **Retired per-artifact pricing** — confirmed: no per-check / per-CM / per-invoice / flat-SaaS number on ANY page. The cleanest win of the Sept-4 pass. (The only pricing *defect* is the opposite error — the "no cut" promise in Theme A.)
- **The done-for-you spine** — `index.html` hero rotator ~806 ("Your vendors, paid… The back office team you've been dreaming of / The money side of cannabis, handled"), `how-it-works.html` "Connect once. We run it. You approve." ~596, `about.html` ProfessionalService schema + "I built the team that runs the money side for you" ~216, `consignment.html` S12, `credit-recovery.html` DFY flow ~504, `vendors.html` ~507. These are the templates — reuse them to fix the misaligned spots.
- **No VC / solo-operator framing** — clean across all pages; founder-operator credibility reinforces self-funded identity. Keep.
- **No-custody / rail-safe messaging** (`accounts-receivable.html` ~659, `collections.html` ~591) — supports the rail-but-not-a-processor position.
- **`contact.html`** — the strongest managed-services-motion page (consult intake, human reply, channel capture via "Other"). Only a small anchor line missing (Theme E).

---

## Suggested execution order (when approved)

1. **P0 Theme A** — remove "no cut / keep 100%" (1 string family, ~11 spots). Fast, critical, unblocks the pricing model.
2. **Confirm D1–D4**, then **P1 Theme B** — purge/demote the self-serve lane sitewide (copy + JSON-LD).
3. **P1 Themes C–E** — tool-voice → we-voice, ShelfiQ reposition + schema, $4k anchor.
4. **P2 Themes F–I** — rail/financing seeding, consignment reframe, bookkeeper page, and the structural SaaS surfaces (signup/platform — these touch flows, not just copy).
5. **Theme J** — run the already-specced blog series last, once voice is locked.

Every change routes through `landing-page-playbook.md` + the forbidden-token checks. Nothing here is executed — this is the review list.
