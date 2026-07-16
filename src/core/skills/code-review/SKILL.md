---
name: code-review
description: Systematic, evidence-based code review — runs mandatory searches before any manual analysis, then produces a structured report with severity-classified findings. Stack-agnostic core with stack-specific searches and commands injected at install time. Use when the user says "/review", "code review", "review this", "PR review", "check this code", "audit this", "review these files", or when delegated from the lead skill at Phase 9.
---

# Code Review

## Invoke Command

```
/review
Files changed: [list of files]
Lens: [all | engineering | security | performance]   (optional, defaults to all)
```

Or when delegated from the lead skill, the file list is passed automatically.

> Not sure which skill to use? Start with `/start` — it classifies intent and routes to the right skill.

---

## Review Lenses

A complete review examines code through three lenses. Each has a distinct focus and catches a different class of issue.

| Lens | Focus | Where its checklist lives |
|------|-------|---------------------------|
| **Engineering** (default) | Clean code, SOLID, architecture, readability, maintainability, error handling | Phase 3 checklists in this skill |
| **Security** | OWASP Top 10, threat model for sensitive flows, input/auth/crypto/data handling | Security Checklist (OWASP) in [reference.md](reference.md) |
| **Performance** | Algorithmic complexity, N+1 access, resource usage, scalability under load | Phase 3 "Performance & complexity" criterion |

### Multi-pass protocol

- **Standard review** (default): apply all three lenses in a single pass.
- **High-risk review** — when the change touches a security surface, modifies a public contract, or spans many files: run one focused pass per lens. A focused pass keeps attention on a single class of issue, which surfaces findings a combined pass tends to miss. Run focused passes as separate `/review` invocations (isolated context) when possible.
- **Consolidate**: merge findings across passes into one report. De-duplicate by file + line; when two passes flag the same location, keep the highest severity and note both lenses. Never ship overlapping duplicate findings.

The `Lens:` value in the handoff scopes a single focused pass; omit it (or use `all`) for a standard review.

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

<!-- ar:commands:start -->
- **TypeScript/Node**: [commands-typescript.md](commands-typescript.md)
- **.NET/C#**: [commands-dotnet.md](commands-dotnet.md)
- **Rust**: [commands-rust.md](commands-rust.md)
<!-- ar:commands:end -->

Run the build and test commands for your project's stack(s).

---

### Phase 2 — Systematic Review

#### 2a — Run All Mandatory Searches

Before executing searches, check whether `.cursor/config/review-config.md` exists. If it does, read it and skip any category marked as `disabled`.

**Universal searches (all projects):**

Execute every enabled search in [systematic-searches-base.md](systematic-searches-base.md). These are language-agnostic security and quality patterns.

**Stack-specific searches:**

Check `agent-runway.json` (or legacy `cursor-runway.json`) for installed stacks, then execute searches from:

<!-- ar:searches:start -->
- **TypeScript**: [searches-typescript.md](searches-typescript.md)
- **.NET/C#**: [searches-dotnet.md](searches-dotnet.md)
- **React**: [searches-react.md](searches-react.md)
- **Rust**: [searches-rust.md](searches-rust.md)
<!-- ar:searches:end -->

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
- Naming & readability
- Anti-patterns and unnecessary complexity
- SOLID principles
- Error handling
- Structured logging
- Performance & complexity — algorithmic cost, N+1 access, unbounded allocations, avoidable work in hot paths

> The layer checklists below describe clean-architecture concerns and are stack-neutral. Stack-specific deep checklists (e.g. the .NET examples in [reference.md](reference.md)) apply when that stack is installed.

**Domain / core layer:**
- No framework or infrastructure dependencies
- Behaviour lives on entities, not anaemic data bags
- Invariants enforced in constructors/factory methods
- Domain events raised for cross-aggregate side effects

**Application / use-case layer:**
- Each handler/use case has a single responsibility
- Inputs validated at the boundary
- No direct data-context access — depend on repository/abstraction interfaces
- Cancellation/abort tokens propagated through async calls

**Infrastructure layer:**
- Data queries parameterised — no string-concatenated queries
- Migrations backward-compatible
- No business logic — pure adapters

**API / interface layer:**
- Authorisation enforced on every protected endpoint
- Request payloads validated before reaching the handler
- Response contracts do not expose internal models
- Consistent, correct status codes

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
`Security` | `Architecture` | `SOLID` | `Async` | `Data Access` | `Error Handling` | `Testing` | `Observability` | `Performance` | `IaC` | `Naming` | `DRY`

**Prioritisation principle:**

When triaging what must be addressed first, order by: `security > correctness/functionality > maintainability > style`. A lower-severity security finding still outranks a higher-severity style nitpick.

---

### Phase 5 — Generate Report

Output the review report using the template from [templates.md](templates.md).

Save to: `.agent-runway/logs/reviews/YYYY-MM-DD-<branch-or-scope>.md` (or present inline if filesystem writes are not available).

The saved report must include the machine-readable verdict block from [templates.md](templates.md) so `agent-runway metrics` can read it.

---

### Phase 6 — Verification Contract

Final automated check — run the build, test, and format/lint commands for the project's stack(s) (see the commands file referenced in Phase 1):

| Stack | Commands |
|-------|----------|
| .NET | `dotnet build --no-incremental && dotnet test && dotnet format --verify-no-changes` |
| Node.js | `npm run build && npm test && npm run lint` |
| Other | the project's equivalent build, test, and format/lint commands |

Deliver final verdict:

- **APPROVE** — no blockers, all high findings addressed or acknowledged
- **REQUEST CHANGES** — blockers or unresolved high findings present
- **NEEDS DISCUSSION** — architectural concerns requiring team decision

---

## Supporting Files

- [systematic-searches.md](systematic-searches.md) — 21 mandatory search patterns
- [templates.md](templates.md) — report output templates
- [reference.md](reference.md) — review checklists per concern
- [../shared/artifact-writing-contract.md](../shared/artifact-writing-contract.md) - artifact write locations

---

## Related Skills

Use the following skills for deeper reasoning when needed:

| Need | Skill |
|------|-------|
| Apply architectural review lenses (boundaries, complexity, contracts) | Use `architect` if installed |
| Identify architectural antipatterns beyond the local checklist | Use `architect` if installed |
| Evaluate whether a design trade-off is well-reasoned | Use `architect` if installed |
| Deep stack-specific review | Use the installed stack skill, such as `dotnet-core`, `typescript-core`, `node-core`, or `react-core` |
