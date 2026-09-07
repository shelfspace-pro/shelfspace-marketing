# Agent brief — writing ONE managed-services blog post

You are writing ONE blog post for the ShelfSpace cannabis marketing site (static HTML) at
`~/shelfspace-marketing`. Your specific post (slug, keyword, angle, cross-links) is in the prompt
that pointed you here. Produce a finished, high-effort, visually-rich HTML file. Real effort — this
must not read like filler.

## Boilerplate — copy VERBATIM, do not redesign
Read `~/shelfspace-marketing/blog/outsourced-cannabis-back-office.html`. Copy these parts into your
new file **unchanged**: the entire `<style>` block, the `gtag` + Apollo `<script>` tags, the whole
`<nav>`, the `<!-- CTA -->` section wrapper, the `<footer>`, and the two trailing `<script>` blocks
(the IIFE + `/shelfiq-widget.js`). Structure your file in the same order as that file.

Change per post ONLY: `<title>`, meta description (og/twitter/name — all identical text), canonical
URL, the 3 JSON-LD blocks, the hero (section-label / h1 / section-desc), the At-a-glance card, the
`article-body` content, the FAQ `<details>` list, and the CTA headline + subhead. Keep the primary
CTA button → `/contact` (label "Get My Free Money-Review" or a fitting first-person variant) and the
secondary "Talk to us" → `/contact`.

## Voice (the current law — 2026-09-04 overhaul)
- Sell the OUTCOME, delivery-model-agnostic. Managed-service framing is ALLOWED and encouraged: "we
  run your AP/AR", "done for you", "hands-off". ShelfSpace is an AI-driven managed-services money
  rail for cannabis retailer↔vendor money (AP, AR/collections, consignment settlements, vendor
  credit recovery, Check 21 payments), sold to DISPLACE the manual AP/bookkeeping firm operators
  already pay. **Never put a dollar price, tier, subscription, or trial on the page.**
- Verb split: "we" for ShelfSpace + managed delivery; "the platform" / "ShelfiQ" for software
  actions; "you" for operator actions. Outcome voice in the hero ("your vendors get paid"). Never
  write "ShelfSpace does X" — pick "we" or "the platform".
- Operator-to-operator, direct. Specific numbers beat adjectives. Loss framing beats gain framing.
  Short paragraphs. **Every number that appears in a visual MUST also appear in the body prose** —
  no fabricated figures. Reuse the anchor figures the series already uses where they fit: 10–15
  hrs/week of back-office labor; $200K+/yr untracked credits at a multi-location operator; $8K–$25K
  a month in recoverable credits found at one Massachusetts client; collection agencies take a
  25%–50% contingency cut; the incumbent AP/bookkeeping firm bills a few thousand a month.

## Forbidden — grep your finished file, every one must be absent
`automate` / `automated` / `automatically` (anywhere — AI is the engine, never the pitch),
`scan-based trading`, `SBT`, `Diem`, `pilot`, `trial`, `60-day`, any public pricing
(`$999`/`$899`/`$799`/`$749`/`$499`, "subscription", "cancel anytime", "$X/location", "$20/artifact",
"free trial"), `<br>` inside an `h1`/`h2`/`h3`, a headline ending in `?` (no questions as
headlines), "learn more" as a CTA. Avoid AI-residue cadence: "this isn't just X — it's Y", "not
just A but B", em-dash pile-ups.

## Required structure
- **head**: unique `<title>` ≤60 chars incl. the primary keyword; unique `<meta name="description">`
  ≤160 chars written as a direct answer; canonical `https://shelfspace.pro/blog/{slug}`; OG +
  Twitter tags (image `https://shelfspace.pro/og-image-v7.png`, width 1200 height 630); three
  `application/ld+json` blocks — **Article** (headline, description, author Chris Mitchem, publisher
  ShelfSpace, `datePublished` "2026-09-07", url, image), **BreadcrumbList** (Home → Blog → title),
  **FAQPage** (every FAQ Q/A, text matching the visible answers verbatim).
