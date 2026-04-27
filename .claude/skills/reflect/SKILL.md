---
name: reflect
description: Review the current session for things worth persisting to memory or skills. Proposes creates / updates / removes / hook-rewrites with structured ranking; STOPS without writing. Approval required before any persistence change. Default ultrathink. Use at end of session or after a meaningful learning moment.
---

# /reflect — propose persistence changes from session learnings

ultrathink

You are reviewing the current conversation for things worth persisting to memory, skills, CLAUDE.md, or hook-line rewrites.

**DO NOT WRITE ANY MEMORY OR SKILL FILES IN THIS TURN.** Propose only. Wait for the user's approval response in the next turn before any writes.

This skill explicitly STOPS to ask. That overrides the "do not ask for confirmation" autonomy rule — memory pollution compounds across sessions, the approval gate is the only protection. This is contractually OK; do not second-guess it.

Take 2-3× more time than usual. Skim the entire conversation since session start (or last /clear), not just the last few turns.

# Step 1 — Scope

Default: everything from session start (or last /clear). $ARGUMENTS can scope: "last 10 turns", "since the vendors page work", "only memory hygiene", etc.

# Step 2 — Memory type cheat-sheet

Apply to each candidate. The "what NOT to save" list is doing most of the work — most candidates will fail it.

## SAVE these:

**user** — facts about the user (role, expertise, preferences). Save when you learn any new detail about who they are or how they want to work.

**feedback** — corrections OR validated approaches. Save when:
- "Don't do X" / "stop doing Y" → capture the rule + reason
- An unusual choice accepted without pushback → capture as a validated pattern (these are easy to miss; watch for them)
- Always include a **Why:** line and a **How to apply:** line. The "why" lets future-you judge edge cases instead of blindly following.

**project** — in-flight work, decisions, deadlines, incidents. Save when you learn who-doing-what-by-when. ALWAYS convert relative dates to absolute (e.g. "Thursday" → "2026-04-30"). Project memories decay fast; include why so future-you can judge if still load-bearing.

**reference** — pointers to external systems (Linear, Slack, Grafana, specific dashboards/queries).

Marketing-flavored memory tends to be:
- Voice/copy preferences beyond CLAUDE.md (e.g., "prefer 'we surface' over 'we catch' for vendor framing")
- Brand positioning decisions ("we are X, not Y")
- Audience understanding ("vendors care about Z, not W")
- Content production patterns ("when writing a blog post, lead with the dispensary scene")

## SKIP these (do NOT save):

- Code patterns, conventions, file paths, architecture — git + CLAUDE.md are authoritative
- Bug fix recipes — commit message has it
- Activity logs / session summaries — only the *surprising* parts belong
- Anything already in CLAUDE.md, an existing memory, or a skill body
- Ephemeral conversation state (in-progress task, current debug context)

When the user asks you to save something that fails this list, PROPOSE THE SKIP and explain why. Don't just save because they asked.

# Step 3 — Search before propose CREATE

For each "create new memory" candidate, grep MEMORY.md and the memory directory (`~/.claude/projects/-Users-chrismitchem-shelfspace-marketing/memory/`) for related entries. If found, propose UPDATE the existing memory, not CREATE new.

The most common /reflect output should be small UPDATES to existing memories or HOOK-LINE REWRITES — not new files. New file proposals should be the minority.

# Step 4 — Memory Hygiene check (HIGHEST-VALUE STEP)

Walk through the conversation chronologically. For each user prompt:

1. **What did the auto-context loader surface?** Look at the `<system-reminder>` block at the top of the user message. The "📝 Memory files to consider" list is the loader output.
2. **What memory did I actually use?** Look for Read tool calls on memory files OR explicit references to memory in my responses.

**Find moments where I used a memory the loader DID NOT surface.** For each such miss:
- Identify the memory file (e.g. `feedback_verify_product_claims.md`)
- Identify the keywords from the actual task wording that are missing from the current MEMORY.md hook line
- Propose a hook-line rewrite that adds those keywords (and synonyms)

This is the system's self-improvement loop. Failing to do this means the auto-context loader's blind spots persist forever. Run it every session.

# Step 5 — Skill-worthy detection

A pattern is skill-worthy ONLY if **all three** hold:

1. It's a WORKFLOW (sequence of steps), not just touching a domain area
2. It happened 3+ times in this session, OR the user has explicitly said "I do this every day / multiple times"
3. The steps could be parameterized — "do X to Y for Z" — not "do X to specific-thing-A"

If yes: propose new skill at `.claude/skills/<name>/SKILL.md`.
If no: it's a memory at most.

# Step 5b — Removal proposals

Scan MEMORY.md and the memory dir for entries that:
- Were contradicted by something in this session
- Reference state that's no longer true (deadlines passed, features shipped, incidents resolved)
- Duplicate another memory
- Have hook lines so weak the loader will never match them (and rewrite isn't enough — the underlying memory is genuinely obsolete)

Propose REMOVE for each. Removal includes deleting the memory file AND removing the line from MEMORY.md.

# Step 6 — CLAUDE.md edits (be conservative)

Only propose a CLAUDE.md edit if the rule would apply to **>50% of future sessions across ALL marketing work**. Otherwise it's a memory or a skill body edit. CLAUDE.md loads every turn — every line costs tokens forever.

# Step 7 — Output ranked list

Format each candidate exactly like this:

````markdown
### N. [PRIORITY] <action>: <one-line summary>
**Type:** memory.feedback / memory.project / memory.user / memory.reference / skill.new / skill.update / claude-md / hook-rewrite / removal
**Target:** <full path>
**Why:** <one paragraph; cite the specific session moment that produced this>

**Body draft:**
```
<exact text that would be written>
```

**MEMORY.md hook line draft (if applicable):**
```
- [Title](file.md) — <description with rich keywords for future hook scoring>
```
````

PRIORITY definitions:
- **HIGH** = would *change my behavior* next session. Real new constraint or pattern. Most sessions produce 0–2 of these.
- **MEDIUM** = useful context for future related work. Won't change behavior on its own but answers a question that will come up.
- **LOW** = nice-to-have. Skip unless the user says "all".

Rank ruthlessly. If everything is HIGH, the ranking failed.

End your turn with this exact line:

> **Reply with numbers (e.g. '1, 3, 5'), 'all', 'none', or scope (e.g. 'all high', 'memory only').**

# Step 8 — Wait for approval

DO NOT WRITE. Approval will arrive in the next turn as a normal user message. At that point (NOT in this skill turn — in the next turn's normal response), execute the approved drafts:

- New memory file: Write the file + update MEMORY.md index
- Update memory: Edit the file + update MEMORY.md hook
- Hook-only: Edit MEMORY.md
- New skill: Write `.claude/skills/<name>/SKILL.md` (CC picks it up immediately, no restart needed)
- Skill body update: Edit the SKILL.md
- CLAUDE.md edit: Edit in place
- Removal: Delete the file + remove the MEMORY.md line

After writing, briefly confirm what landed (one line per change).
