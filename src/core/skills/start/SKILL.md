---
name: start
description: Entry point for any development task. Understands what the developer wants to do, classifies the intent and complexity, loads relevant project context, and routes to the right skill. Use when a developer doesn't know where to start, says "/start", "where do I begin", "I need to", "how do I", "I want to build", "I need to fix", or provides any vague or unclassified description of work.
---

# Start

## Invoke Command

```
/start <description of what you want to do>
```

Examples:
- `/start I need to add email notifications when an order is placed`
- `/start there's a bug where users can see other users' orders`
- `/start we need to provision a new Azure Service Bus namespace`
- `/start the payment service is getting too complex, it needs cleaning up`
- `/start PROJ-501`

> Not sure if this is the right skill? It always is — `/start` figures out where to go from here.

---

## What this skill does

Takes any description of work — vague, technical, ticket-based, or in plain language — and produces:

1. A clear classification of what kind of work this is
2. The right skill to use and why
3. Relevant project context pre-loaded for that skill
4. A ready-to-go handoff so the developer can proceed immediately

---

## Workflow — 3 Phases

---

### Phase 1 — Understand the intent

Read the developer's description carefully. Identify the primary intent:

| Intent signal | Likely category |
|---|---|
| "add", "build", "implement", "create", "new endpoint/feature" | Implementation |
| "autonomous", "without supervision", "run unattended", "low supervision" | Autonomous implementation |
| "fix", "broken", "not working", "bug", "error", "wrong behaviour" | Bug fix |
| "review", "check this", "audit", "PR review" | Code review |
| "checkpoint", "save state", "handoff", "pause here", "resume later" | Checkpoint |
| "clean up", "refactor", "simplify", "too complex", "hard to read" | Refactor |
| "infrastructure", "provision", "Bicep", "Terraform", "Azure resource" | IaC |
| "design", "should I use", "trade-off", "architecture decision", "ADR" | Architecture |
| "validate", "is this ticket ready", "check this story" | Ticket validation |
| "product-ready", "PO review", "business readiness", "evaluate this spec as PO" | PO evaluation |
| Jira ticket key (e.g. `PROJ-123`) or path to `.md` file | Ticket validation → then re-classify |

If the intent is genuinely ambiguous after reading the description, use `AskQuestion` with a single-select:

```
What best describes what you want to do?
- Add or change functionality (feature or fix)
- Add or change functionality autonomously (low supervision)
- Clean up or restructure existing code (refactor)
- Review completed work (code review)
- Save current work state (checkpoint)
- Provision or change infrastructure (IaC)
- Think through a design decision (architecture)
- Check if a ticket is ready for development (validate)
- Evaluate product readiness of a spec/ticket (po-eval)
```

Do not ask this question if the intent is clear.

---

### Phase 2 — Load context and classify

#### If intent is Implementation or Bug fix

Apply the three classification signals from `/lead`:

1. Does this involve a design decision? (new pattern, layer boundary, architectural choice)
2. Does this touch more than one layer? (Domain, Application, Infrastructure, API)
3. Does this change a contract? (API shape, event schema, DTO, database migration)

| Result | Classification |
|---|---|
| None of the above | **Trivial** |
| Any one | **Standard** |
| Two or more, or new subsystem, or breaking change | **Complex** |

Then apply decision-governance risk scoring:

- Impact: low/medium/high
- Reversibility: reversible/hard-to-reverse/irreversible
- Uncertainty: low/medium/high
- Cost of error: low/medium/high

Contrarian trigger (any true):
- impact is high and reversibility is hard-to-reverse or irreversible
- uncertainty is high
- contract/public interface change with ambiguous outcomes
- architecture decision with multiple viable paths

Execution routing class:
- **Execution-only**: low risk + reversible + low uncertainty
- **Execution+validation**: medium risk or multi-layer change
- **Execution+contrarian**: contrarian trigger active

Short-path rule:
- If routing class is `Execution-only`, prefer minimal process path (`/express` or `/lead` Fast-Track Mode when plan is already clear).
- Do not force extended discovery gates for execution-only tasks.

**Then load project context** (only what exists — skip gracefully if files are absent):

- If docs exist at `.agent-runway/docs/architecture/architecture.md` or similar: read and summarise the relevant bounded context
- If docs exist at `.agent-runway/docs/architecture/decisions.md` or `.agent-runway/docs/adr/`: identify ADRs relevant to this work
- If the codebase is available: note the layers and patterns already in use

