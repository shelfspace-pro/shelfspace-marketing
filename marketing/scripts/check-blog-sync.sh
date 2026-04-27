#!/usr/bin/env bash
# check-blog-sync.sh
# Detects orphan blog posts: filesystem ↔ blog.html ↔ llms.txt
#
# Fails when:
#   - A post in blog/*.html is not linked from blog.html
#   - A post in blog/*.html is not listed in llms.txt
#   - blog.html has an href to a post that doesn't exist on disk
#
# Usage: ./marketing/scripts/check-blog-sync.sh
# Exit 0 if all in sync, exit 1 otherwise.

set -e

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BLOG_DIR="$REPO_ROOT/blog"
BLOG_INDEX="$REPO_ROOT/blog.html"
LLMS="$REPO_ROOT/llms.txt"

if [ ! -d "$BLOG_DIR" ] || [ ! -f "$BLOG_INDEX" ] || [ ! -f "$LLMS" ]; then
  echo "⚠ Required files not found (blog/, blog.html, llms.txt). Run from repo root."
  exit 1
fi

echo "🔍 Checking blog sync status..."
echo ""

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# 1. Posts on disk
ls "$BLOG_DIR"/*.html 2>/dev/null \
  | sed 's|.*/||; s|\.html$||' \
  | sort > "$TMP/posts.txt"

# 2. Slugs linked from blog.html
grep -oE 'href="/blog/[^"]+"' "$BLOG_INDEX" \
  | sed 's|href="/blog/||; s|"$||' \
  | sort -u > "$TMP/blog_html.txt"

# 3. Slugs in llms.txt under Blog Articles
grep -oE 'shelfspace\.pro/blog/[a-z0-9\-]+' "$LLMS" \
  | sed 's|.*/||' \
  | sort -u > "$TMP/llms.txt"

ORPHANS_BLOG=$(comm -23 "$TMP/posts.txt" "$TMP/blog_html.txt")
ORPHANS_LLMS=$(comm -23 "$TMP/posts.txt" "$TMP/llms.txt")
BROKEN_BLOG=$(comm -13 "$TMP/posts.txt" "$TMP/blog_html.txt")

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Blog Sync Report"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

FAIL=0

if [ -n "$ORPHANS_BLOG" ]; then
  echo ""
  echo "🔴 POSTS NOT LINKED FROM blog.html:"
  echo "$ORPHANS_BLOG" | sed 's/^/  - /'
  FAIL=1
fi

if [ -n "$BROKEN_BLOG" ]; then
  echo ""
  echo "⛔ blog.html LINKS TO MISSING FILES:"
  echo "$BROKEN_BLOG" | sed 's/^/  - /'
  FAIL=1
fi

if [ -n "$ORPHANS_LLMS" ]; then
  echo ""
  echo "🔴 POSTS NOT LISTED IN llms.txt:"
  echo "$ORPHANS_LLMS" | sed 's/^/  - /'
  FAIL=1
fi

if [ $FAIL -eq 0 ]; then
  POST_COUNT=$(wc -l < "$TMP/posts.txt" | tr -d ' ')
  echo ""
  echo "✅ All $POST_COUNT blog posts are linked from blog.html and listed in llms.txt."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

exit $FAIL
