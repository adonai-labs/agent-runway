---
name: lead
description: Senior implementation lead — orchestrates the full feature lifecycle from problem exploration to commit. Enforces gated approval before writing code, incremental quality checks during implementation, and handoff to code-review for final validation. Stack-agnostic by default; loads stack-specific references when a module exists. Use when the user says "start lead", "implement", "build feature", "new feature", "lead this", "/lead", "plan this", or wants to develop a new capability end-to-end.
---

# Implementation Lead

Apply shared policy: [../shared/caveman-skill-engineering.md](../shared/caveman-skill-engineering.md)

## Invoke Command

```
/lead <description of what to build>
```

Examples:
- `/lead add order cancellation endpoint`
- `/lead refactor payment service to use Result pattern`
- `/lead implement background job for invoice generation`

> Not sure which skill to use? Start with `/start` — it classifies intent and routes to the right skill.

---

## Task Classification

Before any phase, classify the task. This determines which phases are required.

**Evaluate these three signals:**
1. Does this involve a design decision? (new pattern, layer boundary, architectural choice)
2. Does this touch more than one layer? (e.g. Domain + Application, or Application + API)
3. Does this change a contract? (API shape, event schema, public DTO, database migration)

| Classification | Signals | Workflow |
|----------------|---------|----------|
| **Trivial** | All three: No | Skip to Phase 4. Document reason for skipping in a one-line note. |
| **Standard** | Any one: Yes | Full 10-phase workflow. |
| **Complex** | Two or more: Yes, or involves a new subsystem or breaking change | Full workflow, Phase 0 **mandatory** with `/architect` skill. |

Also classify decision risk for gating depth:

- Impact: low/medium/high
- Reversibility: reversible/hard-to-reverse/irreversible
- Uncertainty: low/medium/high
- Cost of error: low/medium/high

Contrarian trigger (any true):
- impact is high and reversibility is hard-to-reverse or irreversible
- uncertainty is high
- contract/public interface change with ambiguous outcomes
- architecture decision with multiple viable paths

> Example trivial: fix a typo in a log message, add a missing null guard on an existing method, update a config value.
> Example standard: add a new query endpoint, extend an existing handler, add a validator.
> Example complex: introduce a new aggregate, change an event schema, split a service.

### Non-Negotiable Decomposition Rule

During planning and implementation, enforce atomic decomposition:

- Do not implement end-to-end behavior in one large function.
- Split logic into small, intention-revealing functions with one responsibility each.
- Keep orchestration separate from domain logic, validation, and I/O.
- If a function starts mixing concerns (validation + mapping + persistence + side effects), extract immediately.
- Prefer simple composition of small functions over adding new abstraction layers.

### Simplicity Guardrail (Mandatory)

Default to the simplest implementation that satisfies requirements.

- Do not introduce new layers, interfaces, base classes, or frameworks unless a clear risk/scale signal requires them.
- If new structural complexity is introduced, provide a one-line justification in Phase 7.
- If no clear justification exists, remove the added complexity before final handoff.

---

## Fast-Track Mode

An accelerated path for **Standard** tasks when the developer already has a clear plan.

**Activation:** the developer invokes `/fast-lead <description>` or explicitly states they want fast-track.

**Not available for:**
- **Complex** tasks — always require the full workflow with Phase 0 architect delegation
- **Trivial** tasks — already skip to Phase 4; fast-track adds nothing

### How it works

Phases 0–2 collapse into a single **Fast-Track Validation** step:

1. The developer presents their plan (what to build, which layers, key decisions).
2. Validate the plan against [antipatterns.md](antipatterns.md) and [standards.md](standards.md).
3. Search the codebase briefly for conflicting patterns or existing implementations that overlap.
4. Evaluate risk signals:
   - Security surface modified (auth, secrets, input validation)
   - Contract change (API shape, event schema, database migration)
   - New abstraction introduced (interface, base class, shared component)

**If no risk signals detected:** proceed directly to Phase 3 (DRY Analysis). Document the fast-track decision in a one-line note:
```
Fast-track approved — Standard task, no risk signals detected.
```

**If any risk signal detected:** halt fast-track and explain which signal was found. Fall back to the full workflow starting at Phase 0:
```
Fast-track denied — [signal detected, e.g. "security surface modified: new [Authorize] policy"]. 
Reverting to full workflow at Phase 0.
```

Phases 3–10 execute without changes regardless of fast-track.