Present a brief context summary:
```
Project context loaded:
- Bounded context: [name, or "not documented yet"]
- Relevant ADRs: [list, or "none found"]
- Existing patterns to follow: [e.g. CQRS with MediatR, Result<T>, feature-first folders]
- Layers touched by this work: [Domain / Application / Infrastructure / API]
```

If no project docs exist yet, note it plainly:
```
No project docs found. Proceeding with standard patterns for the detected stack.
The tech lead can add project context to .agent-runway/docs/ to improve future routing.
```

#### If intent is Autonomous implementation

Route directly to `/autonomous-lead`.

Before handoff, load the same project context as Implementation/Bug fix and add this note:

```
Autonomous mode selected:
- Execution will proceed without interactive approval gates
- Decisions will be logged under .agent-runway/logs/autonomous-runs/
- ADRs will be created for architectural-impact decisions
```

#### If intent is Refactor

Check complexity signals from `/refactor`. Ask one clarifying question if the target is not clear:
```
What is the primary goal?
- Reduce complexity in a specific class or method
- Decouple a layer (e.g. remove infrastructure from domain)
- Rename and clarify intent across a module
- Extract reusable logic
```

#### If intent is IaC

Identify the cloud target (Azure by default) and whether this is new infrastructure, a change to existing, or a review.

#### If intent is Architecture

Identify whether this is a decision to make (use `/architect`), a review of an existing proposal (use `/architect`), or an ADR to write (use `/architect`).

#### If intent is Ticket validation

If a Jira key or `.md` file was provided, proceed directly to `/validate`. If not, ask for one.

#### If intent is PO evaluation

If a spec/ticket path or Jira key was provided, proceed directly to `/po-eval`. If not, ask for one.

#### If intent is Code review

Ask for the list of files or the branch/PR reference, then proceed to `/review`.

#### If intent is Checkpoint

Route directly to the checkpoint skill.

---

### Phase 3 — Route with handoff

Present the routing decision clearly.

For **Implementation and Bug fix** tasks, use the following routing rules in order:

1. If routing class is **Execution+contrarian**: recommend `/lead` with mandatory contrarian gate before implementation.
2. If **Complex** → recommend `/lead`. Always. A Complex task routed to `/express` should only happen if the developer explicitly overrides after seeing an escalation signal.
3. If **Standard** and the developer mentions they already have a plan or approach → recommend `/lead` (Fast-Track Mode).
4. If **Standard** and no plan mentioned:
   - Small, well-scoped, single-layer → suggest `/express` as an option alongside `/lead`
   - Anything else → recommend `/lead`

The recommendation is always a suggestion, not a command. Present it as:

```
## What I found

**Intent**: [Implementation — Standard / Bug fix — Trivial / Refactor / IaC / Architecture / Review]
**Classification**: [Trivial / Standard / Complex]
**Risk profile**: [Impact / Reversibility / Uncertainty / Cost of error]
**Routing class**: [Execution-only / Execution+validation / Execution+contrarian]

**Why**: [One sentence — e.g. "This adds a new endpoint and touches Application and API layers, which makes it a Standard implementation task."]

**Context for this work**:
- [Relevant architectural constraint or pattern]
- [Relevant ADR or decision, if found]
- [Layer(s) in scope]
- [Anything the developer should know before starting]

Recommended: /[command] ([brief reason])
Alternatives: [other applicable commands]
```

For non-implementation intents (Refactor, IaC, Architecture, Review, Ticket validation, PO evaluation, Checkpoint), route directly to the relevant skill without the classification/alternatives block.

For Autonomous implementation intents, route directly to `/autonomous-lead` and include artifact logging obligations in the handoff summary.

If the task is **Complex**, add:

```
> This is a Complex task. /lead will invoke /architect in Phase 0 before any code is written.
> Before starting, consider reading: .agent-runway/docs/[relevant section] (if it exists)
```

If routing class is **Execution+contrarian**, also add:

```
> Contrarian gate required before build:
> /lead must document strongest counter-argument, at least one viable alternative, and a Go/Go-with-conditions/Stop verdict.
```

If no project docs exist for a Complex task, surface it explicitly:

```
> This is a Complex task but no architecture docs were found.
> Recommend: ask the tech lead or architect to document the relevant bounded context before starting.
> You can still proceed — /lead will explore the codebase in Phase 0.
```

---

## Portability note

This skill works on any project, regardless of stack. Project-specific context (bounded contexts, ADRs, domain model) lives in `.agent-runway/docs/` at the repo root. When docs exist, routing is richer. When they don't, the skill routes correctly using the codebase and detected stack patterns — and flags that docs would improve future routing.

The tech lead or architect owns keeping `.agent-runway/docs/` current. This skill reads it; it does not write it.

