---
name: learning
description: Capture a durable project lesson in Agent Runway memory. Use when the developer says "learning", "remember this", "save this lesson", "add to memory", or when a completed task reveals a recurring decision, failure, convention, or guardrail that should influence future work.
standalone: true
---

# Learning

## Invoke Skill

```
@learning <lesson or observation>
```

Examples:
- `@learning we do not use generic repositories in this service`
- `@learning tests must use Testcontainers because SQLite hides provider issues`
- `@learning auth changes need a manual permission matrix check`

---

## What this skill does

Turns a useful lesson into a concise memory entry under `.agent-runway/memory/`.

Use it for reusable project knowledge, not for run history. If the information only explains what happened in the current session, use `@checkpoint` instead.

---

## Workflow

### 1. Classify the lesson

Choose exactly one target file:

| Target | Use when |
|---|---|
| `.agent-runway/memory/project-decisions.md` | Architecture, product, API, schema, dependency, or team decision |
| `.agent-runway/memory/execution-memory.md` | Operational guardrail, validation step, setup issue, release/deploy lesson |
| `.agent-runway/memory/reasoning-memory.md` | A recommendation changed after trade-off analysis or contrarian evidence |
| `.agent-runway/memory/recurring-patterns.md` | Repeated implementation convention, naming, module, or workflow pattern |
| `.agent-runway/memory/common-failures.md` | Repeated bug class, test miss, migration issue, integration failure, or review finding |
| `.agent-runway/memory/testing-notes.md` | Test strategy, fixture, environment, or coverage lesson |
| `.agent-runway/memory/review-findings.md` | Review pattern likely to appear again |
| `.agent-runway/memory/ticket-quality-notes.md` | Ticket/spec quality issue or acceptance criteria lesson |

If more than one file could fit, pick the narrowest reusable target.

### 2. Validate it is worth saving

Save only if the lesson is:

- durable: likely to matter again
- specific: tied to this project or stack
- actionable: changes future behavior
- non-sensitive: no secrets, credentials, customer data, or private incident detail

If it is too vague, ask one clarifying question. If it is only session state, recommend `@checkpoint`.

### 3. Write the memory entry

Append a concise entry to the selected file. Create the file if missing.

Use this format:

```md
### YYYY-MM-DD - <short title>

- **Signal**: <what was observed>
- **Lesson**: <what future agents should do differently>
- **Applies when**: <scope or trigger>
- **Source**: <file, ticket, PR, checkpoint, or conversation context>
```

### 4. Apply memory hygiene

Before writing:

- search the selected memory file for similar entries
- update an existing entry instead of duplicating it when the lesson already exists
- keep entries short and evidence-based
- archive superseded entries instead of deleting them if the file has an archive section

Use the policy in [../shared/memory-policy.md](../shared/memory-policy.md).
Use the artifact contract in [../shared/artifact-writing-contract.md](../shared/artifact-writing-contract.md).

---

## Output

Return:

- target memory file
- short title
- whether a new entry was added or an existing one was updated
- any uncertainty or follow-up needed

If filesystem writes are not available, return the proposed memory entry inline and say it was not written to disk.