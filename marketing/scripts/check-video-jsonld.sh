#!/usr/bin/env bash
# check-video-jsonld.sh
# Fence for training-video SEO (platform spec 1.1): every page that embeds a
# training video with a youtube-nocookie iframe MUST carry a VideoObject JSON-LD
# block for that same video id on the same page. Without it Google shows no video
# rich result (SERP thumbnail, "Key moments") for the page — the whole point of
# the embed's SEO value is lost, silently.
#
# The check is embedUrl-based (implementation-agnostic): for every embedded id,
# assert a JSON-LD "embedUrl" pointing at that id exists in the file. Our
# generated blocks (inject-jsonld.mjs / build-tutorials.mjs) satisfy it; a hand-
# authored VideoObject would too.
#
# Usage: bash marketing/scripts/check-video-jsonld.sh   (exit 1 on any gap)

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT" || exit 1

HITS=0
CHECKED=0

# Every blog/doc page that embeds a training video.
PAGES=$(grep -rlE 'youtube-nocookie\.com/embed/' blog docs 2>/dev/null)

for page in $PAGES; do
  # Distinct video ids embedded via iframe on this page.
  IDS=$(grep -oE 'youtube-nocookie\.com/embed/[A-Za-z0-9_-]+' "$page" \
        | sed -E 's#.*/embed/##' | sort -u)
  for id in $IDS; do
    CHECKED=$((CHECKED + 1))
    # A VideoObject JSON-LD embedUrl referencing the SAME id must be present.
    if ! grep -qE "\"embedUrl\"[[:space:]]*:[[:space:]]*\"[^\"]*embed/${id}" "$page"; then
      HITS=$((HITS + 1))
      echo "🔴 MISSING VideoObject JSON-LD for embed ${id} in: ${page}"
    fi
  done
done

if [ "$HITS" -eq 0 ]; then
  echo "✅ Video JSON-LD check clean (${CHECKED} embed(s) across embedding pages all have VideoObject)."
  exit 0
fi
echo ""
echo "❌ ${HITS} embed(s) missing VideoObject JSON-LD — add it before deploy."
echo "   (Platform: node scripts/training-videos/inject-jsonld.mjs — regenerates from video-catalog.json.)"
exit 1
