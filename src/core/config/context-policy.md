# Context Policy

This file defines how the framework selects and loads context for each command.

## Principles

1. Prefer the most authoritative source available.
2. Prefer concise, task-relevant context over broad repository scans.
3. Load context incrementally.
4. Do not include background material unless it changes the implementation or review outcome.
5. If multiple sources disagree, prefer the most recent approved decision or explicit project documentation.
6. If context is missing, say so explicitly and proceed with bounded assumptions.

## Source Priority

Unless a skill defines otherwise, use this source order:

1. Explicit user input
   - ticket text
   - acceptance criteria
   - attached files
   - linked requirements

2. Domain and business context
   - `.agent-runway/docs/business/entities.md`
   - `.agent-runway/docs/business/flows.md`

3. Behaviour, requirements and testing
   - `.agent-runway/docs/testing/strategy.md`
   - `.agent-runway/docs/testing/critical-scenarios.md`
   - `.agent-runway/docs/testing/integration-test-map.md`

4. Architectural decisions
   - `.agent-runway/docs/architecture/architecture.md`
   - `.agent-runway/docs/architecture/decisions.md`
   - `.agent-runway/docs/architecture/modules.md`
   - ADRs, RFCs

5. Curated framework memory
   - `.agent-runway/memory/project-decisions.md`
   - `.agent-runway/memory/recurring-patterns.md`
   - `.agent-runway/memory/common-failures.md`
   - `.agent-runway/memory/review-findings.md`
   - `.agent-runway/memory/ticket-quality-notes.md`
   - `.agent-runway/memory/testing-notes.md`

6. Examples and prior work
   - `.agent-runway/docs/examples/good-tickets.md`
   - `.agent-runway/docs/examples/good-prs.md`
   - `.agent-runway/docs/examples/implementation-notes.md`
   - relevant tests, existing handlers/services/components

7. Broad codebase scan
   - only if higher-priority sources are missing or insufficient

## Load Strategy

### Default behaviour
- Start narrow.
- Load only the context needed for the current phase.
- Expand only when ambiguity, risk, or missing information is detected.

### Escalate context loading when:
- the task spans multiple layers or bounded contexts
- the ticket is ambiguous
- the change touches auth, security, persistence, messaging, or versioning
- tests or existing patterns are inconsistent
- the review finds unresolved design uncertainty

### Stop loading more context when:
- the task can be explained clearly
- the main affected module is identified
- acceptance criteria can be mapped to implementation and tests
- additional sources are repeating the same information

## Command-specific policy

### `/start`
Goal: classify the task and route it correctly.

Load in this order:
1. user prompt
2. `.agent-runway/docs/business/entities.md`
3. `.agent-runway/docs/business/flows.md`
4. `.agent-runway/docs/architecture/architecture.md`
5. limited codebase scan if still unclear

Avoid:
- deep review logic
- exhaustive codebase search
- loading all rules/examples

### `/ticket-creator`
Goal: generate a development-ready ticket with accurate domain context.

Load in this order:
1. user input / Jira ticket / markdown file
2. `.agent-runway/docs/business/entities.md`
3. `.agent-runway/docs/business/flows.md`
4. `.agent-runway/docs/architecture/modules.md`
5. `.agent-runway/docs/architecture/decisions.md`
6. `.agent-runway/docs/architecture/architecture.md`
7. `.agent-runway/docs/examples/good-tickets.md`
8. `.agent-runway/memory/ticket-quality-notes.md`
9. codebase scan fallback if docs are missing (types, interfaces, migrations, routes)

Focus on:
- domain accuracy — correct entity names, relationships, lifecycles
- scope clarity — what is in and explicitly out
- implementation readiness — a developer can start without asking questions

Avoid:
- loading unrelated domains or modules
- generating schema detail that hasn't been confirmed

### `/validate`
Goal: determine whether the ticket is ready for implementation.

Load in this order:
1. ticket text / Jira content
2. `.agent-runway/docs/examples/good-tickets.md`
3. `.agent-runway/docs/business/flows.md`
4. `.agent-runway/docs/business/entities.md`
5. `.agent-runway/memory/ticket-quality-notes.md`

