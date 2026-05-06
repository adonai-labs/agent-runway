---
name: autonomous-lead
description: Autonomous implementation workflow for low-supervision execution with mandatory decision logging. Executes end-to-end without interactive approval gates, but persists auditable run logs and architecture decisions in project artifacts. Use when the developer asks for autonomous mode, low supervision, or unattended implementation.
---

# Autonomous Lead

Apply shared policy: [../shared/caveman-skill-engineering.md](../shared/caveman-skill-engineering.md)

## Invoke Command

```
/autonomous-lead <description of what to build>
```

Examples:
- `/autonomous-lead implement idempotency keys for payment webhooks`
- `/autonomous-lead add tenant filter enforcement across API and repositories`

## Purpose

Run implementation with minimal supervision while preserving full traceability.

Quality bar is identical to `lead`. The only difference is approval mode:

- `lead`: interactive gates
- `autonomous-lead`: non-interactive gates with mandatory evidence logs

Autonomy is allowed for execution decisions, but every material decision must be captured in repository artifacts.

## Quality Parity Contract (with `lead`)

`autonomous-lead` must enforce the same technical rigor as `.agent-runway/skills/lead/SKILL.md`:

- same task classification discipline (trivial/standard/complex)
- same DRY analysis expectations before creating new components
- same incremental checks during implementation
- same self-review depth (SOLID, DRY, security, testing, scope control)
- same final validation expectations before handoff

If any `lead` quality gate would fail, autonomous execution must fail too.

## Decision Governance (Mandatory)

Before implementation, classify risk with:

- Impact: low/medium/high
- Reversibility: reversible/hard-to-reverse/irreversible
- Uncertainty: low/medium/high
- Cost of error: low/medium/high

Contrarian trigger (any true):
- impact is high and reversibility is hard-to-reverse or irreversible
- uncertainty is high
- contract/public interface change with ambiguous outcomes
- architecture decision with multiple viable paths

Execution mode:
- Execution-only: low risk + reversible + low uncertainty
- Execution+validation: medium risk or multi-layer change
- Execution+contrarian: contrarian trigger active

## Required Artifacts

Before code changes, create:

- `.agent-runway/logs/autonomous-runs/<run-id>.md`
- Recommended starting point: `.agent-runway/docs/examples/autonomous-run-log-template.md`

Where `<run-id>` is UTC-based:
- `YYYYMMDD-HHMM-<implementation-slug>`

When architectural impact is detected, also create:

- `.agent-runway/docs/decisions/ADR-<YYYYMMDD>-<decision-slug>.md`

Always append key final decisions to:

- `.agent-runway/memory/project-decisions.md`

## Non-Negotiable Logging Contract

For each material decision, record:

- Timestamp (UTC)
- Context
- Decision
- Alternatives considered
- Risk level (low/medium/high)
- Impacted files/modules
- Validation evidence (tests/checks)
- Rollback plan

If this structure is missing, the run is incomplete.

## Workflow (Autonomous, `lead`-equivalent)

### Phase 0 - Autonomous Scope Contract

1. Restate objective and boundaries.
2. Mark assumptions explicitly.
3. Create run log file and write initial contract.

Do not stop for approval unless a hard blocker exists.

### Phase 0.5 - Internal Risk Scoring and Routing

1. Score impact, reversibility, uncertainty, and cost of error.
2. Record the score in run log under "Classification and rationale".
3. Determine execution mode:
   - Execution-only
   - Execution+validation
   - Execution+contrarian

If execution mode is `Execution+contrarian`, run the mandatory contrarian gate before Phase 1.

### Phase 0.6 - Contrarian Gate (Mandatory for High Impact)

When triggered, document in run log:
- recommended path
- strongest counter-argument
- at least one viable alternative
- top risks and invalidation signals
- verdict: `Go`, `Go with conditions`, or `Stop`

Policy:
- `Stop`: halt execution and escalate with blocker details
- `Go with conditions`: continue only after conditions are translated into explicit implementation checks
- `Go`: continue to Phase 1

### Phase 1 - Discovery and Plan

1. Inspect docs and current code patterns.
2. Produce a concrete implementation plan by layer.
3. Record the plan in run log under "Planned execution".

Use `lead` planning standards:
- explicit in-scope / out-of-scope
- files to create/modify
- function/module decomposition plan
- risks and dependencies

### Phase 2 - Implement Incrementally

1. Apply changes in small slices.
2. After each slice:
   - run relevant checks/tests
   - log decisions and evidence
3. If scope creep is discovered:
   - log it
   - continue only if it stays inside stated outcome
   - otherwise stop and report blocker

Implementation must follow `lead` standards and incremental checks from:
- `.agent-runway/skills/lead/standards.md`
- `.agent-runway/skills/lead/incremental-checks.md`

### Phase 3 - Autonomous Quality Gates

Run and log:

- Build/lint status
- Test status
- Security-sensitive checks relevant to modified area
- Backward-compatibility or contract impact notes

Also execute and log:
- explicit security/observability checks relevant to touched layers
- anti-pattern checks from `.agent-runway/skills/lead/antipatterns.md`
- evidence equivalent to `lead` Phase 6 self-review

### Phase 4 - ADR Gate

Create ADR when any of these is true:

- Public contract change (API/event/schema)
- New cross-layer pattern/abstraction
- Data migration strategy decision
- Security model change

Use template in [adr-template.md](adr-template.md).

### Phase 5 - Final Handoff

Update run log with:

- Summary of what changed
- Files modified
- Decision table
- Validation evidence
- Known residual risks
- Recommended follow-ups

Append stable lessons to `.agent-runway/memory/project-decisions.md`.
Append recurring operational patterns to `.agent-runway/memory/execution-memory.md` when observed.
Append recurring reasoning lessons to `.agent-runway/memory/reasoning-memory.md` when observed.

## Mandatory Evidence Sections (Run Log)

Run log must include these sections, in order:

1. Objective and boundaries
2. Classification and rationale
3. Contrarian review (or "not triggered" with reason)
4. Planned implementation
5. Decision log (table)
6. Files changed
7. Validation evidence
8. Security and contract impact
9. Residual risks
10. Rollback notes
11. Follow-up actions

## Output Requirements

Final response must include:

- Run log path
- ADR paths created (or "none")
- Files changed
- Validation results
- Residual risks

## Stop Conditions

Stop and escalate only for:

- Missing critical requirement that cannot be inferred
- Conflicting constraints that make safe progress impossible
- High-risk change with unclear rollback
- Contrarian verdict is `Stop`
- Any destructive or irreversible operation pending explicit human approval

In stop mode, write blocker details to run log before returning.

## Human Approval Guardrails (Mandatory)

Even in autonomous mode, explicit user approval is required before:

- Dropping/truncating databases, tables, or collections
- Deleting production data or large data sets
- Executing destructive infrastructure actions
- Rotating/removing credentials or access in ways that can lock out systems
- Any action with irreversible business impact

When this happens:

1. Stop execution before the action.
2. Write the pending action, risk, and rollback plan in the run log.
3. Ask for explicit approval.
4. Proceed only after approval is granted.
