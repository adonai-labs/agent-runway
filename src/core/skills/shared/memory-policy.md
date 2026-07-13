# Memory Hygiene Policy

Use this policy whenever a skill writes to a file under `.agent-runway/memory/`.

## Goal

Keep memory files signal-dense and bounded. Memory is for repeated, reusable lessons — not a log of every run.

## Core Rules

1. **Consolidate before appending**
   - Before adding an entry, scan the file for a near-identical one (same pattern, module, or decision).
   - If found, update that entry (refine the guardrail, bump the date) instead of appending a duplicate.

2. **Cap active entries**
   - Keep at most **20 active entries per file**.
   - When a write would exceed the cap, archive the least useful active entry first (oldest, resolved, or superseded).

3. **Archive, do not delete**
   - Never lose history. Move stale or superseded entries under a `## Archive` heading at the bottom of the same file.
   - An entry is an archive candidate when its follow-up signal has resolved, it has been superseded by a newer decision, or it is the oldest beyond the cap.

4. **Keep entries lean and safe**
   - One entry = one reusable lesson. No transcripts, no secrets, no environment-specific values.
   - Prefer a concrete guardrail or rule update over narrative description.

## Operational Check

Before finalising a memory write, ask:
- "Is this a repeated pattern worth remembering, or a one-off?" — if one-off, do not write.
- "Does a near-identical entry already exist?" — if yes, update instead of append.
- "Is the active section over 20 entries?" — if yes, archive the weakest entry.
