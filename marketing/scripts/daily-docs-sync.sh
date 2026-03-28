#!/usr/bin/env bash
# daily-docs-sync.sh
# Launched by macOS launchd every morning at 9am.
# Runs Claude Code with the docs sync prompt to update documentation.
# Sends a summary email via Resend when complete.

MARKETING_DIR="/Users/chrismitchem/shelfspace-marketing"
PROMPT_FILE="$MARKETING_DIR/marketing/scripts/daily-docs-sync-prompt.md"
LOG_FILE="$MARKETING_DIR/marketing/scripts/daily-docs-sync.log"
ENV_FILE="$MARKETING_DIR/marketing/scripts/.env"
OUTPUT_FILE="$MARKETING_DIR/marketing/scripts/daily-docs-sync-output.tmp"

# Load env
if [ -f "$ENV_FILE" ]; then
  source "$ENV_FILE"
fi

# Log start
echo "$(date): Daily docs sync starting..." >> "$LOG_FILE"

# Check that both repos exist
if [ ! -d "$MARKETING_DIR" ]; then
  echo "$(date): ERROR — marketing repo not found" >> "$LOG_FILE"
  exit 1
fi

if [ ! -d "/Users/chrismitchem/shelfspace-platform" ]; then
  echo "$(date): ERROR — platform repo not found" >> "$LOG_FILE"
  exit 1
fi

# Check that prompt file exists
if [ ! -f "$PROMPT_FILE" ]; then
  echo "$(date): ERROR — prompt file not found" >> "$LOG_FILE"
  exit 1
fi

# Read the prompt
PROMPT=$(cat "$PROMPT_FILE")

# Run Claude Code non-interactively, capture output
cd "$MARKETING_DIR"
claude -p "$PROMPT" --allowedTools "Bash,Read,Write,Edit,Glob,Grep" > "$OUTPUT_FILE" 2>&1
CLAUDE_EXIT=$?

# Append to log
cat "$OUTPUT_FILE" >> "$LOG_FILE"
echo "$(date): Daily docs sync complete (exit code: $CLAUDE_EXIT)." >> "$LOG_FILE"
echo "---" >> "$LOG_FILE"

# Build email summary
SYNC_DATE=$(date "+%B %d, %Y at %I:%M %p")
OUTPUT_CONTENT=$(cat "$OUTPUT_FILE")

# Truncate output for email (max 3000 chars)
if [ ${#OUTPUT_CONTENT} -gt 3000 ]; then
  OUTPUT_CONTENT="${OUTPUT_CONTENT:0:3000}... [truncated — see full log]"
fi

# Escape for JSON
OUTPUT_JSON=$(echo "$OUTPUT_CONTENT" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))")

if [ $CLAUDE_EXIT -eq 0 ]; then
  SUBJECT="ShelfSpace Docs Sync — $SYNC_DATE"
  STATUS_LINE="Sync completed successfully."
else
  SUBJECT="⚠️ ShelfSpace Docs Sync FAILED — $SYNC_DATE"
  STATUS_LINE="Sync failed with exit code $CLAUDE_EXIT. Check logs."
fi

# Send email via Resend
if [ -n "$RESEND_API_KEY" ] && [ -n "$REPORT_EMAIL" ]; then
  curl -s -X POST "https://api.resend.com/emails" \
    -H "Authorization: Bearer $RESEND_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"from\": \"ShelfSpace Docs <onboarding@resend.dev>\",
      \"to\": [\"$REPORT_EMAIL\"],
      \"subject\": \"$SUBJECT\",
      \"html\": \"<div style='font-family:sans-serif;max-width:600px;margin:0 auto;'><h2 style='color:#1b4332;'>Daily Docs Sync Report</h2><p style='color:#64748b;'>$SYNC_DATE</p><p><strong>Status:</strong> $STATUS_LINE</p><hr style='border:none;border-top:1px solid #e2e8f0;margin:20px 0;'/><h3 style='color:#1b4332;'>Agent Output</h3><pre style='background:#f8fafc;padding:16px;border-radius:8px;font-size:13px;line-height:1.6;overflow-x:auto;white-space:pre-wrap;color:#334155;'>$OUTPUT_JSON</pre><hr style='border:none;border-top:1px solid #e2e8f0;margin:20px 0;'/><p style='font-size:13px;color:#94a3b8;'>This is an automated report from the ShelfSpace docs sync system.<br/>Log file: marketing/scripts/daily-docs-sync.log</p></div>\"
    }" >> "$LOG_FILE" 2>&1

  echo "$(date): Email report sent to $REPORT_EMAIL" >> "$LOG_FILE"
else
  echo "$(date): No RESEND_API_KEY or REPORT_EMAIL — skipping email" >> "$LOG_FILE"
fi

# Cleanup
rm -f "$OUTPUT_FILE"
