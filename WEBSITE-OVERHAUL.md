# Website Overhaul — shelfspace.pro repositioning (spec'd + in-flight)

Reposition from "self-serve automation *tool*" → **"the money side of cannabis, handled"** (Pilot-inspired). Sell the outcome; **no public pricing**; every path → a conversation. The governing voice law now lives in **`CLAUDE.md` § Positioning & Voice** (rewritten in Row 1) — read it before any page edit.

**Execution:** mini build-runner, one row at a time, in order, committing per row (repo auto-pushes to prod). No `/spec` / `/finish` per row. **Row 1 must land first** (it did) or later edits inherit contradictory rules.

## Locked decisions (Chris, 2026-09-04)
1. **Free on-ramp: YES** — "see what you're owed," framed as the first step of the conversation, not a plan. → `/contact`.
2. **Bookkeepers = referral channel** — "a bookkeeper's best friend; we run AP & AR, you keep the close/tax/280E." Reframe `for-bookkeepers.html`, don't delete.
3. **Kill "Sign Up"** — consult-first; primary CTA "Talk to us" → `/contact`. Keep Login.
4. **`/pricing` → repurpose in place** as numberless **"How We Work With You"** (custom pricing). Keep the URL for SEO.

## Design direction (be a great web designer — visuals matter as much as words)
Apply the playbook's 5-beat arc; **elevate** the existing sophisticated hero (parallax, gradient, rotator), don't flatten it. Space Mono for every dollar/number moment; design tokens only (`--green-deep`…); green-tinted shadows; **one** dark section per page (the emotional peak); whitespace = confidence. **Strip AI/robot iconography from heroes.** Homepage 5 beats: Recognition (outcome hero) → Pain (big-number leak) → Relief (free "see what you're owed" on-ramp) → Proof (case-study card grid — currently absent, ADD it) → Action (consult CTA + Chris's photo + risk reversal). Sticky bar: one line, one button.

## SEO / LLM mitigations (baked into rows)
- **Repurpose `/pricing` in place** (keep URL + pricing-intent title/meta) — don't delete.
- **Keep category keywords** ("cannabis accounts payable software," "consignment management") in title/meta/H2/schema even as hero voice goes outcome-first. Voice change is hero-level only.
- **Rewrite `llms.txt` `## Pricing`** → custom/contact (highest LLM-correctness leverage — it's what feeds stale prices to ChatGPT/Perplexity/Claude).
- **Fix `pricing.html` JSON-LD** — remove `Product`/`Offer`/`priceCurrency` (invalid without price); keep `FAQPage`/`BreadcrumbList`; add cost FAQ.
- **Nav: rename "Pricing"→"How We Work"** (href stays `/pricing`) — preserves internal-link equity vs. removing. "Sign Up"→"Talk to us"→`/contact".
- **Homepage schema**: keep `SoftwareApplication`, **add** `Service`/`ProfessionalService`.
- **Never change any `/blog/*` or `/docs/*` URL** (188-URL sitemap = long-tail asset). Bump `sitemap.xml` lastmod on changed pages.
- **Deliberate reversal**: this reverses the 2026-05-19 "system, not a managed service" pivot (its memory file is gone) — grounded in the real done-for-you model shift.

## ✅ STATUS: COMPLETE — 2026-09-04 (live on origin/main)

All rows shipped. Final gate GREEN: `check-docs-forbidden.sh` clean · sitewide pricing/trial/subscription grep empty (outside the legal `terms.html`) · Diem only in Chris's bio (`about.html` + one-pager) · 548 JSON-LD blocks across 227 files all valid · every signup link → `/contact` · nav "Pricing"→"How We Work", "Sign Up"→"Talk to us". Added beyond the original plan: a **`docs/` sweep** (11 help pages, incl. a full `docs/billing/overview.html` rewrite — the fence doesn't scan docs). Row 16 (trust) was satisfied by the existing homepage case-study grid + the de-identified lead.

**Left for the human (not auto-done):**
- **`terms.html` §12** still states the subscription pricing ($999–$749/location, $499/mo, 30-day trial, auto-renewal). It's a legal contract — needs counsel to align the Terms with custom pricing. NOT rewritten.
- **Visual spot-check** of the live homepage + `/pricing` recommended (CSS/design primitives were preserved, not re-verified in a browser).

## Rows

- [x] **Row 1 — Governing docs.** `CLAUDE.md` (§Positioning & Voice + Nav), `.claude/skills/audit/SKILL.md` (voice list), `marketing/landing-page-playbook.md` (Forbidden/Pricing/CTA), `marketing/case-studies.md` (CTA), `marketing/scripts/check-docs-forbidden.sh` (Scan B flipped to block pricing/trial). **DONE** — fence proven RED on retired copy.
- [ ] **Row 2 — `index.html`** 5-beat redesign; strip pricing/trial; demote AI (44→<10); add case-study card grid; add `Service` schema (keep `SoftwareApplication`); CTAs → `/contact`. Free on-ramp as Beat 3.
- [ ] **Row 3 — Repurpose `/pricing`** → "How We Work With You" (numberless). Remove `Product`/`Offer` JSON-LD; add cost FAQ. Keep URL + sitemap (fresh lastmod).
- [ ] **Row 4 — Sitewide nav/footer (216 files)** rename "Pricing"→"How We Work" (→/pricing); "Sign Up"→"Talk to us"→/contact; keep Login. Anchor on `Credit Recovery</a></li>`→nav adjacency; leave footer single-line CR link.
- [ ] **Row 5 — `accounts-payable.html`** strip pricing/trial; outcome voice; CTA→/contact; keep example $ + category keywords.
- [ ] **Row 6 — `credit-recovery.html`** — same.
- [ ] **Row 7 — `consignment.html`** — same (already service-heavy; lighter).
- [ ] **Row 8 — `accounts-receivable.html` + `collections.html`** — same; collections has the heaviest "automat" density → reframe "a bot runs your collections" to outcome.
- [ ] **Row 9 — `vendors.html`, `checks.html`, `ach.html`** — strip lighter residue; CTA→/contact.
- [ ] **Row 10 — `how-it-works.html` + `features.html`** — AI demoted; how-it-works explains the SERVICE flow (onboard → we run it → you approve what moves money).
- [ ] **Row 11 — `shelfiq.html`** (stays AI-forward, strip trial) + `platform.html` (light).
- [ ] **Row 12 — `about.html`** (keep Diem bio; founder-operator trust) + `for-bookkeepers.html` (referral-channel reframe).
- [ ] **Row 13 — `_pdf-source/one-pager.html`** (keep Diem bio; strip pricing; regen PDF).
- [ ] **Row 14 — Blog sweep** (13 posts w/ pricing/trial) — strip pricing/trial only; NO URL/schema changes.
- [ ] **Row 15 — `llms.txt` rewrite** — §Pricing → custom/contact; reframe "What ShelfSpace is"; keep Three-Services facts.
- [ ] **Row 16 — Trust layer** — case-study grid live on homepage + key pages; Metrc badge; aggregate numbers (no shop-fingerprinting).
- [ ] **Row 17 — Final gate** — `bash marketing/scripts/check-docs-forbidden.sh` GREEN; sitewide grep 0 pricing/trial outside legal; Diem bio-only; every primary CTA→/contact; JSON-LD valid (no orphan Offer); sitemap/llms consistent; Lighthouse green.

## Acceptance (final gate greps)
- `bash marketing/scripts/check-docs-forbidden.sh` → exit 0.
- `grep -rIlE 'free trial|day trial|subscription|per location|\$(499|749|799|899|999)\b|Start your free' --include='*.html' . | grep -vE 'terms.html|privacy.html'` → empty.
- `grep -rIl 'Diem' --include='*.html' .` → only about.html + one-pager (bios).
- No `ourshelf.space/signup` primary CTAs remain; primary CTAs → `/contact`.
