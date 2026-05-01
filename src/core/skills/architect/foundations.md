# Foundations

Core principles, mental models, and execution modes for architectural reasoning.

This file consolidates three concerns that are used together when thinking about systems:
- **Principles** — the underlying forces that good architectural decisions honour
- **Mental models** — reusable lenses for reasoning about systems and decisions
- **Execution modes** — deliberate mental stances for different types of architectural work

---

## Part 1 — Principles

Universal engineering principles, independent of stack, framework, or language.

These are not rules to follow mechanically. They are the underlying forces that good architectural decisions consistently honour.

---

### 1. Business policy should not depend on infrastructure detail

The core of the system — its rules, decisions, and invariants — should not be shaped by database technology, framework conventions, transport protocols, or vendor SDKs.

Infrastructure is necessary. It belongs at the edges, not at the centre.

---

### 2. Architecture should express the domain, not the technology

When someone opens a repository, the structure should communicate what the system *does*, not what framework it uses.

Folders named after technical roles (`Controllers`, `Services`, `Repositories`) often obscure more than they reveal.

---

### 3. Boundaries should reflect different reasons to change

A boundary is only useful when the things inside it change for the same reason, and the things on either side change for different reasons.

Boundaries based on technical convention instead of change drivers tend to add coordination cost without reducing coupling.

---

### 4. Frameworks are tools, not the centre of gravity

A framework should be used to deliver the system. It should not define the business model, dictate the structure of use cases, or determine what the domain looks like.

The system should be able to survive a framework migration in its core logic.

---

### 5. APIs are contracts, not implementation leaks

A public API is an interface for consumers with explicit stability expectations. It is not a thin layer over internal storage or domain models.

Contracts should be designed for consumers, not for implementation convenience.

---

### 6. Observability must be designed alongside behaviour

If a system cannot explain what it is doing, it cannot be operated safely.

Logging, tracing, metrics, and health signals are part of the cost of operating the system. They are not decoration added after the fact.

---

### 7. Security belongs in defaults and boundaries, not in vigilance alone

Secure systems rely on safe defaults, explicit boundaries, and validated inputs — not on developers remembering to apply security measures each time.

Authentication, authorisation, input validation, and secret management should be structural, not optional.

---

### 8. Testability is a signal of design quality

If important business logic can only be tested through the full stack, it is usually placed or structured incorrectly.

Hard-to-test code often indicates excessive coupling, misplaced responsibility, or dependency on volatile infrastructure.

---

### 9. Distributed complexity must be justified by real need

Distributing a system introduces latency, partial failures, operational complexity, and coordination cost.

These costs are worth paying when independent deployment, ownership, or scaling boundaries are genuinely required. They are not worth paying in pursuit of scalability that has not been demonstrated as necessary.

---

### 10. Architecture is a strategy for reducing cost of change

An architecture is not a pattern showcase or a diagram exercise. Every structural decision should be defensible in terms of how it makes the system easier to understand, modify, operate, or extend over time.

Complexity that cannot be justified in those terms is accidental complexity.

---

### 11. Cohesion and loose coupling are the underlying goal

High cohesion means related things live together and move together. Low coupling means unrelated things can evolve independently.

Most structural decisions in software — layering, modularisation, service decomposition, API design — are expressions of this underlying principle.

---

### 12. Design for the next plausible change, not every possible future

Designing for hypothetical futures creates systems that are flexible in ways that never matter and rigid in ways that eventually do.

Invest changeability where change is observed or highly predictable. Leave other areas simple.

---

### 13. Clarity and maintainability are primary attributes

Code that is difficult to read, follow, or reason about accumulates hidden risk. Every change to opaque code carries higher regression probability.

Readability is not a cosmetic concern. It is a reliability concern.

---

### 14. The cost of a decision includes the cost of reversing it

Before accepting architectural complexity or introducing a pattern, consider the cost of undoing it later if it turns out to be wrong.

Prefer reversible decisions over irreversible ones at the same level of confidence.

---

## Part 2 — Mental Models

Reusable thinking frameworks for reasoning about systems, decisions, and architecture at any scale.

These are not methodologies to follow step by step. They are lenses to apply when thinking is unclear, decisions feel stuck, or a design is not settling correctly.

---

### 1. Reasons to change

**Core idea** — group things that change for the same reasons; separate things that change for different reasons.

**Apply when** — organising modules, choosing boundaries, questioning whether two concerns belong together.

**Question to ask** — "If this rule changes, what else must change with it?" If the answer consistently includes unrelated concerns, those concerns should be separated.

**Warning** — technical similarity is not the same as change cohesion. Two things can look similar but be driven by entirely different business forces.

---

### 2. Dependency inversion

**Core idea** — high-level policy should not depend on low-level mechanism. Both should depend on abstractions. Abstractions should not depend on details.

**Apply when** — placing interfaces, choosing direction of module dependencies, reviewing which layer owns what.

**Question to ask** — "If the database changes, does the business rule need to change?" If yes, the dependency direction is wrong.

