# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

ShelfSpace marketing site — static HTML/CSS deployed on Vercel at shelfspace.pro. The public-facing website for ShelfSpace, a cannabis-specific back-office for the money side of the business — accounts payable, consignment, accounts receivable / collections, and vendor credit recovery for cannabis dispensaries and the brands that supply them.

## Workflow

- **Always push to production**: After completing work, commit and push directly to `main`. Do not wait for confirmation.

## Positioning & Voice (the current law — 2026-09-04 overhaul)

**UPDATE 2026-10-02 (Chris) — overrides the "delivery-model-agnostic" lines below:** DONE-FOR-YOU ONLY. Never offer "drive the software yourself" / "software you drive" / "run it yourself" as an option on any page (a client who wants to do part of the work = a discount negotiated in the deal, never a listed option). **Guarantees are public:** dispensaries "The credits pay for it. Or we refund the difference." / brands "We collect more than we cost. Or we refund the difference." (first 90 days, refund the gap). **10/24/2026: the homepage + /contact brand guarantee is "We collect 25% of your past-due invoices in month one, or it's free."** Since 10/24 it is the ONLY brand guarantee sitewide (homepage, /contact, /accounts-receivable, the brand side of /pricing, /quote, /rep-management, /ar-aging); the 90-day "more than we cost" line is retired. Dispensary pages keep "The credits pay for it. Or we refund the difference." `/pricing` is a Hormozi-style offer page (pain → value stack with "worth a month" estimates → guarantee → timeline → FAQ), still with NO prices: the price is quoted after the free review, set by monthly sales, never per invoice/payment. Actual list prices live only on the unlinked, noindex `/quote` builder.

The site sells the **OUTCOME**, stays agnostic on who does the work, and shows **no public pricing**. Full rationale + build history: `WEBSITE-OVERHAUL.md`.

