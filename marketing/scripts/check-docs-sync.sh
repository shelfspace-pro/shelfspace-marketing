#!/usr/bin/env bash
# check-docs-sync.sh
# Detects stale documentation by comparing platform changes to docs-manifest.json
#
# Usage: ./marketing/scripts/check-docs-sync.sh
# Requires: jq, git
# Platform repo: /Users/chrismitchem/shelfspace-platform

PLATFORM_DIR="/Users/chrismitchem/shelfspace-platform"
MANIFEST="$(dirname "$0")/../docs-manifest.json"
STALE_REPORT=""
NEW_FILES_REPORT=""
DELETED_REPORT=""

if [ ! -f "$MANIFEST" ]; then
  echo "⚠ docs-manifest.json not found. Run docs build first."
  exit 1
fi

if ! command -v jq &> /dev/null; then
  echo "⚠ jq is required. Install with: brew install jq"
  exit 1
fi

echo "🔍 Checking docs sync status..."
echo ""

# Handle empty manifest
if [ "$(jq 'length' "$MANIFEST")" -eq 0 ]; then
  echo "ℹ  Manifest is empty — no docs to check."
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 0
fi

# 1. Check each doc's source files for changes since lastSynced
STALE_COUNT=0
for doc in $(jq -r 'keys[]' "$MANIFEST"); do
  LAST_SYNCED=$(jq -r ".[\"$doc\"].lastSynced" "$MANIFEST")
  SOURCES=$(jq -r ".[\"$doc\"].sources[]" "$MANIFEST" 2>/dev/null)

  if [ -z "$SOURCES" ]; then
    continue
  fi

  for src in $SOURCES; do
    FULL_PATH="$PLATFORM_DIR/$src"

    # Check if source file OR directory was deleted. `-e` catches both;
    # `-f` alone misses manifest entries that are directory paths like
    # `app/api/payments/`, flagging them as deleted when they still exist.
    if [ ! -e "$FULL_PATH" ]; then
      DELETED_REPORT="$DELETED_REPORT\n  ⛔ $doc → source deleted: $src"
      continue
    fi

    # Check if source file changed since lastSynced
    CHANGES=$(git -C "$PLATFORM_DIR" log --since="$LAST_SYNCED" --oneline -- "$src" 2>/dev/null | head -5)
    if [ -n "$CHANGES" ]; then
      STALE_REPORT="$STALE_REPORT\n  📝 $doc (synced: $LAST_SYNCED)\n     Changed: $src"
      STALE_COUNT=$((STALE_COUNT + 1))
      break  # One changed source is enough to flag the doc
    fi
  done
done

# 2. Check for new platform files not in any manifest entry
ALL_MANIFEST_SOURCES=$(jq -r '.[].sources[]' "$MANIFEST" 2>/dev/null | sort -u)
NEW_COUNT=0

for dir in "app/api" "lib" "app/(retailer)" "app/(vendor)" "app/(admin)"; do
  if [ -d "$PLATFORM_DIR/$dir" ]; then
    while IFS= read -r file; do
      REL_PATH="${file#$PLATFORM_DIR/}"
      if ! echo "$ALL_MANIFEST_SOURCES" | grep -qF "$REL_PATH"; then
        # Check if file is newer than 7 days (recently added)
        if [ "$(find "$file" -mtime -7 2>/dev/null)" ]; then
          NEW_FILES_REPORT="$NEW_FILES_REPORT\n  🆕 $REL_PATH"
          NEW_COUNT=$((NEW_COUNT + 1))
        fi
      fi
    done < <(find "$PLATFORM_DIR/$dir" -name "*.ts" -o -name "*.tsx" 2>/dev/null)
  fi
done

# 3. Output report
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Docs Sync Report"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $STALE_COUNT -gt 0 ]; then
  echo ""
  echo "🔴 STALE DOCS ($STALE_COUNT):"
  echo -e "$STALE_REPORT"
fi

if [ -n "$DELETED_REPORT" ]; then
  echo ""
  echo "⛔ DELETED SOURCES:"
  echo -e "$DELETED_REPORT"
fi

if [ -n "$NEW_FILES_REPORT" ]; then
  echo ""
  echo "🆕 NEW PLATFORM FILES (not covered by docs):"
  echo -e "$NEW_FILES_REPORT"
fi

if [ $STALE_COUNT -eq 0 ] && [ -z "$DELETED_REPORT" ] && [ -z "$NEW_FILES_REPORT" ]; then
  echo ""
  echo "✅ All docs are up to date."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
