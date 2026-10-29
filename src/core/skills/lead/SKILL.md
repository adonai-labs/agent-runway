---
name: lead
description: Senior implementation lead — orchestrates the full feature lifecycle from problem exploration to commit. Enforces gated approval before writing code, incremental quality checks during implementation, and handoff to code-review for final validation. Stack-agnostic by default; loads stack-specific references when a stack skill is installed. Use when the user says "start lead", "implement", "build feature", "new feature", "lead this", "/lead", "plan this", or wants to develop a new capability end-to-end.
---

# Implementation Lead

Apply shared policy: [../shared/caveman-skill-engineering.md](../shared/caveman-skill-engineering.md)

## Invoke Command

```
/lead <description of what to build>
```

Examples:
- `/lead add order cancellation endpoint`
- `/lead refactor payment service to return explicit results instead of throwing`
- `/lead implement background job for invoice generation`

> Not sure which skill to use? Start with the `start` skill (`/start`) — it classifies intent and routes to the right skill.

---

## Task Classification

Before any phase, classify the task. This determines which phases are required.

**Evaluate these three signals:**
1. Does this involve a design decision? (new pattern, layer boundary, architectural choice)
2. Does this touch more than one layer? (e.g. Domain + Application, or Application + API)
3. Does this change a contract? (API shape, event schema, public DTO, database migration)

| Classification | Signals | Workflow |
|----------------|---------|----------|
| **Trivial** | All three: No | Skip to Phase 4. Document the reason in a one-line note. |
| **Standard** | Any one: Yes | Full workflow (Pre-Phase 0 through Phase 10). Fast-track available. |
| **Complex** | Two or more: Yes, or new subsystem or breaking change | Full workflow, Phase 0 **mandatory** with the `architect` skill/agent. |

Also classify decision risk for gating depth — Impact (low/medium/high), Reversibility (reversible/hard-to-reverse/irreversible), Uncertainty (low/medium/high), Cost of error (low/medium/high).

Contrarian trigger (any true):
- impact is high and reversibility is hard-to-reverse or irreversible
- uncertainty is high
- contract/public interface change with ambiguous outcomes
- architecture decision with multiple viable paths

> Example trivial: fix a typo in a log message, add a missing null guard, update a config value.
> Example standard: add a new query endpoint, extend an existing handler, add a validator.
> Example complex: introduce a new aggregate, change an event schema, split a service.

### Non-Negotiable Decomposition Rule

- Do not implement end-to-end behaviour in one large function.
- Split logic into small, intention-revealing functions with one responsibility each.
- Keep orchestration separate from domain logic, validation, and I/O.
- If a function starts mixing concerns (validation + mapping + persistence + side effects), extract immediately.
- Prefer simple composition of small functions over new abstraction layers.

### Simplicity Guardrail (Mandatory)

- Default to the simplest implementation that satisfies requirements.
- Do not introduce new layers, interfaces, base classes, or frameworks unless a clear risk/scale signal requires them.
- Any new structural complexity gets a one-line justification in Phase 7; without one, remove it before handoff.

### Fast-Track Mode (Standard tasks only)

