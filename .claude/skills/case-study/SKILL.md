---
name: case-study
description: Convert a customer situation, email chain, or PDF into a published case study. Handles de-identification (no real names, no round dollar amounts, no specific dates), format choice (full blog post · homepage card · both), schema, sitemap, and homepage placement. Use when the user drops raw customer material and wants it turned into marketing content.
---

# /case-study — turn customer material into a case study

ultrathink

Source material from $ARGUMENTS (or the user's most recent message). Typical inputs: an email chain, a PDF, a Slack screenshot, a verbal description.

# Step 1 — Read the case-study playbook

Open `marketing/case-studies.md` in full. It covers:
- De-identification rules (no real names, no round dollar amounts, no specific dates)
- Blog post template (setup → problem → resolution → result → quote → CTA)
- Homepage card format
- SEO targets

Also read `CLAUDE.md` for voice rules.

# Step 2 — Extract the story

From the source material, pull:
- The setup: what the dispensary was doing before
- The problem: what specific issue surfaced
- The resolution: what ShelfSpace did about it
- The result: a concrete number (de-identified — round to non-round figures, e.g., $1,847 not $2,000)
- A quote (de-identified — operator type, not name)

If any of these is missing or weak, ASK the user before writing. A case study without a concrete number is not a case study — it's an anecdote.

# Step 3 — De-identify

Run the source through the rules in `marketing/case-studies.md`. Replace:
- Names → role descriptors ("the buyer", "the AP person", "the owner")
- Specific dollar amounts → reasonable de-identified figures (keep order of magnitude; pick odd numbers like $1,847 not $2,000)
- Dates → relative ("Q1", "earlier this year", or month-year only if needed)
- Region details only if they don't identify a small operator (Massachusetts dispensary chain is fine; "the Beverly store" is not)

# Step 4 — Pick format

- **Full blog post (~1,200-1,800 words)**: default for stories with narrative arc, named numbers, and a quotable moment
- **Homepage card only**: short, single-stat stories ($X recovered from Y) — no narrative needed
- **Both**: big findings worth featuring (e.g., $500K extracted at a multi-store chain)

For "blog post" or "both," continue at Step 5. For "homepage card only," skip to Step 6.

# Step 5 — Build the blog post

Invoke `/blog-post` with `type=case-study`. Use the slug pattern `blog/case-study-{descriptor}.html` (e.g., `case-study-return-credit`). All Step 3-7 work in `/blog-post` applies — voice check, schema, sitemap, llms.txt, **blog.html card (always `data-category="Case Study"` for case studies)**, cross-links, commit.

# Step 6 — Homepage card

Per `marketing/case-studies.md`, add a card in `index.html`'s case study section. Format:
- Category label (CREDIT RECOVERY · AP · CONSIGNMENT · OPERATIONS)
- Big number (Space Mono, green-deep)
- One-line description
- Link to the full blog post (if it exists; otherwise no link)

# Step 7 — Audit + commit + push

Invoke `/audit` against the modified files. Fix Critical and Real issues. Commit:
```
feat: case study — {short title}
```

End with the live URL and where the homepage card now appears.
