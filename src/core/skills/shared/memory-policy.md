# Memory Hygiene Policy

Use this policy whenever a skill writes to a file under `.agent-runway/memory/`.

## Goal

Keep memory files signal-dense and bounded. Memory is for repeated, reusable lessons — not a log of every run.

## Memory Files

| File | Holds |
|---|---|
| `.agent-runway/memory/project-decisions.md` | Architecture, product, API, schema, dependency, or team decisions |
| `.agent-runway/memory/execution-memory.md` | Operational guardrails, validation steps, setup, release/deploy lessons |
| `.agent-runway/memory/reasoning-memory.md` | Recommendations that changed after trade-off analysis or contrarian evidence |
| `.agent-runway/memory/recurring-patterns.md` | Repeated implementation conventions, naming, module, or workflow patterns |
| `.agent-runway/memory/common-failures.md` | Repeated bug classes, test misses, migration or integration failures |
| `.agent-runway/memory/testing-notes.md` | Test strategy, fixture, environment, or coverage lessons |
| `.agent-runway/memory/review-findings.md` | Review patterns likely to appear again |
| `.agent-runway/memory/ticket-quality-notes.md` | Ticket/spec quality and acceptance-criteria lessons |

Do not create other memory files.

## Who Writes Memory

1. **One lesson, one file.** Every entry goes to exactly one file — the narrowest one that fits. Never copy the same lesson into two files.
2. **Explicit capture** — the `learning` skill writes one entry per invocation, after the developer asks for it.
3. **Interactive skills ask first** — `lead`, `architect`, `express`, `checkpoint`, `council`, `safety-check`, `code-review`, `refactor`, and `spec-creator` never write memory on their own. They propose the lesson and either ask "Save this to memory?" (then write it following this policy) or suggest the `learning` skill.
4. **Automatic sync is limited to repeated patterns** — `autonomous-lead`, `ticket-creator`, and `iac` may write without asking, but only when the same signal has been seen at least twice (in this run and in an earlier artifact or memory entry). They write at most **two entries per run**, each a different lesson in its own file (typically one operational lesson in `execution-memory.md` and one reasoning lesson in `reasoning-memory.md`), and report what they wrote in their final output.
5. Memory writes never block the main workflow.

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
