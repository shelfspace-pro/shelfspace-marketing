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
#
# WHY Scan B is file-scoped: a bare `$749` / `subscription` grep would
# false-positive across blog content + illustrative worked-example dollar amounts.
# So the retired-pricing blocklist is checked ONLY in the pricing-context
# marketing pages listed in PRICING_FILES below. Never widen this to the whole
# repo or to blog/ or docs/. Tier-price patterns anchor on a literal `$` +
# word-boundary so "$1,250" (an example amount) can't trip them.
#
# EXPECTED STATE during the 2026-09-04 overhaul rollout: this check stays RED
# until every pricing page is swept of pricing/trial copy (WEBSITE-OVERHAUL.md
# Rows 2–14). A red exit before those land is BY DESIGN, not a regression.
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
  "cancel anytime:::retired subscription/trial language — no public pricing"
  "subscription:::retired subscription model — engagements are custom, scoped in the consult"
  "per location:::retired per-location pricing — pricing is custom, no public numbers"
  "\\\$(499|749|799|899|999)\\b:::retired Automate tier price — the site shows no public pricing"
  "Start your free:::retired trial-signup CTA — the primary CTA is 'Talk to us' → /contact"
  "per artifact:::retired \$20-per-artifact pricing — the site shows no public pricing"
)

# Build the list of pricing files that actually exist.
EXISTING_PRICING=()
for f in "${PRICING_FILES[@]}"; do
  [ -f "$f" ] && EXISTING_PRICING+=("$f")
done

if [ "${#EXISTING_PRICING[@]}" -gt 0 ]; then
  for entry in "${PRICING_PATTERNS[@]}"; do
    rx="${entry%%:::*}"
    reason="${entry#*:::}"
    MATCHES=$(grep -inI -E "$rx" "${EXISTING_PRICING[@]}" 2>/dev/null)
    if [ -n "$MATCHES" ]; then
      HITS=$((HITS + 1))
      echo "🔴 FORBIDDEN retired-pricing copy: /$rx/ — $reason"
      echo "$MATCHES" | sed 's/^/     /'
    fi
  done
fi

if [ "$HITS" -eq 0 ]; then
  echo "✅ Forbidden-string check clean (no provider leaks, no bad login URL, no retired pricing)."
  exit 0
fi
echo ""
echo "❌ $HITS forbidden pattern(s) present — remove before deploy."
echo "   (A red exit on retired-pricing patterns is EXPECTED until WEBSITE-OVERHAUL.md Rows 2–14 sweep the pricing pages.)"
exit 1
