#!/usr/bin/env bash
# check-docs-forbidden.sh
# Content-integrity fence for the marketing site. Two independent scans, each
# scoped to keep zero false positives so the check stays trustworthy:
#
#   Scan A — customer docs (docs/, docs-search.js): trade-secret provider names
#            + the wrong login URL must never surface to a retailer/vendor.
#   Scan B — pricing-context pages ONLY: the RETIRED "$20-per-artifact /
#            allergic-to-subscriptions / 1%-capped / free-evaluation-not-trial"
#            model is forbidden. The current sanctioned model is the two-tier
#            Visibility (free) vs Automate (paid, 30-day trial, subscription).
#            See docs/specs/pricing-packaging-free-vs-paid.md in the platform
#            repo and CLAUDE.md § Pricing.
#
# WHY Scan B is file-scoped (LOW 32, Row 6.1): a bare `1%` / `per artifact`
# grep false-positives across ~139 pages + blog content (blog posts legitimately
# cite "1% of returns", etc.). So the retired-pricing blocklist is checked ONLY
# in the pricing-context marketing pages listed in PRICING_FILES below — the
# pages Phase 6 owns. Never widen this to the whole repo or to blog/ or docs/.
#
# The `1%` pattern is `(^|[^0-9])1%` on purpose: it matches the retired AR fee
# "costs 1%" but NOT "21%" / "11%" / "10%" so a legit discount figure can't trip it.
#
# EXPECTED STATE during the Phase 6 rollout: this check stays RED until the
# pricing pages are rewritten (Rows 6.2 / 6.4 / 6.6). A red exit here before
# those land is BY DESIGN, not a regression.
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
  "allergic to subscriptions:::retired anti-subscription framing — the model is now a 30-day free trial then a monthly subscription"
  "per artifact:::retired \$20-per-artifact pricing — the model is a fixed monthly Automate subscription"
  "\\\$20 per:::retired \$20-per-artifact pricing — use the tier prices (\$999/\$899/\$799/\$749 retailer, \$499+ vendor)"
  "\\\$20/artifact:::retired \$20-per-artifact pricing — use the Automate subscription tiers"
  "capped at \\\$100:::retired '1% capped at \$100' AR pricing — AR is now Free vs Automate"
  "(^|[^0-9])1%:::retired '1% of collections' AR fee — AR is now Free (see overdue) vs Automate (paid)"
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
echo "   (A red exit on retired-pricing patterns is EXPECTED until Rows 6.2/6.4/6.6 rewrite the pricing pages.)"
exit 1
