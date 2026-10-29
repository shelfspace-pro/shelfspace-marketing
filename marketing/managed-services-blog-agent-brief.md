# Agent brief — writing ONE blog post

You are writing ONE blog post for shelfspace.pro (static HTML) in this repo. Your post's slug,
keyword, angle and cross-links are in the prompt that pointed you here. Produce a finished,
visually rich HTML file that a cannabis operator would forward to a colleague. You run
unattended: never stop to ask; decide from this brief, the repo `CLAUDE.md` and
`marketing/seo-house-rules.md` (it wins where this brief is silent).

## Who it's for (brand-first)
The default reader is a cannabis **brand**: the cultivator, manufacturer or distributor whose
dispensary customers pay late or not at all. Write to them unless your prompt names a dispensary
audience. ShelfSpace gets brands paid: invoices sent, reminders, payment plans, final notices and AI
calls, in the brand's own name, so the store relationship stays intact. Dispensary posts (AP,
consignment, credit recovery) still exist; write one only when your prompt asks.

## Boilerplate — copy VERBATIM, don't redesign
Read `blog/how-to-get-paid-by-dispensaries.html` (the 10/27/2026 reference post). Copy these parts
into your new file unchanged: the whole `<head>` apart from the per-post fields below (keep the
`<style>` blocks, the gtag scripts and the Speed Insights tags), the `<nav>`, the
`<!-- CTA -->` section wrapper, the `<footer>`, and the trailing `<script>` tags. Keep the same
section order.

Change per post ONLY: `<title>`, the meta description (name, og and twitter: identical text),
canonical URL, the JSON-LD blocks, the hero (`section-label` / `h1` / `section-desc`), the At a
glance card, the `article-body`, the FAQ `<details>`, and the CTA headline + subhead. Keep the one
primary CTA button → `/contact`. Its label is script-owned: don't hand-edit it; the parent runs
`npm run cta:sweep` and `npm run check:cta`. No second /contact button.

## Voice (the current law)
- **Outcome first, done for you.** "We get brands paid." Managed-service framing is the point:
  "we send the reminders", "we make the calls". Lead with the money the reader gets back.
- **Naming.** One brand: ShelfSpace. The AR product is "ShelfSpace AR". The category is
  **cannabis collections software** or **cannabis accounts receivable software**. ShelfSpace is
  never called an agency of any kind; brands collect in their own name. For agency-intent
  keywords, link `/blog/cannabis-collections-agency-vs-software` instead of borrowing the word.
- **Verb split:** "we" for ShelfSpace and the done-for-you work; "the platform" for software
  actions; "you" for what the reader decides ("you approve the payment plan, we run it"). Never
  "ShelfSpace does X".
- **Payments:** ACH is live. When a post mentions how stores pay, link `/payments` and describe
  only what that page says. Never say ACH is coming. Banking partners may be named.
- Operator to operator, direct. Specific beats adjectives; loss framing beats gain framing. Short
  paragraphs. Dates in visible copy are MM/DD/YYYY.

## Price and trial: none in a post
A blog post never carries a price, a tier, a plan, a subscription, a per-invoice fee or trial
copy. Those live only inside `<!-- trial-ok:start -->` … `<!-- trial-ok:end -->` regions on the
pages `check:forbidden` allows (today the brand side of `/accounts-receivable` and `/pricing`).
When the reader would want to know about starting, link `/accounts-receivable` in the prose and
let that page say it. The CTA stays the consult.

## Numbers: no fabricated figures
- Every `$`, `%` and count in the body, the At a glance card, the visuals and the FAQ must be in
  `marketing/seo-claims.json` (the public registry of figures already published, with sources),
  or come from a primary source you cite inline with a link. If you add a sourced figure, list it
  in your reply so the parent adds it to the registry. Can't source it? Cut it.
