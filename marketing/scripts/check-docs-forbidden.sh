#!/usr/bin/env bash
# check-docs-forbidden.sh
# Content-integrity fence for the marketing site. Two independent scans, each
# scoped to keep zero false positives so the check stays trustworthy:
#
#   Scan A — customer docs (docs/, docs-search.js): trade-secret provider names
#            + the wrong login URL must never surface to a retailer/vendor.
#   Scan B — pricing-context pages ONLY: as of the 2026-09-04 overhaul the site
#            shows NO public pricing. The RETIRED subscription/trial model —
#            "30-day free trial / subscription / cancel anytime / $999–$749 per
#            location / $499+ vendor tiers / $20-per-artifact" — is forbidden.
#            Engagements are custom, consult-first. See CLAUDE.md
#            § Positioning & Voice and WEBSITE-OVERHAUL.md.
#            ONE carve-out (Z-33, 10/23/2026): the brand ShelfCollect 30-day
#            trial (a live product: no payment details to start, no contract,
#            no setup fee) may be NAMED, but only inside a
#            `<!-- trial-ok:start -->` … `<!-- trial-ok:end -->` region on a
#            file in TRIAL_OK_FILES — and on pricing.html (both personas) the
#            region's section must be `show-vendor`. Trial copy anywhere else
#            (every dispensary page, the retailer side of pricing) stays red.
#
# WHY Scan B is file-scoped: a bare `$749` / `subscription` grep would
# false-positive across blog content + illustrative worked-example dollar amounts.
# So the retired-pricing blocklist is checked ONLY in the pricing-context
# marketing pages listed in PRICING_FILES below. Never widen this to the whole
# repo or to blog/ or docs/. Tier-price patterns anchor on a literal `$` +
# word-boundary so "$1,250" (an example amount) can't trip them.
#
# EXPECTED STATE: GREEN. Any red is a regression (CI runs this on every push).
#
# Usage: bash marketing/scripts/check-docs-forbidden.sh   (exit 1 on any hit)

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT" || exit 1

HITS=0

# ---------------------------------------------------------------------------
# Scan A — customer docs: trade-secret provider names + wrong login URL.
# Deliberately TIGHT (no legitimate doc use → zero false positives).
# ---------------------------------------------------------------------------
# term|human-readable reason
DOCS_PATTERNS=(
  "straddle|trade-secret ACH provider name — describe as 'ACH bank transfer'"
  "checkflo|trade-secret check-print provider — describe as 'ShelfSpace mails the check'"
  "shelfspace\\.pro/login|wrong login URL — portal login is ourshelf.space/login"
)

for entry in "${DOCS_PATTERNS[@]}"; do
  term="${entry%%|*}"
  reason="${entry#*|}"
  # -I skips binary; scan the docs tree + the search index
  MATCHES=$(grep -rinI -E "$term" docs docs-search.js 2>/dev/null)
  if [ -n "$MATCHES" ]; then
    HITS=$((HITS + 1))
    echo "🔴 FORBIDDEN in customer docs: /$term/ — $reason"
    echo "$MATCHES" | sed 's/^/     /'
  fi
done

# ---------------------------------------------------------------------------
# Scan B — RETIRED pricing model, pricing-context pages ONLY.
# ---------------------------------------------------------------------------
# The marketing pages that carry pricing/tier copy (the files Phase 6 owns).
# Non-existent entries (e.g. collections.html before Row 6.5) are skipped.
PRICING_FILES=(
  pricing.html
  accounts-receivable.html
  accounts-payable.html
  credit-recovery.html
  checks.html
  ach.html
  shelfiq.html
  features.html
  for-bookkeepers.html
  consignment.html
  index.html
  vendors.html
  collections.html
)

# regex:::human-readable reason (case-insensitive; ERE).
# NOTE the ::: delimiter (not |) — the 1% regex itself contains a `|` alternation.
PRICING_PATTERNS=(
  "free trial:::retired trial framing — the site is consult-first, no trial. Primary CTA → /contact"
  "day trial:::retired 30-day-trial framing — consult-first, no trial"
  "cancel any ?time:::retired subscription/trial language — no public pricing"
  "try it free:::trial headline — brand trial-ok regions only (Z-33)"
  "payment details to start:::trial promise — brand trial-ok regions only (Z-33)"
  "subscription:::retired subscription model — engagements are custom, scoped in the consult"
  "per location:::retired per-location pricing — pricing is custom, no public numbers"
  "\\\$(499|749|799|899|999)\\b:::retired Automate tier price — the site shows no public pricing"
  "Start your free:::retired trial-signup CTA — the primary CTA is 'Schedule a call' → /contact"
  "per artifact:::retired \$20-per-artifact pricing — the site shows no public pricing"
)