> **Developer profile override:** if `.cursor/config/developer-profiles.md` exists and the active profile is Autonomous, fast-track validation is silent — the system only interrupts if a risk signal is detected. See the Developer Profiles section below.

---

## Developer Profiles

Check whether `.cursor/config/developer-profiles.md` exists. If it does, read the `active:` line to determine the current profile. If the file does not exist, default to **Guided**.

The profile modifies gate behaviour across the workflow:

| Gate | Guided (default) | Standard | Autonomous |
|------|-------------------|----------|------------|
| Phase 0 — Approach selection | `AskQuestion` — blocks | `AskQuestion` — blocks | Silent validation — only interrupts if risk signal detected |
| Phase 1 — Scope confirmation | `AskQuestion` — blocks | Present output, proceed automatically unless ambiguity detected | Silent — proceed unless ambiguity detected |
| Phase 2 — Plan approval | `AskQuestion` — blocks | `AskQuestion` — blocks | Silent validation — only interrupts if antipattern or risk signal detected |
| Fast-Track (Standard tasks) | Requires explicit `/fast-lead` | Default for Standard tasks | Default for Standard tasks |
| Phase 10 — Commit prefix | `AskQuestion` — always | `AskQuestion` — always | `AskQuestion` — always (commit message always requires confirmation) |

In **Autonomous** mode, "silent validation" means the system runs the same checks but does not present them interactively. If all checks pass, it proceeds. If any check fails (risk signal, antipattern, ambiguity), it interrupts with a specific explanation of what was found and requires developer input before continuing.

---

## Workflow — 10 Phases

Execute phases sequentially. **Never skip a gate unless Task Classification permits it.** Present output using templates from [validation-templates.md](validation-templates.md).

---

### Pre-Phase 0 — Input Validation

#### Path A — Formal ticket provided (Jira key or `.md` file)

1. Run the `ticket-eval` rule against the ticket.
2. Apply the verdict:
   - **YES** → proceed to Phase 0.
   - **CONDITIONALLY** → surface the warnings using `AskQuestion` (single-select: "Proceed with warnings noted" / "Stop — refine the ticket first"). Only continue if developer explicitly approves.
   - **NO** → stop. Return the validation report. Do not proceed until the ticket is refined and re-validated.

#### Path B — Inline description (no ticket)

Evaluate the description against these minimum thresholds:

| Signal | Sufficient | Insufficient |
|--------|-----------|--------------|
| **What** | Specific action or outcome stated | Vague or abstract goal with no concrete deliverable |
| **Where** | Module, layer, or entity identifiable | No indication of where in the codebase this lands |
| **Why** | Business reason or trigger implied | No context for why this is needed now |

- **If all three are sufficient:** proceed to Phase 0 without asking anything.
- **If any are insufficient:** ask a maximum of 2 targeted questions to fill the gaps, then proceed. Do not ask about signals that are already clear.
- **If the description is a single vague sentence with none of the three:** use `AskQuestion` to collect the missing context before proceeding. Frame questions in plain language, not technical jargon.

Question budget rule:
- low risk + reversible + low uncertainty: max 1 targeted question
- medium risk: max 2 targeted questions
- high risk or contrarian trigger: focused questions as needed, only on blocking ambiguity

---

### Phase 0 — Exploration & Alternatives `[GATE]`

Before exploration, run escalation signal detection against the task description. Check for: contract change, cross-boundary impact, security surface, data migration, multi-service coordination, or unknown territory. Include any detected signals as additional context in the architect handoff so the subagent has full picture — signals do not gate Phase 0 in `/lead`, they inform the analysis.

Apply the shared policy **Minimum context** and **Simplicity before abstraction** rules while evaluating options.

1. Read the request carefully. Identify the core problem, not just the stated solution.
2. Search the codebase for existing patterns related to the feature:
   - Similar features already implemented
   - Existing services, repositories, or handlers that could be extended
   - Relevant domain entities or value objects
3. Propose **2–3 distinct approaches** with trade-offs.
   - For non-trivial design decisions, read [../architect/tradeoffs.md](../architect/tradeoffs.md) to frame the trade-off correctly.
   - For pattern selection, read [../architect/patterns.md](../architect/patterns.md) to identify the right structural fit.
   - For antipattern detection in the proposed approach, read [../architect/antipatterns.md](../architect/antipatterns.md).
4. Recommend one approach with rationale. Apply decision heuristics from [../architect/decision-heuristics.md](../architect/decision-heuristics.md) to defend the recommendation.
5. If contrarian trigger is active, add mandatory disagreement analysis:
   - strongest counter-argument against the recommendation
   - at least one viable alternative path
   - top risks and invalidation signals
   - verdict: `Go`, `Go with conditions`, or `Stop`

