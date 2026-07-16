---
name: checkpoint
description: Capture the current work state so a developer, another agent, or a future session can resume without losing context. Use when the developer says "/checkpoint", "save state", "checkpoint this", "handoff", "pause here", or "resume later".
---

# Checkpoint

## Invoke Command

```
/checkpoint [optional title or mode]
```

Examples:
- `/checkpoint`
- `/checkpoint before refactor`
- `/checkpoint handoff`

---

## What this skill does

Creates a compact, factual snapshot of the current work state.

Use it when work is paused, switching context, handing off to another agent, or preserving a useful point during rapid iteration.

---

## Workflow

### 1. Inspect current state

Gather only observable context:

- current branch and git status, if available
- recently changed files
- current task intent
- completed changes
- validation already run
- known risks, blockers, or open questions
- the most useful next command or file to inspect

Do not invent completed work. If something was not validated, say so.

### 2. Choose checkpoint mode

Default mode is short.

Use **handoff mode** when the developer says `handoff`, `handover`, `resume later`, or explicitly asks for another agent/person to continue.

| Mode | Use when | Length |
|---|---|---|
| Short | Pausing or marking progress | About 20-40 lines |
| Handoff | Another session/person must continue | Detailed enough to resume safely |

### 3. Write the checkpoint

If filesystem write access is available, create:

```
.agent-runway/logs/checkpoints/YYYY-MM-DD-HHMM-<slug>.md
```

Use the local date/time when available. If the task has no clear title, use `checkpoint` as the slug.

If filesystem writes are not available, return the checkpoint content in chat and say it was not written to disk.

### 4. Use this template

```md
# Checkpoint: <title>

Date: <local date/time>
Branch: <branch or unknown>
Status: <clean/dirty/unknown>

## Intent

<What the work is trying to accomplish.>

## Current State

<What is true right now. Mention changed files when useful.>

## Changes Made

- <Observed completed change>

## Validation

- <Command/result, or "Not run">

## Open Threads

- <Open question, risk, or blocker>

## Resume From Here

<The next concrete action.>
```

---

## Rules

- Keep checkpoints factual and compact.
- Prefer file paths, commands, and exact validation results over broad summaries.
- Include risks and unknowns explicitly.
- Do not use a checkpoint as a substitute for tests, review, or an ADR.
- If the work reveals a durable lesson, ask whether it should be added to project memory.