Focus on:
- clarity
- scope boundaries
- implementation readiness
- testability
- missing dependencies / open questions

Avoid:
- implementation-level deep dives unless needed to detect ambiguity

### `/po-eval`
Goal: determine whether a spec or ticket is product-ready from a Product Owner perspective.

Load in this order:
1. spec/ticket text
2. `.agent-runway/docs/business/flows.md`
3. `.agent-runway/docs/business/entities.md`
4. `.agent-runway/docs/examples/good-tickets.md`
5. `.agent-runway/memory/project-decisions.md`

Focus on:
- business objective clarity
- measurable outcomes and success criteria
- scope boundaries and assumptions
- product dependencies and risks

Avoid:
- deep implementation design detail
- code-level review concerns already covered by `/review`

### `/architect`
Goal: evaluate a design decision or proposal with full trade-off reasoning.

Note: runs as a subagent in an isolated context window. Receives all context
via a structured handoff — has no access to the parent conversation.

Load in this order:
1. architect handoff template (from `/lead` Phase 0 or direct invocation)
2. `.agent-runway/docs/architecture/decisions.md`
3. `.agent-runway/docs/architecture/architecture.md`
4. `.agent-runway/memory/project-decisions.md`
5. `.agent-runway/memory/recurring-patterns.md`
6. codebase files directly relevant to the proposed design

Focus on:
- trade-off reasoning, not just pattern matching
- proportionality — is the complexity justified by the problem?
- boundary correctness — does the design separate the right things?

Avoid:
- broad codebase scans
- loading domains unrelated to the decision
- re-examining implementation details already confirmed in the handoff

### `/lead`
Goal: plan and implement with enough context to avoid guessing.

Load in this order:
1. approved ticket / task brief
2. `.agent-runway/docs/business/entities.md`
3. `.agent-runway/docs/business/flows.md`
4. relevant tests
5. `.agent-runway/memory/project-decisions.md`
6. `.agent-runway/memory/recurring-patterns.md`
7. codebase files directly related to the task

Focus on:
- expected behaviour
- existing patterns
- invariants
- regression risk

Avoid:
- unrelated domains
- old exploratory files
- loading entire folders when a few files are enough

### `/review`
Goal: validate correctness, safety, and alignment.

Note: runs as a subagent in an isolated context window. Receives all context
via a structured handoff — has no access to the parent conversation.

Load in this order:
1. review handoff template (from `/lead` Phase 9 or direct invocation)
2. changed files
3. affected tests
4. `.agent-runway/memory/review-findings.md`
5. `.agent-runway/memory/common-failures.md`
6. `.agent-runway/memory/testing-notes.md`
7. `.agent-runway/docs/testing/critical-scenarios.md`
8. `.agent-runway/docs/testing/integration-test-map.md`
9. `.agent-runway/docs/architecture/decisions.md` if the change is architectural

Focus on:
- correctness
- regressions
- consistency with existing patterns
- known failure modes

Avoid:
- re-planning the whole task unless implementation contradicts the ticket

## Ticket generation policy

When generating or refining tickets:
- prefer implementation-ready clarity over completeness theatre
- keep sections compact
- do not turn tickets into mini-specs unless explicitly requested
- split tickets when multiple independently deliverable behaviours exist
- move unresolved design questions into dependencies or open questions, not into bloated acceptance criteria

### Section limits for standard tickets
- Context: max 1 short paragraph
- Scope Includes: 3–6 bullets
- Scope Excludes: 2–5 bullets
- Acceptance Criteria: 4–7 items
- QA Notes: 3–6 scenarios
- Open Questions: only if blocking or decision-shaping

## Missing Context Handling

If key context is missing:
1. say what is missing
2. state the assumption being made
3. keep the plan bounded
4. flag the item for validation rather than inventing detail

## Conflict Resolution

When sources conflict, prefer:
1. explicit ticket requirements
2. approved ADRs / architecture decisions
3. current domain/spec docs
4. tests that reflect current intended behaviour
5. existing implementation patterns

If conflict remains unresolved, escalate it as an open question.