**Warning** — this is not "always add an interface." It is "make sure policy is not shaped by mechanism."

---

### 3. The stable/volatile axis

**Core idea** — design the system so that stable things are not forced to change because of volatile things.

**Apply when** — deciding what to abstract, choosing which things should be direct vs indirected, evaluating risk from third-party dependencies.

**Stable** — business rules, domain invariants, core workflows.
**Volatile** — framework versions, external APIs, database engines, cloud vendor SDKs, UI frameworks.

**Question to ask** — "If this dependency changes, what proportion of the system must change with it?"

---

### 4. The cost of change

**Core idea** — every design decision is a wager about future change costs. The decision is good if it reduces the cost of the most likely changes, even if it increases the cost of unlikely ones.

**Apply when** — choosing between simple and extensible, modular and flat, layered and feature-sliced.

**Question to ask** — "What are the top three things that will change in this system in the next year? How expensive is each change under this design?"

---

### 5. Blast radius

**Core idea** — measure the scope of impact when something changes or fails. Prefer designs that minimise blast radius.

**Apply when** — evaluating distribution strategy, module boundaries, shared infrastructure, coupling between concerns.

**Question to ask** — "If I change X or X fails, how much else must change or fail with it?"

**Warning** — blast radius applies to code changes, data model changes, deployment changes, and runtime failures. Consider all four.

---

### 6. Conway's Law

**Core idea** — systems tend to reflect the communication structure of the organisations that build them.

**Apply when** — deciding where to draw module or service boundaries; evaluating ownership; assessing whether a proposed boundary will hold.

**Implication** — a microservices boundary without a matching ownership boundary will not stay clean. Structure the teams before or alongside the architecture.

**Question to ask** — "Does the proposed boundary match how the teams actually talk about and own their work?"

---

### 7. Accidental vs essential complexity

**Essential complexity** — the complexity inherent in the problem domain. It cannot be removed without changing what the system does.

**Accidental complexity** — complexity introduced by the solution. It could be reduced by a different choice.

**Apply when** — evaluating whether a design is simpler or harder than it needs to be; justifying additional patterns.

**Question to ask** — "Is this complexity present because the domain requires it, or because of how we chose to build it?"

---

### 8. Reversibility

**Core idea** — prefer reversible decisions over irreversible ones when confidence is low.

**Apply when** — making early architectural choices; selecting vendors; committing to data models; setting API contracts.

**Reversibility spectrum**
- Easily reversible: internal implementation details, function organisation
- Hard to reverse: public API contracts, persistent data models, shared infrastructure
- Nearly irreversible: published integration protocols, regulatory data structures

**Question to ask** — "How expensive is it to undo this decision if we turn out to be wrong?"

---

### 9. Feedback loops

**Core idea** — the value of a design choice can only be known through feedback. Short feedback loops produce better learning and safer evolution.

**Apply when** — evaluating whether to invest in automated tests, CI pipelines, integration environments, or feature flags before deploying something complex.

**Question to ask** — "How quickly will we know if this decision was wrong? Can we make that cycle shorter?"

---

### 10. The iceberg principle

**Core idea** — what is visible in the API or interface is usually a small fraction of what the system does. Most complexity lives below the surface.

**Apply when** — reviewing API contracts that seem too simple; evaluating whether consumers can safely use an API without knowing about its hidden behaviour.

**Question to ask** — "What assumptions is a consumer making about what lies below this interface? Are those assumptions safe to make?"

---

### 11. Two-pizza team and bounded ownership

**Core idea** — independent ownership of a boundary requires a team small and cohesive enough to understand and evolve it.

**Apply when** — planning service decomposition; assigning module responsibility; evaluating whether a boundary will hold over time.

**Question to ask** — "Can one team own this fully, with minimal coordination with other teams for normal changes?"

---

### 12. The map is not the territory

**Core idea** — diagrams, models, and abstractions represent reality but are not reality. Design decisions based on the map without testing against the territory produce fragile systems.

**Apply when** — reviewing architecture diagrams that look clean but are hard to implement; evaluating whether a proposed abstraction matches how things actually behave at runtime.

**Question to ask** — "Does this model match what actually happens when the system runs? What are the known deviations?"

---

### 13. The strangler fig pattern (as a mental model)

**Core idea** — when replacing or evolving a system, grow the new behaviour alongside the old, gradually routing more traffic to the new path, rather than replacing all at once.

**Apply when** — planning large refactors; migrating to new architectures; replacing subsystems.

**Question to ask** — "Can we run old and new in parallel, incrementally migrate, and validate at each step before committing?"

---

### 14. Optimise for reading, not writing

**Core idea** — code is read far more often than it is written. Optimising for write speed (using shortcuts, terse abstractions, or implicit conventions) creates long-term reading cost.

**Apply when** — reviewing naming, structure, abstraction levels, and comment density.

**Question to ask** — "If someone reads this in six months without context, will they understand what it does and why?"

---

## Part 3 — Execution Modes

Mental modes for different types of architectural work.

