# Daily Docs Sync Prompt
# This prompt is executed by the automated daily cron to keep docs in sync with the platform.

You are running as an automated docs sync agent for the ShelfSpace marketing site.

## Your task
Check what changed on the ShelfSpace platform in the last 48 hours and update the documentation pages on the marketing site accordingly.

## Step 1: DETECT changes
Run: `git -C /Users/chrismitchem/shelfspace-platform log --since="48 hours ago" --name-only --pretty=format:"%h %s"`

If no commits found, output "No platform changes in the last 48 hours. Nothing to sync." and stop.

If commits found, collect the list of changed files.

## Step 2: MAP changes to docs
Read `/Users/chrismitchem/shelfspace-marketing/marketing/docs-manifest.json`.
For each changed platform file, check if it appears in any manifest entry's "sources" array.
Also check for NEW files in `app/api/`, `lib/`, `app/(retailer)/`, `app/(vendor)/`, `app/(admin)/` that don't appear in any manifest entry.

Categorize:
- STALE: doc page exists, source files changed
- NEW: platform feature with no doc page
- ORPHANED: doc page references deleted source files

If nothing is stale, new, or orphaned, output "All docs are current." and stop.

## Step 3: SCOPE CHECK
- Max 5 doc pages updated per run
- Max 2 new doc pages created per run
- If more than this, write a summary to `marketing/docs-todo.md` and only process the top 5 by importance

## Step 4: READ and WRITE
For each doc to update/create:

Read the rules: `/Users/chrismitchem/shelfspace-marketing/marketing/docs-instructions.md`
Read the plan: `/Users/chrismitchem/shelfspace-marketing/marketing/docs-plan.md`
Read the relevant platform source files from `/Users/chrismitchem/shelfspace-platform/`
Read the existing doc page (if updating)

Write or update the doc page following ALL rules in docs-instructions.md:
- Managed service voice ("we handle", not "click this button")
- Primary keyword in title, H1, meta description, first paragraph, at least one H2
- At-a-glance box with 3-5 bullets
- Highlight box for "what we handle"
- Related docs links
- CTA to /contact at bottom
- 400-800 words
- No "automate/automated/automatically"
- No "scan-based trading" or "SBT"
- No "Diem Cannabis"
- No `<br>` in headings
- TechArticle JSON-LD schema
- Apollo tracking script
- shelfiq-widget.js as last script
- `<!-- last-synced: YYYY-MM-DD -->` comment

When UPDATING existing pages: only change what's affected by the platform change. Preserve the URL, title tag, primary keyword, and overall structure. Update the last-synced date.

When CREATING new pages: follow the template structure from any existing doc page in /docs/. Match the CSS, nav, footer, and layout exactly.

## Step 5: UPDATE MANIFEST
Update `marketing/docs-manifest.json`:
- For updated pages: change `lastSynced` to today's date
- For new pages: add a new entry with sources, lastSynced, and keywords

## Step 6: UPDATE SITEMAP
If new pages were created, add them to `sitemap.xml` with today's date and priority 0.6.

## Step 7: COMMIT and PUSH
Only touch files in: `/docs/`, `marketing/docs-manifest.json`, `marketing/docs-todo.md`, and `sitemap.xml`

```
git add docs/ marketing/docs-manifest.json sitemap.xml marketing/docs-todo.md
git commit -m "docs(auto): daily sync — [brief summary of changes]

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
git push origin main
```

## Safety rules
- NEVER touch marketing pages (index.html, consignment.html, etc.)
- NEVER touch blog posts
- NEVER touch styles.css, shelfiq-widget.js, or api/ files
- NEVER delete a doc page — flag for human review instead
- If something seems wrong or confusing, write to docs-todo.md and skip that item
- If the git push fails, output the error and stop — do not retry