**Present findings using Phase 0 template from [validation-templates.md](validation-templates.md).**

Use the `AskQuestion` tool to collect approval before proceeding:
- One single-select question asking which approach to proceed with (list the proposed options by name, plus an "Other / discuss first" option)
- One optional multi-select question for concerns or constraints to factor in
- One optional single-select question for technology direction when more than one stack/tooling option is viable

**STOP. Do not proceed to Phase 1 until the developer selects an approach.**

---

### Phase 1 — Requirement Analysis `[GATE]`

1. Document the full understanding of the requirement:
   - Functional scope: what the feature does
   - Out of scope: what it explicitly does not do
   - Affected areas: which layers, services, and data models are touched
   - Dependencies: external services, events, scheduled jobs
   - Non-functional requirements: security, performance, observability
2. If there are open questions, use the `AskQuestion` tool to collect answers before documenting requirements. Ask only what is genuinely ambiguous — do not ask for information that can be reasonably inferred from the codebase or the request.
3. If data model or contract ambiguity exists, ask targeted gating questions before Phase 2:
   - entity ownership and lifecycle
   - required invariants and uniqueness constraints
   - migration/backfill expectations
   - compatibility constraints for existing consumers
4. If technology ambiguity exists, ask targeted gating questions before Phase 2:
   - preferred persistence/integration mechanism
   - operational constraints (latency/cost/observability)
   - team constraints (skills, maintainability window)

**Present using Phase 1 template.**

Use the `AskQuestion` tool to confirm scope before proceeding:
- One single-select question asking whether the requirements are understood correctly or if corrections are needed (options: "Correct, proceed", "Minor correction — I'll clarify below", "Stop — requirements need discussion")
- If open data/technology decisions remain, one additional single-select gate: "Resolve now" / "Proceed with explicit assumptions" / "Stop and escalate"

**STOP. Do not proceed to Phase 2 until scope is confirmed.**

---

### Phase 2 — Implementation Plan `[GATE]`

1. Define the implementation architecture:
   - New files to create (layer, name, responsibility)
   - Existing files to modify
   - Domain model changes (entities, value objects, events)
   - Application layer changes (use cases, handlers, validators)
   - Infrastructure changes (data access, migrations, external services)
   - API layer (endpoints, request/response contracts)
   - IaC changes required if new infrastructure resources are needed
   - Function decomposition plan (which responsibilities become separate functions/modules)
2. Identify anti-patterns to avoid — reference [antipatterns.md](antipatterns.md).
3. Identify reuse opportunities (Phase 3 will confirm via search).
4. Convert unresolved assumptions into explicit checks:
   - validation rule to add
   - test case to add
   - rollback condition to monitor

**Present using Phase 2 template.**

Use the `AskQuestion` tool to get implementation plan approval:
- One single-select question asking whether to proceed with the plan (options: "Approved, start implementation", "Adjust the plan — I'll clarify below", "Stop — this needs rethinking")

**STOP. Do not write any code until the plan is approved.**

---

### Phase 3 — DRY Analysis

Search the codebase before writing any new code:

- Existing validators or validation functions that could be extended
- Similar use cases, handlers, or commands already implemented
- Shared utilities, base classes, or helper functions
- Existing data access patterns for the same entity or aggregate
- Configuration or constants already defined

Document every reuse opportunity found.

**If DRY findings change the approved plan materially** (e.g. a planned new service can be replaced by extending an existing one, or a planned abstraction already exists), use `AskQuestion` before updating the plan:
- One single-select question describing what was found and how the plan would change (options: "Update the plan as suggested", "Keep the original plan", "Discuss before deciding")

Minor reuse opportunities (e.g. extracting a shared constant, using an existing helper) do not require confirmation — apply them and note them in the Phase 7 summary.

---

### Phase 4 — Implementation

Write code following [standards.md](standards.md).

**Before writing each layer, detect the project stack and load the relevant reference.**