Switching mode deliberately — rather than applying one uniform approach to all tasks — produces better output, clearer reasoning, and less unnecessary scope expansion.

---

### Mode: Design

**Purpose** — produce a new architecture proposal or system design.

**Mental stance** — generative, hypothesis-driven, exploring multiple options before committing.

**Process**
1. Understand the problem and its forces before considering solutions
2. Identify what changes frequently, what does not, and where boundaries belong
3. Consider two or three candidate structures — do not immediately commit to the first pattern that comes to mind
4. Surface trade-offs explicitly for each candidate
5. Apply decision heuristics from [decision-heuristics.md](decision-heuristics.md)
6. Check against antipatterns from [antipatterns.md](antipatterns.md)
7. Select a candidate and document the reasoning

**Output** — architecture description, boundary definitions, data flow, trade-off summary, open questions.

**Discipline** — avoid designing for imaginary futures; state assumptions explicitly; surface constraints that would change the recommendation.

---

### Mode: Review

**Purpose** — evaluate an existing design proposal or implementation for quality, risk, and fitness.

**Mental stance** — critical, structured, looking for forces rather than preferences.

**Process**
1. Understand the context and intent before evaluating
2. Apply the relevant review lenses from [review-lenses.md](review-lenses.md)
3. Check for antipatterns from [antipatterns.md](antipatterns.md)
4. Identify what is well-designed and should be preserved
5. Identify what carries risk and why
6. Produce a graded, actionable report using templates from [templates.md](templates.md)

**Output** — review report with findings classified by severity, positives, and a clear verdict.

**Discipline** — distinguish personal preference from genuine risk; do not flag things that are merely unfamiliar; support all claims with reasoning.

---

### Mode: Trade-off analysis

**Purpose** — reason explicitly about a contested or unclear engineering decision.

**Mental stance** — balanced, adversarial toward both extremes.

**Process**
1. State both sides of the trade-off clearly
2. Identify what forces push in each direction
3. Identify what would change if one side is over-applied
4. Apply the relevant entry from [tradeoffs.md](tradeoffs.md)
5. State a recommendation with the rationale and conditions

**Output** — trade-off comparison, recommendation, and conditions that would change the recommendation.

**Discipline** — do not adopt a position before analysing both sides; acknowledge when the decision depends on unknown context.

---

### Mode: Decision record (ADR)

**Purpose** — capture an architecture decision in a durable, traceable format.

**Mental stance** — clear, precise, future-facing.

**Process**
1. State the decision context clearly
2. Identify the drivers (constraints, forces, goals)
3. List the options considered
4. State the chosen option
5. Explain why the other options were rejected
6. Identify known consequences and risks
7. State review conditions (when should this decision be revisited?)

**Output** — completed ADR using the template in [templates.md](templates.md).

**Discipline** — write for the future reader who does not have current context; avoid "this was obvious" framing; surface all real trade-offs.

---

### Mode: Refactor guidance

**Purpose** — plan or evaluate a structural improvement to existing code without changing behaviour.

**Mental stance** — incremental, safety-first, preserving delivery capability.

**Process**
1. Establish the current state and the target state clearly
2. Identify the safety net: tests, smoke checks, or integration signals that will detect regressions
3. Break the improvement into the smallest possible independent steps
4. Validate each step before continuing
5. Reject scope expansion unless it is strictly necessary for safety
6. Apply refactoring patterns from the `refactor` skill

**Output** — staged refactor plan, per-step validation criteria, blast radius assessment.

**Discipline** — a refactor that cannot be validated at each step is too large; shipping frequently matters; do not introduce new design decisions inside a refactor.

---

### Mode: Boundary definition

**Purpose** — define or validate the boundaries of a module, service, or bounded context.

**Mental stance** — reason-to-change-driven, ownership-aware.

**Process**
1. Identify what changes together and why
2. Identify what changes independently and why
3. Check whether proposed boundaries align with change drivers or conflict with them
4. Check ownership: can one team evolve each boundary independently?
5. Check contracts: are the interfaces between boundaries stable and explicit?
6. Apply the cohesion and coupling heuristics from [decision-heuristics.md](decision-heuristics.md)

**Output** — boundary map, ownership assignments, interface contracts, change driver analysis.

**Discipline** — do not let technical categories drive boundaries without reason-to-change analysis.

---

### Mode: Incident or failure analysis

**Purpose** — reason about why a system failure occurred and what the architectural implications are.

**Mental stance** — systems-thinking, root cause-oriented, forward-looking.

**Process**
1. Reconstruct the failure timeline from available evidence
2. Identify the proximate cause (what failed) and the contributing causes (why it was possible)
3. Evaluate whether the design enabled or amplified the failure
4. Identify the design properties that would have prevented or contained the failure
5. Recommend structural changes proportionate to the risk

**Output** — failure analysis, architectural contributing factors, proportionate recommendations.

**Discipline** — avoid blame; focus on what the system made easy or hard; distinguish one-off failures from systemic design issues.