When the developer already has a clear plan (or the active profile makes fast-track the default), Phases 0–2 collapse into one Fast-Track Validation step: validate the plan against antipatterns and standards, search briefly for overlap, and check three risk signals (security surface, contract change, new abstraction). No signal → Phase 3. Any signal → restart at Phase 0. Read [workflow-reference.md](workflow-reference.md#fast-track-mode) before running it.

### Developer Profiles

Read the `active:` line of `{{config}}/developer-profiles.md`; if the file or line is missing, use **Guided** (every gate blocks). **Standard** and **Autonomous** relax how gates are presented, never which checks run, and the Phase 10 commit message always needs confirmation. Read [workflow-reference.md](workflow-reference.md#developer-profiles) when the profile is not Guided.

### Asking Questions

"Ask" in this skill means: ask a single-select question (multi-select where stated) using the environment's question tool, or plain text with numbered options if no such tool exists. Ask only what is genuinely ambiguous.

---

## Workflow — Pre-Phase 0, Phases 0–10 (10.5 optional)

Execute phases sequentially. **Never skip a gate unless Task Classification permits it.** Present output using templates from [validation-templates.md](validation-templates.md).

Cross-cutting policies:

- **Narrative delivery** ([../shared/narrative-delivery-policy.md](../shared/narrative-delivery-policy.md)) for medium or large work: keep a short story — context, intent, change, evidence, remaining work — across plan, implementation, commit, and PR. Compress it for small changes.
- **Test-driven delivery** ([../shared/test-driven-delivery-policy.md](../shared/test-driven-delivery-policy.md)) for behaviour changes: understand the problem and define the evidence plan before production code; prefer test-first; if relaxed, record why and use the smallest credible alternative evidence.
- **Optional context providers** ([../shared/context-provider-policy.md](../shared/context-provider-policy.md)): for non-trivial work, query graph/MCP context for modules, prior decisions, risks, failures, and related specs. Use only sourced results, record material evidence in the phase output, and continue normally if the provider is unavailable.
- **Artifacts** ([../shared/artifact-writing-contract.md](../shared/artifact-writing-contract.md)) and **memory** ([../shared/memory-policy.md](../shared/memory-policy.md)): this skill never writes memory automatically — propose the lesson and suggest the `learning` skill.

### Pre-Phase 0 — Input Validation

**Path A — Formal ticket provided (Jira key or `.md` file):**

1. Run the `ticket-eval` skill ([../ticket-eval/SKILL.md](../ticket-eval/SKILL.md)) against the ticket.
2. Apply the verdict:
   - **YES** → proceed to Phase 0.
   - **CONDITIONALLY** → surface the warnings and ask ("Proceed with warnings noted" / "Stop — refine the ticket first"). Continue only on explicit approval.
   - **NO** → stop and return the validation report until the ticket is refined and re-validated.

**Path B — Inline description (no ticket):**

| Signal | Sufficient | Insufficient |
|--------|-----------|--------------|
| **What** | Specific action or outcome stated | Vague goal with no concrete deliverable |
| **Where** | Module, layer, or entity identifiable | No indication where in the codebase this lands |
| **Why** | Business reason or trigger implied | No context for why this is needed now |

- All sufficient → proceed to Phase 0 without asking.
- Any insufficient → at most 2 targeted questions, then proceed.
- A single vague sentence with none of the three → ask for the missing context in plain language.

Question budget: low risk + reversible + low uncertainty → max 1 question; medium risk → max 2; high risk or contrarian trigger → only blocking ambiguity, as needed.

### Phase 0 — Exploration & Alternatives `[GATE]`

Run escalation signal detection first (contract change, cross-boundary impact, security surface, data migration, multi-service coordination, unknown territory). Signals do not gate Phase 0; include them in the architect handoff as context. Apply **Minimum context** and **Simplicity before abstraction**.

1. Identify the core problem, not just the stated solution.
2. Search the codebase for similar features, extendable services/repositories/handlers, and relevant domain entities or value objects ([reference.md](reference.md#codebase-search-patterns)).
3. If a context provider is available, query related decisions, modules, dependencies, prior failures, and specs/tickets; keep only sourced, high-signal evidence.
4. Propose **2–3 distinct approaches** with trade-offs. For non-trivial decisions read [../architect/tradeoffs.md](../architect/tradeoffs.md); for pattern selection [../architect/patterns.md](../architect/patterns.md); for antipattern detection [../architect/antipatterns.md](../architect/antipatterns.md). For **Complex** tasks, delegate to the `architect` agent with the `/architect Handoff` template.
5. Recommend one approach, defended with [../architect/decision-heuristics.md](../architect/decision-heuristics.md).
6. If the contrarian trigger is active, delegate to the `contrarian` agent with the `/contrarian Handoff` template from [validation-templates.md](validation-templates.md). It runs in an isolated context, free of this session's exploration bias. `Stop` → do not proceed; escalate with blocker details. `Go with conditions` → carry the conditions into Phase 2 as explicit checks.

**Present findings using the Phase 0 template.** Ask: which approach to proceed with (options by name, plus "Other / discuss first"); optionally a multi-select for concerns/constraints; optionally technology direction when more than one stack/tooling option is viable.

**STOP. Do not proceed to Phase 1 until the developer selects an approach.**

### Phase 1 — Requirement Analysis `[GATE]`

1. Document: functional scope, out of scope, expected observable behaviour, affected areas (layers, services, data models), dependencies (external services, events, jobs), and non-functional requirements (security, performance, observability).
2. Ask open questions first — never for information inferable from the codebase or request.
3. Data model or contract ambiguity → gating questions before Phase 2: entity ownership and lifecycle, invariants and uniqueness, migration/backfill, consumer compatibility.
4. Technology ambiguity → gating questions: persistence/integration mechanism, operational constraints (latency/cost/observability), team constraints.
5. Define the initial evidence plan: acceptance scenario or bug signal, test level (unit, integration, E2E, contract, security, performance, smoke, manual), and whether test-first is expected or relaxed (with reason).

**Present using the Phase 1 template.** Ask: "Correct, proceed" / "Minor correction — I'll clarify below" / "Stop — requirements need discussion". If data/technology decisions remain open, also ask: "Resolve now" / "Proceed with explicit assumptions" / "Stop and escalate".

**STOP. Do not proceed to Phase 2 until scope is confirmed.**

### Phase 2 — Implementation Plan `[GATE]`

1. Define the architecture of the change: new files (layer, name, responsibility), modified files, domain model changes, application changes (use cases, handlers, validators), infrastructure changes (data access, migrations, external services), API contracts, IaC changes, and the function decomposition plan.
2. Identify anti-patterns to avoid — [antipatterns.md](antipatterns.md).
3. Identify reuse opportunities (Phase 3 confirms them).
4. Convert unresolved assumptions into explicit checks: validation rule, test case, or rollback condition.
5. Plan the test-driven loop: first evidence (failing test, characterization test, contract check, or reproduction), smallest slice to turn it green, and the refactor step after.

**Present using the Phase 2 template.** Ask: "Approved, start implementation" / "Adjust the plan — I'll clarify below" / "Stop — this needs rethinking".

**STOP. Do not write any code until the plan is approved.**

### Phase 3 — DRY Analysis

Search before writing new code: validators to extend, similar use cases/handlers, shared utilities, existing data access for the same entity, and constants/configuration already defined. Document every reuse opportunity.

If findings change the approved plan materially (a planned service can extend an existing one, a planned abstraction already exists), ask: "Update the plan as suggested" / "Keep the original plan" / "Discuss before deciding". Minor reuse (shared constant, existing helper) needs no confirmation — apply it and note it in Phase 7.

### Phase 4 — Implementation

Write code following [standards.md](standards.md).

**Before writing each layer, detect the stack and load its reference** — full procedure in [reference.md](reference.md#stack-detection):

1. Detect the stack per file from its extension and nearest manifest (`package.json`, `tsconfig.json`, `*.csproj`/`*.sln`, `pyproject.toml`/`requirements.txt`, `go.mod`, `Cargo.toml`; `*.bicep`/`*.tf` → IaC). In monorepos each file follows its nearest manifest. If ambiguous, ask.
2. If the stack skill is installed (`../<stack>-core/SKILL.md` exists), load only what the current step needs: `../<stack>-core/architecture.md` for boundaries, `../<stack>-core/patterns.md` for implementation idioms (or the equivalent files its `SKILL.md` lists). For infrastructure, use the `iac` skill ([../iac/standards.md](../iac/standards.md)).
3. If no stack skill is installed, apply the universal engineering principles and the project's existing conventions.

For every file created or modified:

- Respect layer boundaries strictly (no infrastructure imports in domain or core)
- Pass dependencies in (constructor/factory/parameters) — never construct services inside business logic
- Require authentication on all protected endpoints; validate all inputs at the boundary
- Use structured logging with semantic properties
- Handle every failure case explicitly — no silently swallowed errors
- Decompose monolithic functions into atomic, well-named units

**Hard stop on scope creep:** if implementation reveals work beyond the Phase 2 approval, describe it and ask: "Expand scope — include it" / "Exclude it — log as follow-up" / "Stop — re-plan from Phase 2".

### Phase 4b — Incremental Checks

After each file, run the 5-category scan from [incremental-checks.md](incremental-checks.md): anti-patterns, naming & readability, structure & layer boundaries, async and concurrency correctness, security surface. Fix findings before moving to the next file.

### Phase 5 — Testing

If the stack skill is installed, load `../<stack>-core/testing.md` before writing tests.

- Confirm the Phase 1/2 evidence plan was followed, or record why it changed
- Unit tests for domain logic and business rules (isolated, no real I/O)
- Integration tests for infrastructure adapters and external services
- Assert behaviour, not implementation details; cover happy path, edge cases (null, empty, boundary), and failure paths
- Bug fixes include regression coverage when feasible

Run the project's test suite. All tests must pass before continuing.

### Phase 6 — Self-Review

Work through the self-review checklist in [standards.md](standards.md). If the stack skill is installed, also load `../<stack>-core/security.md` and `../<stack>-core/observability.md` (and `../<stack>-core/delivery-checks.md` when the stack provides it). Then confirm:

- [ ] **Security** — inputs validated, no secrets in code/config, protected endpoints authenticated, no sensitive data in logs
- [ ] **Observability** — structured logs on important operations, correlation ID propagated across async/cross-service flows, health check updated for new dependencies
- [ ] **Architecture** ([../architect/review-lenses.md](../architect/review-lenses.md)) — dependency direction correct, no domain logic in handlers/controllers/infrastructure, contracts don't expose internal models
- [ ] **General** — readability, SOLID, DRY, decomposition, adequate tests, no unrelated changes, IaC updated if infrastructure changed

### Phase 7 — Summary

Present the Phase 7 template from [validation-templates.md](validation-templates.md): what was built, files created/modified, decisions and why, trade-offs accepted, known limitations or follow-ups, and the justification for any new structural complexity.

### Phase 8 — Automated Verification

Run the project's build, test, and format/lint suite. All must pass. Take the commands from the injected `../code-review/commands-<stack>.md` for the stack, or the project's own scripts — never assume a toolchain ([reference.md](reference.md#build-test-lint-commands)). If any step fails, fix and re-run.

### Phase 9 — Delegate to Code Review

| Condition | Action |
|-----------|--------|
| 3 or more files changed | Delegate |
| Any Domain or Application layer touched | Delegate |
| Security surface modified (auth, input validation, secrets, permissions) | Delegate |
| Config, docs, or test files only — no production logic changed | Skip |
| Single file, fewer than 20 lines changed, no logic change | Skip |

Any Delegate condition wins over every Skip condition. For **Trivial** tasks, skip is the default unless a Delegate condition applies.

**When delegating**, complete the `/review Handoff` template from [validation-templates.md](validation-templates.md) and delegate to the `review` agent:

```
/review
[paste completed /review Handoff template]
```

The `review` agent runs in an isolated context, which is what makes the validation independent. If the agent is unavailable, run the `code-review` skill ([../code-review/SKILL.md](../code-review/SKILL.md)) directly and note that the review shared this session's context.

**When skipping**, note the reason inline (e.g. "Skipping review — single config file change, no logic modified").

Address all blockers before Phase 10.

### Phase 10 — Commit

Ask for the commit prefix (`feat`, `fix`, `refactor`, `chore`). Review the diff shape and prefer atomic commits grouped by functional intent (refactors apart from behaviour changes; tests/docs/config and dependency changes easy to identify). Format: `<prefix>(<scope>): <short description>` plus a body explaining what changed and why. Create a PR if the branch is not the default branch, with Problem, Approach, What changed, Validation, Risks / follow-ups. Read [workflow-reference.md](workflow-reference.md#commit-and-pr-format) when the change needs several commits or the project has no commit convention.

### Phase 10.5 — System Feedback *(optional)*

After the commit, ask one multi-select question: did this cycle reveal a pattern for [standards.md](standards.md), an antipattern for [antipatterns.md](antipatterns.md), an ADR-worthy decision, a workflow friction point, or nothing? If anything other than "nothing", log it as described in [workflow-reference.md](workflow-reference.md#system-feedback). Never edit installed skill or rule files directly.

---

## Supporting Files

- [antipatterns.md](antipatterns.md) — canonical anti-pattern list
- [incremental-checks.md](incremental-checks.md) — per-file quality scan
- [standards.md](standards.md) — DO/DON'T examples, self-review checklist
- [validation-templates.md](validation-templates.md) — phase output and handoff templates
- [reference.md](reference.md) — stack detection, stack reference loading, build/test commands, search patterns
- [workflow-reference.md](workflow-reference.md) — fast-track, developer profiles, commit/PR format, system feedback
- [../shared/artifact-writing-contract.md](../shared/artifact-writing-contract.md) — artifact write locations
- [../shared/context-provider-policy.md](../shared/context-provider-policy.md) — optional graph/MCP context rules
- [../shared/narrative-delivery-policy.md](../shared/narrative-delivery-policy.md) — narrative tickets, commits, PRs, checkpoints, memory
- [../shared/test-driven-delivery-policy.md](../shared/test-driven-delivery-policy.md) — evidence planning and test-first loops

## Related Skills

| Need | Skill |
|------|-------|
| Design trade-offs or architectural decisions in Phase 0 | `architect` — [decision-heuristics.md](../architect/decision-heuristics.md), [tradeoffs.md](../architect/tradeoffs.md) |
| Architectural antipatterns in the proposed design | `architect` — [antipatterns.md](../architect/antipatterns.md) |
| Structural pattern selection | `architect` — [patterns.md](../architect/patterns.md) |
| Stack idioms, testing, security, observability | `<stack>-core`, if installed — e.g. `../<stack>-core/patterns.md` |
| Infrastructure changes | `iac` — [standards.md](../iac/standards.md) |
| Durable lessons from this work | `learning` — [SKILL.md](../learning/SKILL.md) |