1. **Detect the stack** — resolve using proximity to the files being changed, not project-level markers:

   a. **Check the file being written or modified.** Its extension and parent directory are the strongest signal (e.g. a `.cs` file inside `src/MyApp.Api/` is .NET regardless of a `package.json` at the repo root).

   b. **Walk up from the target file** to find the nearest build manifest:
      - `*.csproj` or `*.sln` → .NET
      - `package.json` with a `src/` or framework dependency → Node.js / TypeScript
      - `Cargo.toml` → Rust
      - `*.bicep` or `*.tf` → IaC

   c. **In a monorepo with multiple stacks**, each file belongs to the stack of its nearest manifest. Do not apply .NET references when writing a React component, even if the solution root contains a `.sln`.

   d. If the stack cannot be determined, state the ambiguity and ask the developer.

2. **Load the relevant reference** using the table below. If no stack module exists for this project, apply the universal engineering principles directly.

| Layer | .NET | Node.js / Express | IaC |
|-------|------|-------------------|-----|
| Domain / Core entities | [../dotnet-core/architecture.md](../dotnet-core/architecture.md) | — | — |
| Application / Use cases | [../dotnet-core/application-patterns.md](../dotnet-core/application-patterns.md) | — | — |
| Infrastructure / Data access | [../dotnet-core/infrastructure.md](../dotnet-core/infrastructure.md) | — | — |
| API / Contracts | [../dotnet-core/api-design.md](../dotnet-core/api-design.md) | [../express/SKILL.md](../express/SKILL.md) | — |
| IaC | [../iac/standards.md](../iac/standards.md) | [../iac/standards.md](../iac/standards.md) | [../iac/standards.md](../iac/standards.md) |

> Adding a new stack? See [EXTENDING.md](../../../../EXTENDING.md) for how to register a new stack module here.

For every file created or modified:

- Apply layered architecture boundaries strictly (no infrastructure imports in domain or core)
- Use constructor injection — never instantiate services directly
- Require authentication on all protected endpoints
- Validate all inputs at the boundary
- Use structured logging with semantic properties
- Handle all failure cases explicitly — no silent swallowing of errors
- Decompose monolithic functions into atomic units with clear names and single purpose

**Hard stop if scope creep detected**: if implementation reveals work beyond Phase 2 approval, use the `AskQuestion` tool to surface it:
- One single-select question describing the out-of-scope work found and asking how to proceed (options: "Expand scope — include it", "Exclude it — log as follow-up", "Stop — re-plan from Phase 2")

---

### Phase 4b — Incremental Checks

After each file, run the 5-category scan from [incremental-checks.md](incremental-checks.md):

1. Anti-patterns (check against [antipatterns.md](antipatterns.md))
2. Naming & readability
3. Structure & layer boundaries
4. Async/await correctness
5. Security surface

Fix findings before moving to the next file.

---

### Phase 5 — Testing

If a stack-specific testing reference exists for this project, load it before writing tests:

- .NET: [../dotnet-core/testing.md](../dotnet-core/testing.md)

For every new or modified behaviour:

- Unit tests for domain logic and core business rules (isolated, no real I/O)
- Integration tests for infrastructure adapters and external services
- Tests assert behaviour, not implementation details
- Cover: happy path, edge cases (null, empty, boundary), failure paths

Run the project's test suite. All tests must pass before continuing.

---

### Phase 6 — Self-Review

Work through the self-review checklist from [standards.md](standards.md), then apply the following targeted checks.

If a stack-specific security or observability reference exists for this project, load it to apply stack-specific checks:
- .NET: [../dotnet-core/security.md](../dotnet-core/security.md) and [../dotnet-core/observability.md](../dotnet-core/observability.md)

**Security:**
- [ ] All inputs validated before use
- [ ] No secrets in code or config files
- [ ] All protected endpoints require authentication
- [ ] No sensitive data in log output

**Observability:**
- [ ] Structured logging with semantic properties on important operations
- [ ] Correlation ID propagated if this touches async or cross-service flows
- [ ] Health check updated if new dependency added

**Architecture** — apply [../architect/review-lenses.md](../architect/review-lenses.md) lenses:
- [ ] Dependency direction correct (no infrastructure imports in domain or core)
- [ ] No domain logic in controllers, HTTP handlers, or infrastructure
- [ ] Contracts (DTOs, events, API responses) do not expose internal model details

**General:**
- [ ] Code quality & readability
- [ ] SOLID principles respected
- [ ] DRY — no duplicated logic
- [ ] Decomposition — no monolithic "do everything" functions
- [ ] Testing — adequate coverage
- [ ] Scope — no unrelated changes introduced
- [ ] IaC updated if infrastructure changed

---

### Phase 7 — Summary

Present a structured implementation summary using the Phase 7 template from [validation-templates.md](validation-templates.md):

