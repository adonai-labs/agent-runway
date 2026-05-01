# Spec Format — Human + Agent Readable

This template is designed for spec-first workflows and downstream agent execution.
It combines business intent (requirements/scenarios) with implementation guidance
so the same artifact can be reviewed by product, architecture, and engineering.

```markdown
# Spec: [Title]

## Status
Proposed | Approved | In Progress | Done

## Type
Feature | Fix | Change | Refactor

When you have decomposed delivery (for example an epic plus multiple markdown tickets), record it using **tickets** only — never "child tickets". Example:

`Feature (epic + 8 tickets)`

## Purpose
[One short paragraph about business capability and outcome.]

## Problem
[What problem exists today and why it matters now.]

## Goals
- [Goal 1]
- [Goal 2]

## Non-Goals
- [Explicitly out of scope item 1]
- [Explicitly out of scope item 2]

## Requirements
### Requirement: [Name]
The system SHALL [clear behavioural expectation].

#### Scenario: [Happy path]
- GIVEN [precondition]
- WHEN [trigger/action]
- THEN [expected outcome]
- AND [optional additional assertion]

#### Scenario: [Error or edge case]
- GIVEN [precondition]
- WHEN [failure trigger]
- THEN [safe/expected system behavior]

## Proposed Design
[Implementation-oriented design notes. Keep concise but actionable.]

## Proposed Solution Structure
Concrete folder and file layout for this implementation (new files, touched files, and where logic lives). Use a tree; align with the active stack template when present.

```text
[example: src/features/<capability>/...]
```

## Design Notes
- Architecture: [key technical decision]
- Constraints: [compatibility/performance/security constraints]
- Alternatives considered: [briefly why not chosen]

## Trade-offs
- Decision: [what was chosen]
- Benefit: [why this helps]
- Cost: [what we accept]
- Rejected option: [short reason]

## Affected Areas
- Module: [name]
- API: [endpoint or contract]
- Schema: [table/field/migration or "none"]
- UX: [surface impacted or "none"]

## Implementation Plan
- [ ] Step 1
- [ ] Step 2
- [ ] Step 3

## Quality Gates
- [ ] Tests pass
- [ ] Lint/type checks pass
- [ ] Backward compatibility verified
- [ ] Docs updated

## Risks
- [Risk + mitigation]

## Open Questions
- [Question needing decision]

## Known Pitfalls
- [Pitfall 1 and how to avoid it]
- [Pitfall 2 and how to avoid it]

## Learnings (optional)
- [What was learned during discovery or prior attempts]

## Spec Delta
- Updated requirement: [what changed from baseline]
- Added scenario: [new behavior]
- Removed behavior: [if applicable]
- Compatibility note: [how existing behavior is preserved or intentionally changed]

## Acceptance Criteria
- [ ] [Verifiable criterion 1]
- [ ] [Verifiable criterion 2]
- [ ] [Error/edge criterion]

## Agent Guidance
When implementing:
- Follow active stack rules and project constraints.
- Run tests and lint/type checks before marking steps done.
- Ask before major deviations to design or scope.
- Keep changes aligned with requirements and scenarios.
```

## Output Path Convention

**Do not** use generic filenames such as `spec.md`, `epic.md`, or `ticket.md` alone. Every artefact name must include the **implementation slug** (kebab-case, ASCII, derived from the solution title).

1. Derive `implementation-slug` from the spec title or agreed solution name (short, unique, filesystem-safe).
2. Use one directory per implementation:

`.agent-runway/specs/proposed/<implementation-slug>/`

3. Name files with that slug:

| Artefact | Filename |
|---|---|
| Main spec | `<implementation-slug>-spec.md` |
| Human summary | `<implementation-slug>-summary.md` |
| Epic (when epic mode) | `<implementation-slug>-epic.md` |
| Delivery ticket *n* | `task-<nn>-<implementation-slug>-<ticket-slice-slug>.md` |

Examples (`implementation-slug` = `react-login-oauth`):

- `.agent-runway/specs/proposed/react-login-oauth/react-login-oauth-spec.md`
- `.agent-runway/specs/proposed/react-login-oauth/react-login-oauth-summary.md`
- `.agent-runway/specs/proposed/react-login-oauth/react-login-oauth-epic.md`
- `.agent-runway/specs/proposed/react-login-oauth/task-01-react-login-oauth-api-login-endpoint.md`

Use this unless the user asks for a different destination.

## Handoff Notes

- This spec can feed `lead` directly.
- A ticket may optionally be derived through `ticket-creator`.
- `ticket-creator` can also start independently from chat (without a spec).
