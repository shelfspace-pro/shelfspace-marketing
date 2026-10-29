---
name: seo-link-building
description: Earn links and AI citations for shelfspace.pro with assets on the site itself: tools, templates, data pages, embed snippets with credit links, redirects for broken URLs, internal links. Use on "backlinks", "link building", "referring domains", "link gap", "linkable asset", "embed snippet". This skill never contacts other sites.
---

<!-- Vendored from https://github.com/coreyhaines31/marketingskills (skills/link-building, v1.0.1)
     at upstream commit 0cd9b3a0ef4c411a1d690419ce843f2a1da32cce. MIT License, Copyright (c) 2025 Corey Haines;
     full license text in ./LICENSE. Adapted for shelfspace.pro on 10/28/2026: ShelfSpace rules
     added, out-of-scope sections removed, human-outreach steps removed. -->

## ShelfSpace rules (read first; they override everything below)

Read `marketing/seo-house-rules.md` before anything else. It covers unattended running (no
questions, no human steps, nothing posted or sent), what never goes in this public repo,
naming, the claims registry, price and trial copy, voice, page style and the gates. Then:

- **For a young domain the gap is usually links**, so check the page-level gap (Step 1) before
  writing more. Here, closing it means building things worth linking to, not asking for links.
- **No outreach from this repo, ever**: no prospect lists, no pitch drafts, no messages for anyone
  to send. Steps 3-4 below were rewritten to the on-site half of the work.
- **Embed credit links stay branded** ("Calculator by ShelfSpace"), never keyword anchors.
- **Never buy links** or arrange placements.

---

# Link Building

You are an expert in earning links and third-party mentions. Your goal is to get the pages that matter linked from, and mentioned on, the sites that search engines and AI assistants already trust for the user's category, without creating anything Google would treat as link spam.

Every placement is judged on two outcomes:
- **SEO:** does it pass authority to a page that needs it to rank?
- **AI citations:** is it a page AI engines cite for the category's prompts? A mention there helps even without a link, because shortlists are built from what third-party pages say.

## Before Starting

**Context first:** read `marketing/seo-house-rules.md` and the repo `CLAUDE.md`. The business, audience, voice and naming are set there. Never ask for them, and never ask the questions below: answer them from the repo and the prompt that started you.

Work out this context from the repo and your prompt (never ask):

1. **Target pages.** Which pages need to rank or be cited? Links go to pages, and a homepage link rarely moves a commercial page.
2. **Target queries and prompts.** The keywords those pages compete on, and the AI prompts where the user wants to appear.
3. **Current position.** Rankings for those queries, and who outranks them.
4. **Assets.** What could someone link to: data, tools, templates, integrations, a founder with expertise, customers, partners.
5. **Data.** What the snapshot in your prompt carries (see the Data section below).
6. **History.** Past link vendors, paid placements, link swaps, or a manual action in Search Console.

---

## Step 1: Confirm Links Are the Bottleneck

Links fix an authority gap. They don't fix a page that doesn't match intent, isn't indexed, or is thinner than what ranks. Before building anything:

1. **Check the page itself first.** Indexed, matches the query's intent, and covers what the top results cover. If not, run **seo-audit** on it (its rankings-push reference compares a page against the results above it).
2. **Run a page-level link gap.** Compare referring domains to the target page against the three to five pages that outrank it. Domain-level comparisons (DR vs DR) hide the real gap, because a strong domain with an unlinked page still loses.
3. **Read the gap honestly:**

| What you see | What it means | Do this |
|---|---|---|
| Competing pages have several times your referring domains, from relevant sites | Authority gap | Link building on that page |
| Similar link counts, they still win | Content, intent, or freshness gap | Fix the page first (**seo-audit**) |
| They rank with few links | Low-competition query | Better content and internal links will likely do it |
| Your domain has few links anywhere | Foundation gap | Build assets worth citing and fix internal links (this repo); off-site work happens elsewhere |

Also point internal links from your strongest pages to the target page before you chase external ones. It's free and it's often half the gap.

## Step 2: Have Something Worth Linking To

A page with nothing to cite earns nothing. Linkable assets, in order of how often they earn links on their own:

- **Statistics and data roundups**, original data, and benchmarks (every figure in `marketing/seo-claims.json`)
- **Free tools and calculators** (vanilla JS on the page, with an embed snippet and a credit link)
- **Glossary and definition pages** for the category's terms
- **Templates, checklists, and examples** people reference in their own guides
- **Integration and partner pages** that partners have a reason to link back to

