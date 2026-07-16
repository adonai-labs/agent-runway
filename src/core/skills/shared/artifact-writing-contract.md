# Artifact Writing Contract

Use this contract whenever a skill creates or updates files under `.agent-runway/`.

## Artifact Roles

| Location | Role | Write when |
|---|---|---|
| `.agent-runway/docs/` | Stable project context | The information should remain useful across many future tasks. |
| `.agent-runway/memory/` | Durable lessons and recurring patterns | The same decision, failure, guardrail, or learning is likely to matter again. |
| `.agent-runway/logs/` | Execution trace and evidence | The information explains what happened during this specific run, review, checkpoint, or handoff. |
| `.agent-runway/specs/` | Feature intent and delivery plan | The user is defining or decomposing a feature, requirement, epic, or ticket. |

## Rules

- Prefer logs for run-specific detail.
- Prefer docs for stable architecture, business, contract, and testing context.
- Prefer memory for reusable lessons, not one-off events.
- Never duplicate the same fact across docs, memory, and logs unless each copy has a different role.
- Keep writes concise, factual, and non-sensitive.
- If a memory write is needed, apply [memory-policy.md](memory-policy.md).

## Canonical Paths

- Checkpoints: `.agent-runway/logs/checkpoints/YYYY-MM-DD-HHMM-<slug>.md`
- Reviews: `.agent-runway/logs/reviews/YYYY-MM-DD-<branch-or-scope>.md`
- Autonomous runs: `.agent-runway/logs/autonomous-runs/YYYYMMDD-HHMM-<slug>.md`
- ADRs: `.agent-runway/docs/architecture/decisions/ADR-YYYYMMDD-<slug>.md`
- Specs: `.agent-runway/specs/<slug>/spec.md`
- Tickets: `.agent-runway/specs/<slug>/tickets/task-<nn>-<ticket-slice-slug>.md`