# Build the list of pricing files that actually exist.
EXISTING_PRICING=()
for f in "${PRICING_FILES[@]}"; do
  [ -f "$f" ] && EXISTING_PRICING+=("$f")
done

# Trial-copy carve-out (Z-33). file:mode — "vendor-only" = the whole page is for
# brands; "show-vendor" = a two-persona page, so the region's first <section>
# must carry class show-vendor (hidden on the dispensary side).
TRIAL_OK_FILES=(
  "accounts-receivable.html:vendor-only"
  "pricing.html:show-vendor"
)
# Patterns the carve-out exempts INSIDE a trial-ok region. Everything else in
# PRICING_PATTERNS (subscription, tier prices, per location, …) stays forbidden
# even inside the region.
TRIAL_RX="^(free trial|day trial|cancel any \\?time|try it free|payment details to start)$"

trial_mode() { # $1 = file → prints its mode, or nothing
  local e
  for e in "${TRIAL_OK_FILES[@]}"; do
    [ "${e%%:*}" = "$1" ] && { echo "${e#*:}"; return; }
  done
}

# Prints the file with every trial-ok region blanked (line numbers preserved).
# Fails (exit 3) if a region is unclosed, empty, nested, is not exactly ONE
# <section>…</section> (so it can't span into a section the dispensary side
# sees), or — in show-vendor mode — that section's class lacks show-vendor. A region must never be ""
# (an empty region would pass every scan and prove nothing).
blank_trial_regions() { # $1 = file, $2 = mode
  awk -v mode="$2" '
    /<!-- trial-ok:start -->/ { if (inr) { bad="nested start at line " NR; exit 3 } inr=1; body=0; sec=""; nopen=0; nclose=0; last=""; print ""; next }
    /<!-- trial-ok:end -->/   { if (!inr) { bad="end without start at line " NR; exit 3 }
                                if (!body) { bad="empty region ending line " NR; exit 3 }
                                if (nopen!=1 || nclose!=1 || last !~ /<\/section>[[:space:]]*$/) { bad="region ending line " NR " must be exactly one <section>…</section>"; exit 3 }
                                if (mode=="show-vendor" && sec !~ /class="([^"]* )?show-vendor( [^"]*)?"/) { bad="region ending line " NR " is not inside a show-vendor section"; exit 3 }
                                inr=0; regions++; print ""; next }
    inr { if ($0 ~ /[^[:space:]]/) { body=1; last=$0 }
          if ($0 ~ /<section[[:space:]>]/) { nopen++; if (sec=="") sec=$0 }
          if ($0 ~ /<\/section>/) nclose++
          print ""; next }
    { print }
    END { if (bad!="") { print bad > "/dev/stderr"; exit 3 }
          if (inr) { print "unclosed region" > "/dev/stderr"; exit 3 } }
  ' "$1"
}

# A trial-ok marker on any file NOT in TRIAL_OK_FILES is itself a hit — the
# carve-out can't be borrowed by a dispensary page.
STRAY=$(grep -rlI --include=*.html -e "trial-ok:start" -e "trial-ok:end" --exclude-dir=node_modules --exclude-dir=.git . 2>/dev/null | sed 's|^\./||' | while read -r f; do [ -z "$(trial_mode "$f")" ] && echo "$f"; done)
if [ -n "$STRAY" ]; then
  HITS=$((HITS + 1))
  echo "🔴 FORBIDDEN trial-ok marker outside TRIAL_OK_FILES (trial copy is brand-only — Z-33):"
  echo "$STRAY" | sed 's/^/     /'
fi

# Each allow-listed file must still carry at least one valid region (else the
# carve-out is dead weight and a typo'd marker would go unnoticed).
for e in "${TRIAL_OK_FILES[@]}"; do
  f="${e%%:*}"; [ -f "$f" ] || continue
  if ! grep -q "trial-ok:start" "$f"; then
    HITS=$((HITS + 1)); echo "🔴 TRIAL-OK: $f is allow-listed but has no trial-ok region (remove it from TRIAL_OK_FILES or restore the region)"
  elif ! ERR=$(blank_trial_regions "$f" "${e#*:}" 2>&1 >/dev/null); then
    HITS=$((HITS + 1)); echo "🔴 TRIAL-OK: $f — ${ERR:-region check failed}"
  fi
done

