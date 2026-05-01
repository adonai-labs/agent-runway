---
name: code-review
description: Systematic, evidence-based code review for .NET/C# — runs mandatory searches before any manual analysis, then produces a structured report with severity-classified findings. Use when the user says "/review", "code review", "review this", "PR review", "check this code", "audit this", "review these files", or when delegated from the lead skill at Phase 9.
---

# Code Review

## Invoke Command

```
/review
Files changed: [list of files]
```

Or when delegated from the lead skill, the file list is passed automatically.

> Not sure which skill to use? Start with `/start` — it classifies intent and routes to the right skill.

---

## Workflow — 6 Phases

---

### Phase 0 — Preparation

1. Read the review request. Identify all files in scope.
2. Determine context: is this a new feature, a bug fix, a refactor, or an infrastructure change?
3. Identify the architectural layers touched (Domain / Application / Infrastructure / API / IaC).
4. Note any stated constraints or acceptance criteria.

---

### Phase 1 — Initial Assessment

Classify each file in scope:

| File | Layer | Type | Risk Level |
|------|-------|------|-----------|
| `...` | Domain / Application / Infrastructure / API | New / Modified | High / Medium / Low |

Determine if build and test commands can be executed. If yes, run them before proceeding.

**Stack-specific build & test commands:**

Check `agent-runway.json` (or legacy `cursor-runway.json`) for installed stacks, then refer to the appropriate commands file:

- **TypeScript/Node**: [commands-typescript.md](commands-typescript.md)
- **.NET/C#**: [commands-dotnet.md](commands-dotnet.md)
- **Rust**: [commands-rust.md](commands-rust.md)

Run the build and test commands for your project's stack(s).

---

### Phase 2 — Systematic Review

#### 2a — Run All Mandatory Searches

Before executing searches, check whether `.cursor/config/review-config.md` exists. If it does, read it and skip any category marked as `disabled`.

**Universal searches (all projects):**

Execute every enabled search in [systematic-searches-base.md](systematic-searches-base.md). These are language-agnostic security and quality patterns.

**Stack-specific searches:**

Check `agent-runway.json` (or legacy `cursor-runway.json`) for installed stacks, then execute searches from:

- **TypeScript**: [searches-typescript.md](searches-typescript.md)
- **.NET/C#**: [searches-dotnet.md](searches-dotnet.md)
- **React**: [searches-react.md](searches-react.md)
- **Rust**: [searches-rust.md](searches-rust.md)

Document results: pattern, count, file locations.

**Expected: 0 matches for all critical patterns.**

#### 2b — Semantic Analysis

For each finding from 2a, perform semantic analysis:

- Is the pattern contextually acceptable (e.g., a test double intentionally catching all exceptions)?
- Does data flow correctly across service boundaries?
- Are EF Core relationships and lazy loading configured safely?
- Do migrations preserve backward compatibility?
- Are event handlers idempotent?

#### 2c — Format & Vulnerability Verification

Run the checks not already covered by Phase 1 (which established the build+test baseline).

Refer to your stack's commands file for format and vulnerability checks:

- **TypeScript/Node**: `npm run lint`, `npm audit`
- **.NET/C#**: `dotnet format --verify-no-changes`, `dotnet list package --vulnerable`
- **Rust**: `cargo fmt -- --check`, `cargo audit`

All must pass. Document any failures as Critical findings.

#### 2d — Document All Findings

For each finding, record:
- Category (from systematic search or manual review)
- File + line number (mandatory)
- Severity
- Code snippet

---

### Phase 3 — Detailed Review

Review each file against the relevant checklist from [reference.md](reference.md):

**All files:**
- Naming & readability (standards in [../lead/standards.md](../lead/standards.md))
- Anti-patterns (canonical list in [../lead/antipatterns.md](../lead/antipatterns.md))
- SOLID principles
- Error handling
- Structured logging

**Domain layer:**
- No framework dependencies
- Behaviour on entities, not just data bags
- Invariants enforced in constructors/factory methods
- Domain events raised for cross-aggregate side effects

**Application layer:**
- Handlers focused on a single use case
- Validation via FluentValidation
- No direct DbContext — repository interfaces only
- CancellationToken propagated

**Infrastructure layer:**
- EF Core queries parameterised
- Migrations backward-compatible
- No business logic

**API layer:**
- `[Authorize]` on all protected endpoints
- Request DTOs validated before handler call
- Response DTOs do not expose internals
- Consistent HTTP status codes

**IaC files:**
- All resources parameterised
- Secrets via Key Vault references
- Resources tagged
- What-if run before applying

---

### Phase 4 — Issue Classification

Classify each finding by two dimensions:

**Severity:**
- 🔴 **Blocker** — security flaw, data loss risk, broken functionality, build failure
- 🟡 **High** — SOLID violation, missing validation, poor error handling, N+1 query
- 🔵 **Medium** — naming, readability, DRY violation, missing test coverage
- ⚪ **Low / Nitpick** — style, minor suggestion, optional improvement

**Category:**
`Security` | `Architecture` | `SOLID` | `Async` | `Data Access` | `Error Handling` | `Testing` | `Observability` | `IaC` | `Naming` | `DRY`

---

### Phase 5 — Generate Report

Output the review report using the template from [templates.md](templates.md).

Save to: `review/<branch-name>-findings.md` (or present inline if branch is unknown).

---

### Phase 6 — Verification Contract

Final automated check:

```powershell
dotnet build --no-incremental
dotnet test
dotnet format --verify-no-changes
```

Deliver final verdict:

- **APPROVE** — no blockers, all high findings addressed or acknowledged
- **REQUEST CHANGES** — blockers or unresolved high findings present
- **NEEDS DISCUSSION** — architectural concerns requiring team decision

---

## Supporting Files

- [systematic-searches.md](systematic-searches.md) — 21 mandatory search patterns
- [templates.md](templates.md) — report output templates
- [reference.md](reference.md) — review checklists per concern
- [../lead/antipatterns.md](../lead/antipatterns.md) — canonical anti-pattern list (shared)
- [../lead/standards.md](../lead/standards.md) — DO/DON'T code examples

---

## Related Skills

Use the following skills for deeper reasoning when needed:

| Need | Skill |
|------|-------|
| Apply architectural review lenses (boundaries, complexity, contracts) | `architect` — see [review-lenses.md](../architect/review-lenses.md) |
| Identify architectural antipatterns beyond .NET-specific ones | `architect` — see [antipatterns.md](../architect/antipatterns.md) |
| Evaluate whether a design trade-off is well-reasoned | `architect` — see [tradeoffs.md](../architect/tradeoffs.md) |
| Deep review of .NET application patterns (CQRS, handlers) | `dotnet-core` — see [application-patterns.md](../dotnet-core/application-patterns.md) |
| Deep review of EF Core or infrastructure patterns | `dotnet-core` — see [infrastructure.md](../dotnet-core/infrastructure.md) |
| Deep review of observability wiring | `dotnet-core` — see [observability.md](../dotnet-core/observability.md) |
| Deep review of API design and contracts | `dotnet-core` — see [api-design.md](../dotnet-core/api-design.md) |
