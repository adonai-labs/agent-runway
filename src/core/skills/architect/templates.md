# Templates

Reusable output templates for architectural work.

---

## Architecture proposal

```markdown
## Architecture Proposal — [Name]

### Context
[Brief description of the problem being solved and the constraints it operates under]

### Goals
- [What the design must achieve]
- [What it must not compromise]

### Options considered

#### Option A — [Name]
[Brief description]
- Strengths: [list]
- Weaknesses / risks: [list]

#### Option B — [Name]
[Brief description]
- Strengths: [list]
- Weaknesses / risks: [list]

### Recommendation
[Chosen option with rationale]

### Boundary and dependency structure
[How components relate to each other; which layer / module owns what]

### Key trade-offs accepted
[What is being given up in exchange for what]

### Open questions
[What needs to be resolved before implementation proceeds]

### Review conditions
[When should this design be revisited or challenged?]
```

---

## Architecture Decision Record (ADR)

```markdown
## ADR-[number] — [Title]

**Status**: Proposed | Accepted | Deprecated | Superseded by ADR-[n]
**Date**: [YYYY-MM-DD]
**Deciders**: [Names or roles]

### Context
[The situation and forces that required a decision]

### Decision drivers
- [Key constraint, goal, or principle this decision must honour]

### Options considered

| Option | Summary | Key trade-off |
|--------|---------|---------------|
| A | ... | ... |
| B | ... | ... |

### Decision
We chose [Option X] because [rationale].

### Consequences

**Positive**
- [What this makes easier or safer]

**Negative / risks**
- [What this gives up or introduces as new cost]

### Review conditions
[What would cause us to revisit this decision?]
```

---

## Architecture review report

```markdown
## Architecture Review — [System / Component / Change]

**Reviewer**: [Name or role]
**Date**: [YYYY-MM-DD]
**Scope**: [What was reviewed]

### Summary

| Lens | Verdict | Notes |
|------|---------|-------|
| Complexity proportionality | good / concern / blocker | |
| Dependency direction | good / concern / blocker | |
| Change safety | good / concern / blocker | |
| Testability | good / concern / blocker | |
| Contract quality | good / concern / blocker | |
| Observability | good / concern / blocker | |
| Security boundaries | good / concern / blocker | |
| Team cognitive load | good / concern / blocker | |

### Overall verdict
`Approved` | `Approved with concerns` | `Needs revision` | `Blocked`

---

### Findings

#### [BLOCKER] [Short title]
**Lens**: [name]
**Observation**: [What was found]
**Impact**: [What risk or harm this creates]
**Recommendation**: [What to change and why]

#### [CONCERN] [Short title]
...

#### [INFORMATIONAL] [Short title]
...

---

### What is well designed
- [Specific positive observations worth preserving]

### Prerequisites for approval (if blocked or needs revision)
- [ ] [Required change]
- [ ] [Required change]
```

---

## Trade-off analysis

```markdown
## Trade-off: [Topic]

### Context
[Why this decision matters here]

### Option A — [Name]
**Pushes toward** — [forces]
**Gives up** — [costs]
**Signs of over-application** — [what goes wrong when this is pushed too far]

### Option B — [Name]
**Pushes toward** — [forces]
**Gives up** — [costs]
**Signs of over-application** — [what goes wrong when this is pushed too far]

### Relevant heuristics
- [Heuristic reference from decision-heuristics.md]

### Recommendation
[Which option, under what conditions, with what caveats]

### Conditions that would change this recommendation
- [If X, reconsider]
```

---

## Boundary definition

```markdown
## Boundary: [Module / Service / Context name]

### Responsibility
[Single sentence: what this boundary owns and decides]

### Reason to change
[What business or technical driver would cause this boundary to change]

### What is inside
- [Types, rules, operations, data owned by this boundary]

### What is outside
- [What explicitly does not belong here]

### Published interface
- [Commands accepted]
- [Events produced]
- [Queries served]

### Dependencies
- [Other boundaries it depends on]
- [What it expects from each dependency]

### Ownership
[Team or role responsible for this boundary]
```

---

## Incident analysis

```markdown
## Incident Analysis — [Short title]

**Date**: [YYYY-MM-DD]
**Severity**: [P1 / P2 / P3]
**Duration**: [How long the incident lasted]

### Timeline
| Time | Event |
|------|-------|
| HH:MM | [What happened] |

### Proximate cause
[The immediate technical failure]

### Contributing causes
[Design, process, or operational factors that enabled or amplified the failure]

### Architectural implications
- [What property of the design made this possible or harder to detect]

### Recommendations
| Priority | Change | Rationale |
|----------|--------|-----------|
| High | ... | ... |

### Review conditions
[Changes needed before marking this incident closed from an architecture perspective]
```