- **Every number in a visual also appears in the body prose.**
- Worked examples may use example amounts if the copy says they are an example ("say a $7,200
  invoice"). Never present an example as a customer result.
- No customer names. Proof is the anonymized case studies (`blog/case-study-*.html`); link them,
  and use only figures those pages already publish.
- Anything state-specific (payment rules, terms limits, license rules) cites the statute,
  regulation or regulator page. A template carries "Not legal advice. Have your counsel review it."

## Forbidden — grep your finished file; every one must be absent
<!-- forbidden-list:start -->
`ShelfCollect` and `ShelfPay` (retired public names: say ShelfSpace / ShelfSpace AR),
`collections agency` used about ShelfSpace, `automate` / `automated` / `automatically` in the hero
or headings, `scan-based trading`, `SBT`, `Diem`, `pilot`, `free trial`, `30-day`, `trial`,
`subscription`, `cancel anytime`, `per location`, any plan or tier price, ACH "coming soon" /
"rolling out", `<br>` inside an `h1` / `h2` / `h3`, a headline
ending in `?`, "learn more" as a link or button. Avoid AI-residue cadence: "this isn't just X,
it's Y", "not just A but B", em-dash pile-ups.
<!-- forbidden-list:end -->

## Required structure
- **head**: unique `<title>` ≤ 60 characters with the primary keyword; unique meta description
  ≤ 160 characters, written as a direct answer; canonical `https://shelfspace.pro/blog/{slug}`;
  OG + Twitter tags (copy the reference post's image tags); three `application/ld+json` blocks:
  **Article** (headline, description, author Chris Mitchem, publisher ShelfSpace, `datePublished`
  and `dateModified` = today in ISO `YYYY-MM-DD`, url, image), **BreadcrumbList** (Home → Blog →
  title) and **FAQPage** (every FAQ question and answer, text matching the visible answers
  verbatim; `check:seo` enforces it).
- **page-hero**: `section-label` (2–3 words), `h1 class="section-title"` holding the primary
  keyword naturally, `section-desc` outcome subhead.
- **At a glance**: `<div class="article-glance"><h2>At a glance</h2><ul>` with 4–6 `<li>`.
- **article-body** (`<div class="article-body reveal">`): 1,600–2,400 words on the 5-beat arc:
  recognition pain → the real cost → what "handled" looks like → how it runs (we do it, you
  approve) → who it's for + a soft close. Open each `<h2>` section with a 40–60 word answer an AI
  answer can lift on its own. Cross-link 2–4 of the related posts named in your prompt inline
  (`<a href="/blog/{slug}">`, or `/{page}` for site pages), plus the brand hub
  `/blog/how-to-get-paid-by-dispensaries` when the post is about getting paid. End with a
  `<blockquote>` that lands the thesis. Include 2–4 visuals from the kit below.
- **FAQ**: `<section style="max-width: 720px; margin: 0 auto; padding: 0 48px 60px;">` →
  `<h2 …>Frequently asked questions</h2>` → `<div class="faq-list">` with 3–5
  `<details><summary>Q</summary><p>A</p></details>`. The FAQPage JSON-LD mirrors them exactly.
- **CTA + footer**: boilerplate.

## Visual kit — copy the markup; the classes already exist (in `styles.css` or the reference post's `<style>`, which you copy whole), so add no CSS for them

stat-trio (3 big numbers; drop `is-loss` on positive items):
```html
<div class="stat-trio reveal">
  <div class="stat-trio-item is-loss">
    <svg class="stat-trio-ico" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    <p class="stat-trio-num">{a figure from seo-claims.json}</p>
    <p class="stat-trio-label">short label that reads as a sentence fragment</p>
  </div>
  <!-- 2 more stat-trio-item -->
</div>
```

vs-split (before/after: negative column, then positive column):
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

meter (a proportion: green fill + hatched loss tail; fill + loss sum to 100%):
```html
<div class="meter reveal">
  <div class="meter-head"><p class="meter-head-label">…</p><p class="meter-head-val">…</p></div>
  <div class="meter-track"><div class="meter-fill" style="--fill:70%"></div><div class="meter-loss" style="--loss:30%"></div></div>
  <p class="meter-cap">…</p>
</div>
```

compare-table (3 columns: capability | them | ShelfSpace; use `<span class="compare-check">&#10003;</span>`,
`<span class="compare-x">&#10007;</span>`, `<span class="compare-plus">note</span>`). Wrap it in
`<div style="max-width: 720px; margin: 0 auto; padding: 0 48px;" class="reveal">`. A competitor
fact carries its source link and "as of MM/DD/YYYY"; ShelfSpace's side uses only capabilities this
site already describes, and a price row reads "Quoted after a free review".

## Output rules
Create ONLY `blog/{slug}.html`. Don't edit `blog.html`, `llms.txt`, `sitemap.xml` or any other
file; don't run git or commit. Reply with exactly: the slug; the final `<title>`; the meta
description; a ≤ 170-character card summary for `blog.html`; the category (`Collections` for brand
posts); the cross-link slugs you used; and every figure you used with its source (registry entry
or cited URL).