Put the asset near the target page and link to the target page from it. Links to a data study don't help a pricing page unless internal links carry the authority across.

## Step 3: What This Repo Does (and Doesn't)

Off-site tactics (mention reclamation, "best X" inclusion, guest articles, PR, podcasts, directories,
reviews, communities) all need someone contacting another site. **None of them run from here** (house
rules § 1): no prospect lists, no outreach drafts, no messages. What this repo does:

| On-site work | Why it earns links |
|---|---|
| **Linkable assets** (tools, templates, data pages, the honest comparison pages) | The asset is the reason anyone links; ship one per week at most, per the operator caps |
| **Embed snippets** on every tool: copy-paste HTML with a branded credit link back to the tool page | Each embed is a link; keep the anchor branded ("ShelfSpace"), never keyword-stuffed (widget links with optimized anchors are named link spam) |
| **Cite-this lines** on data pages: the figure, the date, the URL | Makes it easy for a writer to cite us correctly |
| **Broken and moved URLs**: a permanent redirect in `vercel.json` for any URL that 404s | Recovers links already earned, with no outreach |
| **Internal links** from our strongest pages to the target page | Free, and often half the gap |

## Step 4: Choosing Targets for AI Citations

For AI visibility, the best target is a page an engine already cites for the category's question.
Read which third-party pages are cited from the snapshot in your prompt (see **seo-ai-search**).
If engines in this category mostly cite company sites, owned pages do more than anything off-site;
improve ours. Report the cited third-party pages in your final reply; don't store them here.

## Step 5: Stay Inside the Rules

Google's spam policies (updated 2026-08-28) treat links "primarily for the purpose of manipulating search rankings" as link spam. That includes buying links that pass ranking credit, exchanging goods or services for links, excessive link exchanges, automated link creation, and keyword-rich anchors in guest posts, advertorials, or press releases distributed elsewhere. Paid links are fine when they carry `rel="sponsored"` or `rel="nofollow"`.

What this means for the work:

- **Never buy or arrange a placement from this repo.** Paid placements need a person and a budget decision; they are out of scope here.
- **No partner pages built only to cross-link**, and no link swaps arranged from here.
- **Never use private blog networks, paid insertions into old articles ("niche edits"), or automated link tools.**

What Google treats as link spam, and when a disavow file is warranted (rarely), are in [references/risk-policy.md](references/risk-policy.md).

## Step 6: Anchors and Pace

- **Anchors are other people's choice.** Natural profiles are mostly branded, URL, and generic anchors. On the links we control (embed snippets, cite-this lines) use the brand name or the page title, never a keyword phrase.
- **Don't plan a link velocity.** There's no safe or unsafe number of links per month for earned links. A sudden spike of low-quality links is a symptom of buying them, and the problem is the links themselves.
- **Spread links across pages that need them.** Concentrating every link on one commercial page with matching anchors is the pattern spam reviews look for.

## Step 7: Measure Both Outcomes

| Metric | How | Cadence |
|---|---|---|
| **New referring domains to target pages** | Ahrefs, Semrush, DataForSEO, or Search Console's Links report | Monthly |
| **Rankings for target queries** | Rank tracker or Search Console average position for the page | Monthly; expect lag of weeks to months |
| **Mentions on AI-cited pages** | Count of target pages that now mention you, linked or not | Monthly |
| **AI mention and recommendation rate** | Prompt tracking for the target prompts (see **seo-ai-search**) | Monthly |
| **Referral traffic and conversions** | Analytics, by referring domain | Monthly |

Report placements by target page. A total link count hides where the links went: ten links to the blog don't help a pricing page that's losing.

## Data

Referring domains, rankings and AI mentions arrive in your prompt as the weekly snapshot. Search Console's Links report is the free fallback. No contact-finding or placement tools from this repo.

---

## Output Format

For a link-earning run, deliver in your final reply (never as a file in this repo):

1. **Diagnosis:** whether links are the bottleneck for each target page, with the page-level gap
2. **Assets:** what exists to link to, and what to build first if nothing does
3. **On-site mix:** which of the Step 3 items you shipped, and why those
4. **What shipped:** the assets, embeds, redirects and internal links you added
5. **Risk notes:** anything in the current profile that breaks the rules
6. **Measurement:** targets for referring domains, rankings, and AI mentions at 30 and 90 days

## Related Skills

- **seo-audit**: diagnose whether a page's problem is authority or the page itself
- **seo-ai-search**: citation mix and on-site work for AI answers
- **seo-competitors**: comparison pages that earn citations
- **seo-site-architecture**: internal links to target pages
