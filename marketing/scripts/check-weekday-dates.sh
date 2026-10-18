#!/usr/bin/env bash
# check-weekday-dates.sh — fence: a weekday name written next to a MM/DD/YYYY date must be
# that date's real weekday. "Friday, 10/24/2026" shipped on /connect-your-ai and the launch
# blog on 10/18/2026 (10/24/2026 is a Saturday). Scans every served .html/.txt/.js file.
# Usage: bash marketing/scripts/check-weekday-dates.sh [root]   (exit 1 on any mismatch)
ROOT="${1:-$(cd "$(dirname "$0")/../.." && pwd)}"
python3 -I - "$ROOT" <<'PY'
import os, re, sys, datetime
root = sys.argv[1]
DAYS = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]
pat = re.compile(r"\b(Mon|Tue|Tues|Wed|Thu|Thur|Thurs|Fri|Sat|Sun)(?:day|nesday|rsday|urday)?\.?,?\s+(\d{1,2})/(\d{1,2})/(\d{4})\b", re.I)
bad, scanned, matched = [], 0, 0
for dp, dns, fns in os.walk(root):
    dns[:] = [d for d in dns if d not in ("node_modules", ".git", ".vercel")]
    for fn in fns:
        if not fn.endswith((".html", ".txt", ".js")): continue
        p = os.path.join(dp, fn); scanned += 1
        try: text = open(p, encoding="utf-8", errors="ignore").read()
        except OSError: continue
        for m in pat.finditer(text):
            matched += 1
            word, mo, d, y = m.group(1).lower()[:3], int(m.group(2)), int(m.group(3)), int(m.group(4))
            try: real = DAYS[datetime.date(y, mo, d).weekday()]
            except ValueError:
                bad.append(f"{os.path.relpath(p, root)}: '{m.group(0)}' is not a real date"); continue
            if not real.startswith(word):
                bad.append(f"{os.path.relpath(p, root)}: '{m.group(0)}' but {mo:02d}/{d:02d}/{y} is a {real.capitalize()}")
if scanned == 0:
    print("❌ check-weekday-dates: scanned 0 files — wrong root?"); sys.exit(1)
if bad:
    print("❌ Weekday/date mismatches:"); [print("  " + b) for b in bad]; sys.exit(1)
print(f"✅ Weekday/date check clean ({matched} dated weekdays checked across {scanned} files).")
PY