- **Positioning — OUTCOME-FIRST, delivery-model-agnostic**: ShelfSpace sells the outcome — *"the money side of cannabis, handled."* Each account is scoped in the sales conversation and may be delivered as **software the operator drives** OR a **done-for-you managed service** — we do NOT force that choice on the website. **Managed-service framing is ALLOWED** ("we run your AP/AR," "done for you," "hands-off"). This deliberately **reverses** the 2026-05-19 "system, not a managed service" rule. Lead with results — *"Your vendors, paid. Credits recovered every month. Overdue invoices, collected."* — never with "the platform automates X." Keep "automate/automation" out of heroes; it's a supporting proof point at most.
- **NO public pricing — anywhere**: no dollar plans, no tiers, no "$X/location," no "30-day free trial," no "subscription," no "cancel anytime," no "$20/artifact." Engagements are **custom, scoped per operation**. The retired two-tier Visibility/Automate subscription model and its numbers ($999/$899/$799/$749 retailer, $499+ vendor) are GONE from the site. **Illustrative example dollar amounts inside worked examples STAY** (a $1,250 settlement, a $7,200 overdue invoice) — only pricing-tier / plan / trial / subscription copy is removed. `marketing/scripts/check-docs-forbidden.sh` (Scan B) now blocks the pricing/trial tokens. **ONE trial exception (Z-33, 10/23/2026 — Chris's own pricing.html commit `4dfc10e` + live decision D3):** the brand-side ShelfCollect **30-day free trial** may be NAMED on brand pages only — today `accounts-receivable.html` and the `show-vendor` side of `pricing.html` — inside `<!-- trial-ok:start -->` … `<!-- trial-ok:end -->` markers (Scan B's `TRIAL_OK_FILES`). Use the product's own facts and nothing more: 30 days, starting when they start it in their account (not at sign-up); no payment details to start; no contract or setup fee; cancel any time. No price next to it, no "subscription," no trial-signup button (the CTA stays "Schedule a call"). Every dispensary page and the retailer side of pricing stay consult-first with NO trial copy; a trial-ok marker on any other file is itself a Scan B failure.
- **Consult-first CTAs → `/contact` (sales row D3, 10/19/2026, Chris):** ONE named exception (10/22/2026, Chris): the homepage hero buttons read **"Get Paid"** (brand, `home-hero`) and **"Get Profitable"** (dispensary, `home-hero-2`) with no microcopy (`LABEL_OVERRIDES` / `NO_MICRO` in `scripts/cta-lib.mjs`). every PRIMARY CTA (nav button + every in-page button) reads **"Schedule a call"** → `/contact?cta=<page>-<slot>` (partner CTAs add `&path=partner`), with one line of page microcopy under in-page buttons ("30 minutes with Chris. See how you'd get paid faster." brands · "…See how your vendor payments would run." stores · "…See how it would run for your business." general · "15 minutes with Chris. See how it would work for your clients." partners (the partner call is 15 minutes)). Never write a button by hand: add it, then run `npm run cta:sweep` (idempotent; `scripts/cta-sweep.mjs`, shared rules in `scripts/cta-lib.mjs`) and `npm run check:cta` (exits 1 on any old label — "Get Started", "Talk to us", "Get My Free Evaluation", "Book a Free Consult", "Show me my number", "Get a free AR review", … — an untagged /contact link, a missing microcopy line, or a partner CTA without `path=partner`). Inline text links keep their words but carry a `cta` tag; footer "Contact" links stay plain. Tutorials pages get their nav CTA from `scripts/build-tutorials.mjs`. Wording experiments run in Chelsea's email, not on the site. The Chelsea call line ("If you haven't picked a time in 10 minutes, Chelsea… calls you") lives only on `/contact`. No trial-signup and no self-serve "Sign Up" as a primary action. Keep a **free "see the money you're missing" on-ramp** as the first step of the conversation (a lead magnet, framed as a first step — not a plan) → `/contact`.
- **Demote AI**: ShelfiQ/AI is HOW we deliver affordably, not WHAT we sell. Strip AI/robot iconography from heroes; keep the dedicated `/shelfiq` feature page. No hero leads with "our AI does X."
- **Diem — Chris's BIO ONLY**: "Founder & CEO, Diem Cannabis" is permitted ONLY as Chris's personal background/credential (`about.html`, the one-pager). NEVER as a ShelfSpace customer, reference, testimonial, logo, or "ShelfSpace runs Diem" usage claim. (This is the one exception to the old blanket "no Diem" ban.)
- **No customer names anywhere** — proof is anonymized case studies (`marketing/case-studies.md`, de-identified per its rules), the Metrc-certified badge, founder-as-operator credibility, aggregate numbers, and product sample renders (the "Holistic Cannabis Co." demo fiction is safe).
- **No "scan-based trading" or "SBT"**: use "consignment." Exception: terms.html, privacy.html (legal docs, don't touch).
- **No demo-modal** (deleted, don't recreate). **No `<br>` in headings** (let text wrap). **No questions as headlines** (they give permission to say "no"). **No "learn more" CTAs** (a dead end, not an action).
- **Verb split**: use "we" for brand + managed-delivery statements ("we run your AP," "we recover your credits"); "the platform" / "ShelfiQ" for software-action descriptions ("the platform three-way matches every invoice"); 2nd-person "you" for operator-driven actions ("you approve, we execute"). **Outcome voice** ("your vendors get paid") sidesteps the who-does-it question — prefer it in heroes. Never "ShelfSpace does X" — pick "we" or "the platform."

## Offer numbers (2026-10-02)

The "Total value, first year" figures are **single-sourced in `pricing.html`'s value stacks** (dispensary $224,500 / brand $301,000, both for a $500k/month example). Mirrors: the ShelfPay stack on `accounts-payable.html`, the ShelfCollect stack on `accounts-receivable.html` (the homepage slider was removed 10/22/2026). Change a number → change all three, then run `bash marketing/scripts/check-offer-numbers.sh` (exits 1 on drift). Copy rules: generous scope, conservative per-line rates, ONE number per line (no ranges), same example size both sides, setup folded into one first-year total, one-time items labeled "one time", no unverified timing promises, never "founding clients" publicly.

Homepage story order (10/22/2026): toggle hero ("I run a brand" default / "I run a dispensary"; BOTH sides are in the HTML, the toggle only shows one; `?for=dispensary` opens that side; one H1 holding both sides' headlines — "We get you paid." / "We make you profitable." (10/22, Chris), `<title>` and meta description are shared and kept stable for SEO; each side = one-line subhead ("Imagine QuickBooks and a collections agency had a baby, that's ShelfSpace." / "Imagine QuickBooks and your accounts payable service had a baby, that's ShelfSpace.") + one card that flips a huge red LATE / UNCLAIMED block to a slammed-in green PAID / RECOVERED stamp + "See how ShelfCollect/ShelfPay works" link to its product page, never a copy of that page) → testimonials (no section title, per Chris 10/22; one featured quote at a time + three logo tabs that auto-advance: Josh Covert / Meds Cafe first, then Shawna Gurgul / One Garden, then Avery Leveston / Cowboy Kush, then Jessa P. / Jesstures LLC, then Noah Braunstein / KushCart (logo from kushcartpdx.com, tagline cropped; Jesstures = a mark we drew, inline SVG), all real, 5s per quote; prev/next arrows beside the quote card) → brand ticker → trust bento ("Built by cannabis operators for cannabis operators.": photo with the MSO line + WSU / Santa Clara / Fortune 500 logos in white directly on the photo (no chips, 10/22) · one "Powered by" card (10/22) of Metrc, QuickBooks, Alero Financial, Safe Harbor logos (Chris, 10/22: banking-partner logos are deliberate) · dark "Not vibe-coded" code counter, lines of code from the platform Daily Dev Digest, hand-updated) → case studies (dark; a huge WHITE "Upgrade your business" button under the guarantee line, cta=home-cta, 10/22) → videos → FAQ.

## Design System

- Fonts: DM Sans (display) + Space Mono (monospace — the hero of every dollar/number moment)
- Colors: `--green-deep` (#1b4332) through `--green-ghost` (#f0faf4), slate palette. **Design tokens only — never hardcoded hex.**
- Shadows: green-tinted. Whitespace = confidence — let numbers breathe. **One dark (`--green-deep`) section per page, max**, reserved for the emotional peak.
- `/shelfiq-widget.js` (file name kept) is included on ALL pages as last script. It holds two blocks: first-touch attribution (`ss-session-touch`, read by /contact — keep it) and the nav-dropdown JS. The Chelsea chat widget was removed 10/27/2026 (Chris: 0 real leads in 8 days, the button got in the way); visitors reach Chelsea by the header "Call now" link.
- **CTA labels (10/27/2026, Chris):** the header nav button reads **"Schedule a Demo"** on every page (`NAV_LABEL` in `scripts/cta-lib.mjs`, also in `scripts/build-tutorials.mjs`), and the homepage hero (`home-hero`) reads "Schedule a Demo" (was "Get Paid"). In-page buttons elsewhere keep "Schedule a call". This supersedes the nav/hero lines in § Consult-first CTAs.
- **Page style (10/27/2026, Chris: "this new style is dope… the style of new pages moving forward").** Every new or rebuilt page uses it. Reference code — copy, don't reinvent — is the `<style>` just before `<!-- FOOTER -->` in `index.html` (`HOMEPAGE HERO v2`, `HOMEPAGE SECTION SEAMS`), `about.html` (`ABOUT v2`, CTA on a dark hero) and `pricing.html` (`PRICING v2`, CTA on a light hero). (1) **Hero CTA:** glossy gradient, label left + arrow in a 48px chip right (44px on phones), 18px radius, 60–64px tall, a white sheen sweep every 4.5s; dark button + mint chip on light heroes, mint button + dark chip on dark heroes. It replaces the old pulse ring (screenshots as a "double outline"). Labels stay script-owned (`cta:sweep`). (2) **Secondary action:** a quiet text row (play circle + text), never a second bordered pill. (3) **Phone hero:** left-aligned, 42–60px headline, tight tracking, ~18px lede, full-width CTA. (4) **Light heroes:** mint radial mesh, not flat white. (5) **Product visual:** dark card with solid-tint ghost cards stacked behind it (opacity ghosts go gray) + a white event toast that pops on the state change; "Illustration with example numbers". (6) **Trust signal:** swap it into an existing slot (e.g. the eyebrow pill = live `[data-paid-count]` total). Never stack another line; the hero must not get busy. (7) **Seams:** dark blocks are rounded panels (40px / 28px on phones), inset `calc(100% - 48px|40px)` or overlapping their neighbour with a negative margin; slate sections fade white→slate→white; FAQ white; footer top rounded; no hard color lines. Verify at 1440/1280/768/390/320.
- Phones (10/22/2026): the sitewide phone rules live in the `PHONE LAYER` block at the end of `styles.css` (8px scale: 20px gutters, 64px sections, full-width hero buttons, 44px tap targets, solid header, two-column footer, chat button hidden until the first screen is scrolled past). A page's own phone rules go in a `<style>` just before its footer, so they come after the page's other style blocks. Prefix them `html body` to beat the page's own rules (and `.page-hero.page-hero` to beat `hero-motion.css`). Fence: `npm run check:phone`, which fails when a link, button or field on a header-nav page runs past the screen edge at 320/375/390/430px with every `<details>` opened. Sections clip sideways overflow, so `scrollWidth` alone never catches this.
- **No Apollo** — the Apollo.io tracker was removed sitewide 10/06/2026 (Chris: "rip apollo out"). Never re-add it; Google Analytics (`G-H2LBJT03WE`) is the only tracker on every page.
- fi ligature fix: `font-variant-ligatures: none` when "Shelf" and "iQ" span split

## Nav (all pages)

For brands ▾ | For dispensaries ▾ | Features ▾ | About | Pricing | Login | **CTA**

- **Audience labels (10/22/2026, Chris):** the two product toggles read **"For brands"** (→ `/accounts-receivable`, ShelfCollect menu) and **"For dispensaries"** (→ `/accounts-payable`, ShelfPay menu), matching the homepage toggle. **One outward brand (10/29/2026):** the retired product names ShelfPay and ShelfCollect appear on NO served page or in `llms.txt` (menus read "ShelfSpace overview" / "Accounts payable overview"; say "ShelfSpace AR" or "ShelfSpace accounts payable"). `check:forbidden` Scan E enforces it; only `terms.html`, `privacy.html` (legal) and `quote.html` (noindex, code comments) are exempt.

- **Features ▾ (10/18/2026, Chris):** replaced the standalone "ShelfVerify" link. Toggle → `/features`; menu = ShelfVerify (`/shelfverify`) · Connect Your AI (`/connect-your-ai`) · Payments (`/payments`) · Integrations (`/integrations`). Toggle carries `active` on those five pages. Same markup on every page + `scripts/build-tutorials.mjs`. (The "Platform ▾" notes below are historical — that dropdown is no longer in the nav.)

- **2026-10-02 (Chris):** Consignment and Credit Recovery are NOT top-nav items — they're part of ShelfPay, linked from the "Included for dispensaries" section on `/accounts-payable` (and still in the footer). Don't re-add them to the nav.

- **`/payments` (10/18/2026, Chris):** the unified payments page — e-check, mailed paper check, ACH bank transfer (**live** since 10/28/2026, Chris: "ACH is live"; never say "rolling out" or "coming soon" about ACH, `check:forbidden` scan D enforces it; state no fees, timelines or limits beyond what the page already says). Pitch = paying and getting paid is effortless; every visual is a REAL screenshot (demo sandbox / stubbed pay page) in `screenshots/payments/`. Plaid and the banking partners may be named (Chris, 10/29/2026). Linked from Features ▾ "Payments" and footer Services "Payments".
- **Footer (10/18/2026, Chris — "wonky"; brand-only since 10/27/2026):** ONE canonical footer on every page and in `scripts/build-tutorials.mjs`: four columns — **Services** (Accounts Receivable, Collections, Payment Plans, AI Calls) · **Platform** (Features, Payments, Integrations, Connect Your AI) · **Resources** (Pricing, Blog, Docs, Guides, Tutorials) · **Company** (About, For Vendors, For Bookkeepers, Contact, Support, Login, LinkedIn). 10/27 (Chris): links to dispensary pages (ShelfPay (AP), ShelfVerify, Consignment, Credit Recovery, ShelfiQ, Vendor Management, How It Works) were cut; the pages stay up, unlinked from the footer. Keep columns ≤7 links. Adding a link = add it to EVERY page (it had drifted into 12 variants with a 13-link "Platform" column). Check: all `footer-col` blocks must be byte-identical sitewide. **Chelsea's phone (10/23/2026, Chris):** every footer-brand block ends with `<p class="footer-phone">Questions? Call Chelsea, our AI assistant: <a href="tel:+16162714585">(616) 271-4585</a></p>` (the MI line; styles in `styles.css`), also in `scripts/build-tutorials.mjs`; `/contact` carries a `.cx-phone` line under the form. **Header "Call now" (10/24/2026, Chris):** every page's nav also carries `<li class="nav-call">` (tel: link, "Call now" + the MI number) immediately before the CTA `<li>`, and a `.nav-call-bar` "Call" pill before the hamburger (phones only); both in `scripts/build-tutorials.mjs` too. Desktop ≤1240px shows the icon only. Styles: `styles.css` § Call now. Never in the hero.
- **Service labels (2026-09-28, Chris; nav toggles superseded 10/22 by the audience labels above, footer unchanged):** (SUPERSEDED 10/29/2026 by the one-brand rule above: no retired product names on any page.) The product name "Get Paid" is retired sitewide — use ShelfCollect (URL slugs like `/get-paid` stay).
- **Never remove an existing `.brand-ticker` logo strip** when rebuilding a page — Chris reverted exactly that on the ShelfCollect page (2026-09-28).

- **Order (2026-09-04, Chris):** the four service links, then **About**, then **Pricing**, then **Platform ▾** as the RIGHTMOST content item (before Login + the CTA button). "Pricing" sits immediately left of Platform.
- **Pricing** points at **`/pricing`** — the repurposed numberless "How We Work With You" page (URL kept for SEO). The label is **"Pricing"** (reverted from "How We Work" per Chris).
- **Platform ▾** dropdown (`<li class="nav-dropdown">`, primitive in styles.css) contains: Vendor Management (→ `/vendor-management`) · How It Works · Features · ShelfiQ · Check Payments · Collections · Tutorials · Guides. It is now the LAST content `<li>`. Desktop = CSS hover + `:focus-within` (no JS); mobile = inline accordion. To re-roll sitewide, anchor on the `<li><a href="/about">About</a></li>` → `<li><a href="/pricing"…>Pricing</a></li>` → `<li class="nav-dropdown">` adjacency (the footer's `/pricing` "Pricing" link is single-line and untouched by the nav-triple reorder).
- The primary **CTA** (→ `/contact?cta=<page>-nav`) and **Login** stay rightmost. The CTA label is **"Schedule a call"** on every page (D3; `npm run check:cta`).

## Marketing & Copy

When writing or rewriting ANY marketing page, read `marketing/landing-page-playbook.md` first — the full framework: 5-beat emotional arc, psychological triggers, visual design rules, copy rules, CTA rules, page structure template. Every page follows this playbook.

Key references:
- `marketing/landing-page-playbook.md` — the conversion playbook (5-beat arc, design rules, copy rules, consult-first CTAs, SEO rules)
- `marketing/case-studies.md` — case-study system (de-identification rules, blog template, homepage cards, SEO targets) — the names-free proof engine
- `marketing/docs-instructions.md` — writing rules for documentation pages (different from marketing pages)

## Case Study System

When the user drops an email chain, PDF, or describes a situation they want turned into a case study:
1. Read `marketing/case-studies.md` first — it has the full playbook
2. De-identify (no names, no round dollar amounts, no dates)
3. Create the blog post at `/blog/case-study-{slug}.html`
4. Add a card to the homepage case study section in `index.html`
5. Update sitemap.xml and llms.txt
6. Add a card to `blog.html` (see Blog System below)

## Blog System

### How it works
- `blog.html` — Blog landing page card grid; every post in `/blog/` MUST have a card
- `llms.txt` — AI-readable site reference; lists every blog article under "Blog Articles"
- `marketing/scripts/check-blog-sync.sh` — Detects orphans (filesystem ↔ blog.html ↔ llms.txt) and broken links

### When creating a new blog post
The `/blog-post` and `/case-study` skills handle the full rollout. Manual checklist if you bypass the skills:
1. Add a compact-row card to the matching category section's `.section-list` in `blog.html` (e.g., for an AP post: top of `<div class="section-list">` inside `<section class="blog-section" data-section-cat="AP">`). Set `data-rank="1"` and bump prior cards' ranks. Categories: `Collections` (brand-side: getting paid by dispensaries, state payment rules, templates — first section on the page), `AP`, `Case Study`, `Consignment`, `Credit Recovery`, `Vendor Management`. Small categories (Credit Recovery, Vendor Management) live in `<div class="blog-section-rest">` instead — all cards there carry `data-rank="99"`.
2. Optionally promote to the **featured slot** at the top of `blog.html` (replace the existing `.featured-card` body). The previous featured drops back to its category's section list.
3. Add a line to `llms.txt` under the "Blog Articles" section
4. Add a `<url>` to `sitemap.xml`
5. Run `marketing/scripts/check-blog-sync.sh` to verify

## Documentation System

### How it works
- `marketing/platform-map.md` — Feature map of the ShelfSpace platform (modules, files, tables)
- `marketing/docs-plan.md` — Which doc pages to write, URLs, keywords, source files
- `marketing/docs-instructions.md` — Full writing rules for doc pages (voice, SEO, template, CTA)
- `marketing/docs-manifest.json` — Maps each doc page to its platform source files + last synced date
- `marketing/scripts/check-docs-sync.sh` — Detects stale docs by comparing platform git changes to manifest

### When updating docs
1. Read `marketing/docs-manifest.json` to find which doc is stale
2. Read the platform source files listed in the manifest entry
3. Read the existing doc page
4. Update only what changed (preserve SEO juice)
5. Update `lastSynced` in docs-manifest.json
6. Update sitemap.xml lastmod date

### When creating new docs
1. Read `marketing/platform-map.md` for context
2. Read `marketing/docs-plan.md` for the planned page
3. Follow ALL rules in `marketing/docs-instructions.md`
4. Add entry to `docs-manifest.json`
5. Add entry to `sitemap.xml`
6. Add entry to the DOCS array in `/docs-search.js` (title, description, section, url, optional synonym keywords) and bump `?v=N` on every `<script src="/docs-search.js?v=N">` reference site-wide
7. **Link the new page from every sibling in the same `docs/<section>/` directory** — add it to each sibling's `<div class="docs-related-links">` block. The `/docs` section card routes to one article, not a section index; without sibling Related links the new page is invisible to anyone whose search-index cache is stale.
8. Bump the section-card article count and description on `docs/index.html`
9. Append a descriptive line under the matching section of `llms.txt`

## Repo Structure

```
/                     — HTML pages (index.html, about.html, etc.)
/blog/                — Blog articles
/docs/                — Documentation pages
/api/                 — Serverless functions (interest.js — the /contact fallback)
/logos/               — POS integration logos
/marketing/           — Internal marketing files (playbook, case-studies, docs-plan, etc.)
/styles.css           — Shared design system CSS
/shelfiq-widget.js    — Attribution + nav JS (included on all pages)
/docs-search.js       — Docs search (DOCS index + auto-mount; included on all /docs pages)
/llms.txt             — AI-readable site reference
/sitemap.xml          — All indexable URLs
/robots.txt           — Crawl rules
/vercel.json          — Vercel config (rewrites, redirects, headers)
```