if [ "${#EXISTING_PRICING[@]}" -gt 0 ]; then
  for entry in "${PRICING_PATTERNS[@]}"; do
    rx="${entry%%:::*}"
    reason="${entry#*:::}"
    MATCHES=""
    for f in "${EXISTING_PRICING[@]}"; do
      mode="$(trial_mode "$f")"
      if [ -n "$mode" ] && echo "$rx" | grep -qE "$TRIAL_RX"; then
        # Trial pattern on a carve-out file: scan with its trial-ok regions blanked.
        M=$(blank_trial_regions "$f" "$mode" 2>/dev/null | grep -inI -E "$rx" | sed "s|^|$f:|")
      else
        M=$(grep -inI -E "$rx" "$f" 2>/dev/null | sed "s|^|$f:|")
      fi
      [ -n "$M" ] && MATCHES="${MATCHES:+$MATCHES
}$M"
    done
    if [ -n "$MATCHES" ]; then
      HITS=$((HITS + 1))
      echo "🔴 FORBIDDEN retired-pricing copy: /$rx/ — $reason"
      echo "$MATCHES" | sed 's/^/     /'
    fi
  done
fi

# ──────────────────────────────────────
# Scan D — ACH is LIVE (Chris, 10/28/2026). No public page or llms.txt may say
# ACH is "rolling out" / "coming soon" / "not yet available" / "live for no one".
# Line-based: a line that mentions ACH (word-bounded) AND a stale phrase.
# The file region must be non-empty (a broken file list must not pass clean).
# ──────────────────────────────────────
ACH_FILES=$(find . -path ./node_modules -prune -o -path ./_pdf-source -prune -o -path ./.git -prune -o \( -name '*.html' -o -name 'llms.txt' \) -type f -print)
if [ -z "$ACH_FILES" ] || [ ! -s llms.txt ] || [ ! -s payments.html ]; then
  HITS=$((HITS + 1)); echo "🔴 ACH-LIVE scan: file region empty (llms.txt / payments.html missing) — scan proves nothing"
else
  # Windowed: a stale phrase with the word ACH on the same line, within 4 lines after it (a tag
  # above its <h3>, pretty-printed JSON-LD) or 1 line before it.
  # POSIX awk only (BSD / mawk / gawk): one awk per file, buffer lines, scan in END.
  ACH_STALE=""
  for f in $ACH_FILES; do
    OUT=$(awk -v F="$f" -v STALE='[Rr]olling out|[Rr]olls out|[Cc]oming soon|[Nn]ot yet (available|live)|[Ll]ive for no one|[Pp]lanned|[Aa]vailable soon|[Ww]ill launch|[Nn]ot (available )?yet|[Ii]sn.t live|[Oo]n the roadmap|[Ii]n beta|[Tt]oday every payment is delivered as a check|[Uu]ntil it.s on for' '
      { L[NR]=$0 }
      END { for (i=1;i<=NR;i++) if (L[i] ~ STALE) { hit=0; for (j=i-1;j<=i+4;j++) if (j>=1 && j<=NR && L[j] ~ /(^|[^A-Za-z])[Aa][Cc][Hh]([^A-Za-z]|$)/) hit=1; if (hit) print F ":" i ": " substr(L[i],1,200) } }
    ' "$f")
    [ -n "$OUT" ] && ACH_STALE="${ACH_STALE}${OUT}"$'\n'
  done
  ACH_STALE="${ACH_STALE%$'\n'}"
  if [ -n "$ACH_STALE" ]; then
    HITS=$((HITS + 1))
    echo "🔴 ACH-LIVE: ACH is live (Chris, 10/28/2026) — remove rolling out / coming soon / not yet wording about ACH"
    echo "$ACH_STALE" | cut -c1-220 | sed 's/^/     /'
  fi
fi

# ─────────────────────────────────────────────────────────────────────
# Scan C — Apollo.io tracker, sitewide. Removed 10/06/2026 (Chris: "rip
# apollo out"); page templates used to copy it forward, so block a re-add.
# ─────────────────────────────────────────────────────────────────────
APOLLO=$(grep -rlI -E "initApollo|apollo\.io|aplo-evnt" --include=*.html --include=*.js --include=*.mjs --include=vercel.json --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.lighthouseci . 2>/dev/null)
if [ -n "$APOLLO" ]; then
  HITS=$((HITS + 1))
  echo "🔴 FORBIDDEN Apollo tracker (removed 10/06/2026 — never re-add):"
  echo "$APOLLO" | sed 's/^/     /'
fi

if [ "$HITS" -eq 0 ]; then
  echo "✅ Forbidden-string check clean (no provider leaks, no bad login URL, no retired pricing)."
  exit 0
fi
echo ""
echo "❌ $HITS forbidden pattern(s) present — remove before deploy."
exit 1