- **page-hero**: `section-label` (2–3 words), `h1` `section-title` containing the primary keyword
  naturally, `section-desc` outcome subhead.
- **article-glance**: `<div class="article-glance"><h2>At a glance</h2><ul>…4–6 `<li>`…</ul></div>`.
- **article-body** (`<div class="article-body reveal">`): 1,600–2,400 words, 5-beat arc (recognition
  pain → the real cost → what "handled" looks like → how it's delivered, software-or-done-for-you →
  who it's for + soft close). `<h2>` section heads. Cross-link 2–4 of the related posts named in
  your spec inline as `<a href="/blog/{slug}">…</a>` (or `/{page}` for site pages). End with a
  `<blockquote>` that lands the thesis. Include 2–4 visuals from the kit below.
- **FAQ**: `<section style="max-width: 720px; margin: 0 auto; padding: 0 48px 60px;">` → `<h2 …>Frequently
  asked questions</h2>` → `<div class="faq-list">` of 3–5 `<details><summary>Q</summary><p>A</p></details>`.
  The FAQPage JSON-LD must mirror these exactly.
- **CTA + footer**: boilerplate.

## Visual kit — copy the markup; the classes already exist in styles.css (do NOT add CSS for them)

stat-trio (3 big numbers; drop `is-loss` on positive items):
```html
<div class="stat-trio reveal">
  <div class="stat-trio-item is-loss">
    <svg class="stat-trio-ico" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    <p class="stat-trio-num">10&ndash;15 hrs</p>
    <p class="stat-trio-label">short label that reads as a sentence fragment</p>
  </div>
  <!-- 2 more stat-trio-item -->
</div>
```

vs-split (before/after — negative col then positive col):
```html
<div class="vs-split reveal">
  <div class="vs-col vs-neg">
    <div class="vs-head"><svg class="vs-ico" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><p class="vs-tag">The old way</p></div>
    <p class="vs-num">Every week</p>
    <p class="vs-text">…</p>
  </div>
  <div class="vs-col vs-pos">
    <div class="vs-head"><svg class="vs-ico" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><p class="vs-tag">Handled</p></div>
    <p class="vs-num">A few minutes</p>
    <p class="vs-text">…</p>
  </div>
</div>
```

flow-steps (numbered process):
```html
<div class="flow-steps reveal">
  <div class="flow-step"><div class="flow-step-num">1</div><div class="flow-step-body"><p class="flow-step-title">…</p><p class="flow-step-desc">…</p></div></div>
  <!-- more steps -->
</div>
```

blog-callout (one-line emphasis):
```html
<div class="blog-callout">
  <svg class="blog-callout-ico" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
  <p class="blog-callout-text">…</p>
</div>
```

meter (a proportion — green fill + hatched loss tail; fill+loss should sum to 100%):
```html
<div class="meter reveal">
  <div class="meter-head"><p class="meter-head-label">…</p><p class="meter-head-val">…</p></div>
  <div class="meter-track"><div class="meter-fill" style="--fill:70%"></div><div class="meter-loss" style="--loss:30%"></div></div>
  <p class="meter-cap">…</p>
</div>
```

compare-table (3 cols: capability | them | ShelfSpace; use `<span class="compare-check">&#10003;</span>`,
`<span class="compare-x">&#10007;</span>`, `<span class="compare-plus">note</span>`). Wrap in
`<div style="max-width: 720px; margin: 0 auto; padding: 0 48px;" class="reveal">`.

## Output rules
Create ONLY `~/shelfspace-marketing/blog/{slug}.html`. Do NOT edit `blog.html`, `llms.txt`,
`sitemap.xml`, or any other existing file. Do NOT run git, any check script, or commit anything.
When done, reply with exactly: the slug; the final `<title>`; the meta description; a ≤170-char
one-line card summary (for blog.html); the category; and the list of cross-link slugs you used.
