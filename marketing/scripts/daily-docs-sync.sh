#!/usr/bin/env bash
# daily-docs-sync.sh
# Launched by macOS launchd every morning at 9am.
# Runs Claude Code with the docs sync prompt to update documentation.

set -e

MARKETING_DIR="/Users/chrismitchem/shelfspace-marketing"
PROMPT_FILE="$MARKETING_DIR/marketing/scripts/daily-docs-sync-prompt.md"
LOG_FILE="$MARKETING_DIR/marketing/scripts/daily-docs-sync.log"

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

# Run Claude Code non-interactively
cd "$MARKETING_DIR"
claude -p "$PROMPT" --allowedTools "Bash,Read,Write,Edit,Glob,Grep" >> "$LOG_FILE" 2>&1

# Log completion
echo "$(date): Daily docs sync complete." >> "$LOG_FILE"
echo "---" >> "$LOG_FILE"
