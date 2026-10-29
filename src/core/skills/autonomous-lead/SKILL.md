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

`autonomous-lead` must enforce the same technical rigor as the `lead` skill:

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

Before code changes, create `.agent-runway/logs/autonomous-runs/<run-id>.md`, where `<run-id>` is UTC `YYYYMMDD-HHMM-<implementation-slug>` (starting point: `.agent-runway/docs/examples/autonomous-run-log-template.md`).

When architectural impact is detected, also create `.agent-runway/docs/architecture/decisions/ADR-YYYYMMDD-<decision-slug>.md`.

Paths follow [../shared/artifact-writing-contract.md](../shared/artifact-writing-contract.md); memory writes follow the automatic-sync rule in [../shared/memory-policy.md](../shared/memory-policy.md) (Phase 5).

## Optional Context Providers

If a graph memory MCP, brain-context MCP, or similar context provider is available, use it as a read-only discovery source. Apply [../shared/context-provider-policy.md](../shared/context-provider-policy.md).

Autonomous runs must record a context receipt in the run log:

- provider name, if known
- query intent
- source ids/paths used
- context accepted
- context ignored and why
- fallback note when unavailable

The provider is never required. Continue with repository discovery if it is unavailable or low-signal.

## Narrative Delivery

Apply [../shared/narrative-delivery-policy.md](../shared/narrative-delivery-policy.md) throughout the autonomous run. The run log must preserve the delivery story in a compact, factual way:

- why the work exists
- what outcome the run is targeting
- what changed during execution
- what evidence was collected
- what remains open

This narrative is part of traceability. Do not use it to replace tests, review, ADRs, or explicit approval gates.

## Test-Driven Delivery

Apply [../shared/test-driven-delivery-policy.md](../shared/test-driven-delivery-policy.md) for behavior changes. Autonomous execution must not jump from request to implementation without recording:

- problem understanding
- expected behavior
- evidence plan
- test-first target or reason for relaxing strict test-first
- validation actually run

When feasible, establish failing evidence before production changes. When not feasible, log the fallback evidence before implementation starts.

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
- Context evidence used, including provider/source ids when applicable

If this structure is missing, the run is incomplete.

## Workflow (Autonomous, `lead`-equivalent)

### Phase 0 - Autonomous Scope Contract

1. Restate objective and boundaries.
2. Mark assumptions explicitly.
3. Create run log file and write initial contract, including the machine-readable run header (schema: [../shared/run-log-schema.md](../shared/run-log-schema.md)).
4. If an optional context provider is available, query it for related modules, decisions, specs/tickets, known risks, and prior failures. Write a context receipt to the run log.

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

Delegate to the `contrarian` agent via the `/contrarian Handoff` template from [../lead/validation-templates.md](../lead/validation-templates.md).

Complete the handoff with:
- problem statement
- chosen approach and rationale
- risk classification scores from Phase 0.5
- alternatives already considered
- active constraints

The contrarian agent runs with an isolated context window — it has no access to the reasoning built up in this session, which is intentional.

Record the full contrarian output in the run log under "Contrarian review".

Policy:
- `Stop`: halt execution, write blocker details to run log, and escalate
- `Go with conditions`: translate each condition into an explicit implementation check before Phase 1
- `Go`: continue to Phase 1

### Phase 1 - Discovery and Plan

1. Inspect docs and current code patterns.
2. Produce a concrete implementation plan by layer.
3. Produce an evidence plan: expected behavior, test level, command/artifact, and test-first expectation.
4. Record the plan in run log under "Planned execution".

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
   - note whether evidence was established before or after implementation
3. If scope creep is discovered:
   - log it
   - continue only if it stays inside stated outcome
   - otherwise stop and report blocker

Implementation follows [../lead/standards.md](../lead/standards.md) and [../lead/incremental-checks.md](../lead/incremental-checks.md), with stack detection and stack references as in [../lead/reference.md](../lead/reference.md).

### Phase 3 - Autonomous Quality Gates

Run and log (commands from the injected `../code-review/commands-<stack>.md` or the project's own scripts):

- Build/lint status
- Test status
- Security-sensitive checks relevant to modified area
- Backward-compatibility or contract impact notes

Also execute and log:
- explicit security/observability checks relevant to touched layers
- anti-pattern checks from [../lead/antipatterns.md](../lead/antipatterns.md)
- evidence equivalent to `lead` Phase 6 self-review

Update the run header with the outcome of each gate (`build`, `test`, `lint`), the number of `retries` to reach green, and `time_to_green_min`.

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

Memory sync (automatic-sync rule in [../shared/memory-policy.md](../shared/memory-policy.md)): write at most two entries per run, one lesson per file, and only for signals seen at least twice — a recurring decision → `project-decisions.md`, an operational pattern → `execution-memory.md`, or a reasoning lesson → `reasoning-memory.md`. One-off decisions stay in the run log and ADRs. List any memory writes in the run log.

Finalise the run header: set `deviations` (count of departures from the planned implementation) and `memory_refs` (titles of memory entries that were applied during this run). This is what lets `agent-runway metrics` measure whether memory is actually used.

## Mandatory Evidence Sections (Run Log)

Run log must include these sections, in order:

1. Objective and boundaries
2. Context receipt
3. Delivery story
4. Classification and rationale
5. Contrarian review (or "not triggered" with reason)
6. Planned implementation
7. Decision log (table)
8. Files changed
9. Test-driven delivery evidence
10. Validation evidence
11. Security and contract impact
12. Residual risks
13. Rollback notes
14. Follow-up actions

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
