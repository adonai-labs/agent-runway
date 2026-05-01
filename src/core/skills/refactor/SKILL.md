---
name: refactor
description: Guides structured refactoring of .NET/C# code to improve readability, maintainability, and SOLID/Clean Architecture alignment — without changing observable behaviour. Use when the user says "/refactor", "clean up", "improve this", "simplify", "restructure", "reduce complexity", "extract this", "decouple", "too complex", or wants to improve existing code quality.
---

# Refactor

## Invoke Command

```
/refactor <description or file reference>
```

Examples:
- `/refactor OrderService is too large`
- `/refactor extract validation logic from CreateOrderHandler`
- `/refactor replace switch on payment type with strategy pattern`
- `/refactor this method is doing too much` *(with file open)*

> Not sure which skill to use? Start with `/start` — it classifies intent and routes to the right skill.

---

## Core Principle

> Change structure, not behaviour. Every refactoring step must leave tests green.

If there are no tests, write characterisation tests first — they are the safety net.

---

## Workflow

### Step 1 — Understand Before Touching

Read [safe-refactoring.md](safe-refactoring.md) before starting any refactoring session.

- What does this code do end-to-end?
- Why does it need refactoring? Name the specific problem — see [complexity-signals.md](complexity-signals.md) to confirm refactoring is justified.
- Are there existing tests? If not, write characterisation tests first — see the safety net section in [safe-refactoring.md](safe-refactoring.md).
- What is the blast radius — what else depends on this?

### Step 2 — Detect Smells Systematically

Run the relevant searches from [systematic-smells.md](systematic-smells.md) against the target code. Document what you find.

Then name the specific problem using the smell table in [reference.md](reference.md) before proposing a fix. If the smell is not in the table, describe it in terms of the complexity signals from [complexity-signals.md](complexity-signals.md).

### Step 3 — Decide Scope and Priority

Use [complexity-signals.md](complexity-signals.md) to determine:

- Is this a micro, targeted, or structural refactoring?
- Is this code a change hotspot (changes frequently + high complexity)?
- For structural refactors, consult the `architect` skill before proceeding.

Priority order:
1. Remove duplication — it multiplies every other problem
2. Improve naming — often reveals deeper design issues
3. Extract methods — restore readability and testability
4. Introduce abstractions — only when a pattern clearly repeats
5. Restructure to correct layer — move misplaced logic to where it belongs

### Step 4 — Refactor Incrementally

Follow the incremental loop from [safe-refactoring.md](safe-refactoring.md): one change → run tests → review → commit → repeat.

Use patterns from [reference.md](reference.md). For every change:

- One commit per logical refactoring step
- Commit message format: `refactor(<scope>): <description>`
- No behaviour changes mixed with structural changes

### Step 5 — Validate

Run the verification steps from [safe-refactoring.md](safe-refactoring.md), then confirm:

- [ ] All existing tests pass
- [ ] No behaviour changed — only structure
- [ ] New unit tests added for extracted units if not already covered
- [ ] Naming is clearer after refactoring
- [ ] Complexity reduced: less nesting, shorter methods, clearer intent
- [ ] No new abstractions introduced without a clear need
- [ ] Anti-patterns from [../lead/antipatterns.md](../lead/antipatterns.md) not introduced
- [ ] Layer boundaries preserved — no infrastructure in Domain/Application
- [ ] Refactoring goal met — stop here, do not scope-creep

---

## What Refactoring Is Not

- Not adding new functionality — separate commit
- Not a performance optimisation — profile first, optimise after, validate with tests
- Not a style-only change — let `dotnet format` handle formatting

---

## Supporting Files

- [reference.md](reference.md) — smell table, refactoring patterns with before/after C# examples
- [systematic-smells.md](systematic-smells.md) — search commands to detect smells systematically
- [safe-refactoring.md](safe-refactoring.md) — characterisation tests, incremental strategy, blast radius, verification
- [complexity-signals.md](complexity-signals.md) — when to refactor, complexity indicators, prioritisation, knowing when to stop
- [../lead/antipatterns.md](../lead/antipatterns.md) — canonical anti-pattern list
- [../lead/standards.md](../lead/standards.md) — naming and code standards

---

## Related Skills

Use the following skills for deeper reasoning when needed:

| Need | Skill |
|------|-------|
| Choose the right architectural pattern for the refactor target | `architect` — see [patterns.md](../architect/patterns.md) |
| Validate the refactored design against architectural antipatterns | `architect` — see [antipatterns.md](../architect/antipatterns.md) |
| Check whether a boundary introduced during refactor is justified | `architect` — see [decision-heuristics.md](../architect/decision-heuristics.md) |
| Evaluate trade-offs of a structural refactoring approach | `architect` — see [tradeoffs.md](../architect/tradeoffs.md) |
| Apply correct .NET patterns after structural changes | `dotnet-core` — see [application-patterns.md](../dotnet-core/application-patterns.md) |
| Verify layer boundaries after moving code between layers | `dotnet-core` — see [architecture.md](../dotnet-core/architecture.md) |
| Run independent final validation after a large refactor | `code-review` — invoke with `/review` (see delegation criteria below) |

### When to delegate to `/review` after refactoring

| Condition | Action |
|-----------|--------|
| Structural refactor — layers moved, boundaries changed, abstractions introduced | Delegate |
| 3 or more files changed | Delegate |
| Any Domain or Application layer touched | Delegate |
| Micro refactor — rename, extract method, inline variable, single file | Skip |
| Style-only — formatting, comment cleanup, `dotnet format` output | Skip |

When skipping, note the reason inline before closing the session.
