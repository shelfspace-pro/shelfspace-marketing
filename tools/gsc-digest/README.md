# Weekly Search Console digest

Emails a Google Search Console performance summary every Monday — headline
totals (clicks / impressions / CTR / avg position) with week-over-week deltas,
top pages, biggest movers, and top queries.

**Why it's built this way:** the only external dependency is the Search Console
API itself — the same data you already see in the GSC web UI. No Looker Studio,
no SendGrid/Mailchimp. It runs as a GitHub Action in this repo and sends through
your own Gmail. If you stop using it, you delete one workflow file.

```
tools/gsc-digest/digest.mjs   the script
tools/gsc-digest/package.json deps (google-auth-library, nodemailer)
.github/workflows/gsc-digest.yml   weekly cron + manual trigger
```

---

## One-time setup (~12 min, you do this once)

You need two credentials I can't create for you. Both go into GitHub repo
**Secrets** at the end.

### 1. Service account that can read Search Console (~8 min)

1. Go to <https://console.cloud.google.com/projectcreate>, create a project
   (e.g. `shelfspace-reporting`). Or reuse an existing one.
2. Enable the API: <https://console.cloud.google.com/apis/library/searchconsole.googleapis.com>
   → **Enable** (make sure the right project is selected, top bar).
3. Create the service account:
   <https://console.cloud.google.com/iam-admin/serviceaccounts> → **Create
   service account**. Name it `gsc-digest`, click **Done** (no roles needed —
   access is granted inside Search Console, not via IAM).
4. Open the new service account → **Keys** tab → **Add key → Create new key →
   JSON**. A `.json` file downloads. Keep it handy; you'll paste its contents
   into a secret. Note the `client_email` inside it
   (`gsc-digest@…iam.gserviceaccount.com`).
5. Grant it access to the property: open
   <https://search.google.com/search-console> → pick the shelfspace.pro
   property → **Settings → Users and permissions → Add user** → paste the
   service account's `client_email` → permission **Full** (or Restricted; read
   is all that's used) → **Add**.

> **Which property string?** This repo verifies GSC with an HTML file
> (`google95aeea17e1b5e7b3.html`), so you have a **URL-prefix** property —
> the default `GSC_SITE_URL` of `https://shelfspace.pro/` is correct. If you
> *also* set up a **Domain** property (DNS TXT verified), use
> `sc-domain:shelfspace.pro` instead and set the `GSC_SITE_URL` repo variable
> (step below). The string must match a property exactly or the API returns 403.

### 2. Gmail app password (~2 min)

Requires 2-Step Verification on the Google account.

1. <https://myaccount.google.com/apppasswords>
2. Name it `gsc-digest`, **Create**. Copy the 16-character password (spaces are
   fine — the script strips them).

### 3. Add the secrets to GitHub (~2 min)

Repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value |
| --- | --- |
| `GCP_SA_KEY` | the **entire** contents of the service-account JSON file |
| `GMAIL_USER` | the Gmail address sending the digest |
| `GMAIL_APP_PASSWORD` | the 16-char app password from step 2 |
| `DIGEST_TO` | recipient(s), comma-separated. Optional — defaults to `GMAIL_USER` |

Optional, only if you use a Domain property — same screen, **Variables** tab →
**New repository variable**: `GSC_SITE_URL` = `sc-domain:shelfspace.pro`.

---

## Test it

Repo → **Actions → GSC Weekly Digest → Run workflow**. It runs immediately and
emails you. Check the run logs if nothing arrives — a 403 means the service
account isn't added to the property (step 1.5) or `GSC_SITE_URL` doesn't match.

Run locally instead (needs the secrets exported in your shell):

```sh
cd tools/gsc-digest && npm install
DRY_RUN=1 node digest.mjs   # prints the email HTML, sends nothing
node digest.mjs             # actually sends
```

## Change the schedule

Edit the `cron` line in `.github/workflows/gsc-digest.yml` (it's UTC).
`0 14 * * 1` = Mondays 14:00 UTC. The reporting window ends ~3 days before the
run to clear GSC's data lag; change `GSC_LAG_DAYS` to adjust.
