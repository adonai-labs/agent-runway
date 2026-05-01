# Validation Templates — Phase Checkpoint Output

Use these templates when presenting gate output to the developer.

---

## Phase 0 — Exploration & Alternatives

```markdown
## Phase 0 — Exploration & Alternatives

### Problem Statement
[Restated problem in clear terms]

### Existing Patterns Found
- [Pattern/file found] — [relevance to this feature]
- [Pattern/file found] — [relevance to this feature]

### Proposed Approaches

#### Option A — [Name]
- **Approach**: [How it works]
- **Pros**: [Benefits]
- **Cons**: [Trade-offs]
- **Risk**: [What could go wrong]

#### Option B — [Name]
- **Approach**: [How it works]
- **Pros**: [Benefits]
- **Cons**: [Trade-offs]
- **Risk**: [What could go wrong]

#### Option C — [Name] *(if applicable)*
[Same structure]

### Recommendation
**Option [X]** — [One-sentence rationale]

---
**GATE: Approve to proceed to Phase 1, or request changes.**
```

---

## Phase 1 — Requirement Analysis

```markdown
## Phase 1 — Requirement Analysis

### Functional Scope
[What the feature does — bullet points]

### Out of Scope
[What this explicitly does NOT cover]

### Affected Areas
| Layer | Component | Change Type |
|-------|-----------|-------------|
| Domain | [Entity/VO] | [New / Modified] |
| Application | [Command/Query] | [New / Modified] |
| Infrastructure | [Repository/Migration] | [New / Modified] |
| API | [Endpoint/DTO] | [New / Modified] |

### Dependencies
- [External service / event / job]

### Non-Functional Requirements
- Security: [considerations]
- Performance: [constraints]
- Observability: [logging/metrics needs]

### Open Questions
1. [Question needing dev clarification]

---
**GATE: Confirm scope and answer open questions before Phase 2.**
```

---

## Phase 2 — Implementation Plan

```markdown
## Phase 2 — Implementation Plan

### New Files
| File | Layer | Responsibility |
|------|-------|----------------|
| `Features/Orders/CancelOrder/CancelOrderCommand.cs` | Application | Command definition |
| `Features/Orders/CancelOrder/CancelOrderHandler.cs` | Application | Handler |
| ... | ... | ... |

### Modified Files
| File | Change |
|------|--------|
| `Domain/Orders/Order.cs` | Add `Cancel()` method |
| ... | ... |

### Domain Changes
[Entities, value objects, domain events affected]

### Infrastructure Changes
[EF Core migrations, new repository methods, external integrations]

### IaC Changes Required
[New Azure resources, config entries, environment variables]

### Anti-Patterns to Avoid
[Reference to specific items in antipatterns.md]

### Reuse Identified (preliminary)
[Phase 3 will confirm via search]

---
**GATE: Approve plan before implementation begins.**
```

---

## Phase 7 — Implementation Summary

```markdown
## Phase 7 — Implementation Summary

### What Was Built
[One paragraph description]

### Files Changed
| File | Action | Description |
|------|--------|-------------|
| `path/to/file.cs` | Created | [Purpose] |
| `path/to/file.cs` | Modified | [What changed] |

### Decisions Made
| Decision | Rationale |
|----------|-----------|
| [Used Result<T> pattern] | [Avoids exception-as-control-flow for expected failures] |

### Trade-offs Accepted
- [Trade-off 1]

### Known Limitations / Follow-up Tasks
- [ ] [Follow-up item]

### Test Coverage
- Unit tests: [count] — covering [scenarios]
- Integration tests: [count] — covering [scenarios]

### Automated Verification
- `dotnet build`: ✅
- `dotnet test`: ✅
- `dotnet format --verify-no-changes`: ✅
```

---

## Phase 0 — /architect Handoff

Pass this context block to the `architect` subagent when delegating a Complex task.

```markdown
## /architect Handoff

### Task Classification
- **Classification**: Complex
- **Signals**: [Which of the 3 signals triggered Complex: design decision, multi-layer, contract change]
- **Ticket**: [Ticket key or inline description]

### Problem Statement
[What needs to be built or decided — restated clearly, not copied verbatim from the ticket]

### Codebase Context
- **Bounded context**: [Name, or "not documented"]
- **Existing patterns in use**: [e.g. CQRS with MediatR, Result<T>, feature-first folders]
- **Layers in scope**: [Domain / Application / Infrastructure / API / IaC]

### Existing Code Found
| File / Pattern | Relevance |
|---|---|
| [Path or pattern name] | [How it relates to this task] |
| [Path or pattern name] | [How it relates to this task] |

### Constraints
- [Technical constraints: existing database, shared schema, external API contract]
- [Team constraints: timeline, skill level, deployment cadence]
- [Business constraints: backward compatibility, feature flag required]

### What the Architect Must Deliver
1. 2–3 distinct approaches with trade-offs
2. A recommendation with rationale grounded in decision heuristics
3. Open questions that need developer or PO input before proceeding
```

---

## Phase 9 — /review Handoff

Pass this context block to the `review` subagent (or code-review skill) when delegating. This must be **self-contained** — the reviewer has no access to prior conversation history.

```markdown
## /review Handoff

### Overview
- **Task classification**: Trivial / Standard / Complex
- **Feature**: [One sentence — what was built and why]
- **Ticket**: [Key or "inline task"]

### Scope
**In scope:**
- [What was included — from Phase 1]

**Out of scope:**
- [What was deliberately excluded — from Phase 1]

### Acceptance Criteria
- [Criterion 1 — from ticket or Phase 1]
- [Criterion 2]
- [Criterion 3]

### Architectural Decision (if Complex task)
- **Approach chosen**: [Option name from Phase 0]
- **Rationale**: [One sentence — why this over alternatives]
- **Alternatives rejected**: [Option names and one-line reason each]

### Files Changed
| File | Action | Layer |
|------|--------|-------|
| `path/to/file.cs` | Created / Modified | Domain / Application / Infrastructure / API |

### Key Decisions Made
| Decision | Rationale | Phase |
|----------|-----------|-------|
| [e.g. Used Result<T> instead of exceptions] | [Why] | Phase 0 / Phase 2 |

### Self-Review Findings (Phase 4b / Phase 6)
| Finding | Resolution |
|---------|------------|
| [Issue found during incremental checks] | [How it was resolved] |
| [Issue found during self-review] | [How it was resolved] |

If no findings: "No issues found during incremental checks or self-review."

### Known Risks and Trade-offs Accepted
- [Trade-off accepted that warrants closer review]
- [Open risk the reviewer should pay attention to]

If none: "No known risks beyond standard implementation."

### Testing
- **Level**: Full / Smoke / None
- **Justification**: [Why this level was appropriate]
- Unit tests: [count] — covering [scenarios]
- Integration tests: [count] — covering [scenarios]

### Automated Verification
- `dotnet build`: ✅ / ❌
- `dotnet test`: ✅ / ❌
- `dotnet format --verify-no-changes`: ✅ / ❌
```
