#!/usr/bin/env bash
# check-docs-forbidden.sh
# Fence for the doc-reconciliation sweep (2026-07-02): fails if a customer-facing
# doc ever reintroduces a trade-secret provider name or the wrong login URL.
#
# WHY: the marketing docs are customer-facing. Two classes are unambiguously
# forbidden and previously drifted in / were at risk:
#   - "Straddle" — the invisible/replaceable ACH rail (see platform
#     .claude/rules/straddle-invisible.md). Must NEVER appear to a retailer/vendor.
#   - "Checkflo"  — the invisible check-print provider. Same rule.
#   - "shelfspace.pro/login" — 404s. The real portal login is ourshelf.space/login.
#
# The blocklist is deliberately TIGHT (no legitimate doc use → zero false
# positives) so the check stays trustworthy. Do not add fuzzy terms like "25%".
#
# Usage: bash marketing/scripts/check-docs-forbidden.sh   (exit 1 on any hit)

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT" || exit 1

# term|human-readable reason
PATTERNS=(
  "straddle|trade-secret ACH provider name — describe as 'ACH bank transfer'"
  "checkflo|trade-secret check-print provider — describe as 'ShelfSpace mails the check'"
  "shelfspace\\.pro/login|wrong login URL — portal login is ourshelf.space/login"
)

HITS=0
for entry in "${PATTERNS[@]}"; do
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

if [ "$HITS" -eq 0 ]; then
  echo "✅ Docs forbidden-string check clean (no provider leaks, no bad login URL)."
  exit 0
fi
echo ""
echo "❌ $HITS forbidden pattern(s) present in customer docs — remove before deploy."
exit 1
