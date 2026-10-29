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

| Artifact | Path | Written by |
|---|---|---|
| Checkpoints | `.agent-runway/logs/checkpoints/YYYY-MM-DD-HHMM-<slug>.md` | `checkpoint` |
| Reviews | `.agent-runway/logs/reviews/YYYY-MM-DD-<branch-or-scope>.md` | `code-review` |
| Council reviews (only when asked to save) | `.agent-runway/logs/council/YYYY-MM-DD-<slug>.md` | `council` |
| Safety checks (only when asked to save) | `.agent-runway/logs/safety-checks/YYYY-MM-DD-HHMM-<slug>.md` | `safety-check` |
| Autonomous runs | `.agent-runway/logs/autonomous-runs/YYYYMMDD-HHMM-<slug>.md` | `autonomous-lead` |
| Framework improvement notes | `.agent-runway/logs/system-improvements.md` | `lead` (Phase 10.5) |
| ADRs | `.agent-runway/docs/architecture/decisions/ADR-YYYYMMDD-<slug>.md` | `architect`, `autonomous-lead` |
| Spec | `.agent-runway/specs/<slug>/spec.md` | `spec-creator` |
| Human summary | `.agent-runway/specs/<slug>/summary.md` | `spec-creator` |
| Epic | `.agent-runway/specs/<slug>/epic.md` | `ticket-creator` |
| Tickets | `.agent-runway/specs/<slug>/tickets/task-<nn>-<ticket-slice-slug>.md` | `ticket-creator` |
| Memory entries | `.agent-runway/memory/<file>.md` (fixed list) | see [memory-policy.md](memory-policy.md) |

`<slug>` is kebab-case ASCII derived from the feature or solution name; the spec folder name carries the identity, so files inside it keep the fixed names above. Run ids use the UTC form `YYYYMMDD-HHMM-<slug>`.

Gate verdicts are appended to the artifact they evaluate (spec, ticket, review, run log, or saved council/safety-check log) using [verdict-block.md](verdict-block.md); `agent-runway metrics` reads them from both `.agent-runway/specs/` and `.agent-runway/logs/`.