- What was built
- Files created/modified
- Decisions made and why
- Trade-offs accepted
- Known limitations or follow-up tasks

---

### Phase 8 — Automated Verification

Run the project's build and quality suite. All must pass:

| Stack | Commands |
|-------|----------|
| .NET | `dotnet build --no-incremental && dotnet test && dotnet format --verify-no-changes` |
| Node.js | `npm run build && npm test && npm run lint` |
| Other | Run the project's equivalent build, test, and lint commands |

If any step fails, fix and re-run before continuing.

---

### Phase 9 — Delegate to Code Review

**First, evaluate whether `/review` is required:**

| Condition | Action |
|-----------|--------|
| 3 or more files changed | Delegate |
| Any Domain or Application layer touched | Delegate |
| Security surface modified (auth, input validation, secrets, permissions) | Delegate |
| Config, docs, or test files only — no production logic changed | Skip |
| Single file, fewer than 20 lines changed, no logic change | Skip |

If any **Delegate** condition is met, skip applies to nothing — delegate regardless.
If task was classified as **Trivial** at the start, skip is the default unless a Delegate condition applies.

**When delegating**, complete the `/review Handoff` template from [validation-templates.md](validation-templates.md), then pass it to the `code-review` skill:

```
/review
[paste completed /review Handoff template]
```

**When skipping**, note the reason inline (e.g. "Skipping /review — single config file change, no logic modified") and proceed to Phase 10.

The code-review skill performs the independent final validation. Address all blockers before proceeding to Phase 10.

---

### Phase 10 — Commit

Use the `AskQuestion` tool to collect the commit prefix:
- One single-select question asking for the commit type (options: `feat`, `fix`, `refactor`, `chore`)

Commit format:

```
<prefix>(<scope>): <short description>

<body — what changed and why, not how>
```

Example:
```
feat(orders): add order cancellation endpoint

Implements POST /api/orders/{id}/cancel with idempotency check.
Raises OrderCancelledEvent for downstream notification handling.
```

Then create a PR if the branch is not main.

---

### Phase 10.5 — System Feedback *(optional)*

After the commit, capture any signals that could improve the `.cursor` framework itself.

Use the `AskQuestion` tool with a single multi-select question:

```
Did this cycle reveal anything that should be captured for system improvement?
- A new pattern worth documenting in standards.md
- An antipattern not yet in antipatterns.md
- An architectural decision that merits an ADR in .agent-runway/docs/
- A recurring friction point in the workflow
- None — nothing to capture
```

**If "None" is selected:** close the session. No further action.

**If any other option is selected:** append an entry to `.cursor/config/system-improvements.md` (create the file if it does not exist) with the following format:

```markdown
### YYYY-MM-DD — [Short description]

- **Type**: Pattern / Antipattern / ADR / Workflow friction
- **Detail**: [One-paragraph description of what was found]
- **Suggested target file**: [e.g. `antipatterns.md`, `standards.md`, `.agent-runway/docs/decisions/`]
- **Source**: [Feature or ticket that surfaced this]
```

Do not modify any `.cursor` file directly — only log the improvement for the tech lead to review and apply.

---

## Supporting Files

- [antipatterns.md](antipatterns.md) — canonical anti-pattern list
- [incremental-checks.md](incremental-checks.md) — per-file quality scan
- [standards.md](standards.md) — DO/DON'T examples, self-review checklist
- [validation-templates.md](validation-templates.md) — phase checkpoint output templates
- [reference.md](reference.md) — search commands and key file paths

---

## Related Skills

Use the following skills for deeper reasoning when needed:

| Need | Skill |
|------|-------|
| Evaluate design trade-offs or architectural decisions in Phase 0 | `architect` — see [decision-heuristics.md](../architect/decision-heuristics.md) and [tradeoffs.md](../architect/tradeoffs.md) |
| Identify antipatterns in the proposed design | `architect` — see [antipatterns.md](../architect/antipatterns.md) |
| Choose the right structural pattern | `architect` — see [patterns.md](../architect/patterns.md) |
| .NET application patterns (CQRS, handlers, validation) | `dotnet-core` — see [application-patterns.md](../dotnet-core/application-patterns.md) |
| .NET infrastructure patterns (EF Core, messaging, caching) | `dotnet-core` — see [infrastructure.md](../dotnet-core/infrastructure.md) |
| .NET API design | `dotnet-core` — see [api-design.md](../dotnet-core/api-design.md) |
| .NET observability wiring | `dotnet-core` — see [observability.md](../dotnet-core/observability.md) |

