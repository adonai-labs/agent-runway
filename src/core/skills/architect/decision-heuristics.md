# Decision Heuristics

Reusable engineering heuristics for reasoning like a senior software architect or principal engineer.

These are not absolute laws. They are default decision rules that improve clarity, change safety, maintainability, and architectural fit.

Use these heuristics when evaluating architecture proposals, deciding whether to introduce complexity, choosing between patterns, reviewing major refactors, or reasoning about APIs, boundaries, integrations, and system evolution.

---

## 1. Simplicity and complexity

### 1. Prefer the simplest solution that preserves future evolution
Do not design for the biggest imaginable future. Design for the next plausible change.

**Apply when** deciding between a direct solution and a generalised framework, or evaluating whether a system needs more layers or more indirection.

**Warning signs** — the design explains many hypothetical futures but solves the current case poorly; the code becomes harder to read before any real benefit appears.

**Valid exception** — multiple concrete consumers or extension points already exist.

---

### 2. Do not introduce abstractions without real pressure
An abstraction should be justified by real variation, expensive duplication, or a need to isolate unstable detail.

**Apply when** proposing interfaces, adapters, strategy patterns, or generic layers.

**Warning signs** — the abstraction has only one implementation and no meaningful behaviour; it exists only because "we may need it later."

**Valid exception** — the cost of changing the underlying dependency later is known to be high.

---

### 3. Do not add layers, repositories, or interfaces by reflex
Each extra layer must buy isolation, clarity, or change safety.

**Apply when** creating Application, Domain, Infrastructure, Services, Managers, Repositories, Facades, or similar layers; reviewing enterprise structures in simple systems.

**Warning signs** — every change crosses many files with little added value; layers merely forward calls; names increase faster than behaviour.

**Valid exception** — the layer truly isolates infrastructure, contract boundaries, or business policy.

---

### 4. The right pattern in the wrong context is still a bad decision
Do not evaluate patterns in isolation. Evaluate them against the forces of the problem.

**Apply when** choosing CQRS, Clean Architecture, event-driven integration, vertical slices, rich domain model, or microservices.

**Warning signs** — the main reason is "best practice"; the chosen pattern solves a problem the system does not have.

**Valid exception** — the team already has strong operational maturity in that pattern and the problem shape matches it.

---

### 5. Design for the next plausible change, not every possible future
Favour changeability where change is likely. Do not optimise for flexibility everywhere.

**Apply when** deciding whether to generalise data models, workflows, or service boundaries.

**Warning signs** — the system becomes abstract without real consumers; the model reflects imagined scenarios instead of observed pressure.

**Valid exception** — regulatory, platform, or contractual constraints make future change predictable.

---

## 2. Boundaries and dependencies

### 6. If two things change together for the same reason, keep them close
A boundary is useful only when it separates different reasons to change.

**Apply when** organising modules, services, or layers; deciding whether logic belongs together.

**Warning signs** — changes routinely touch both sides of the boundary; the split increases coordination without reducing coupling.

**Valid exception** — operational or ownership constraints justify the separation.

---

### 7. If two concerns change for different reasons, separate them
Distinct change drivers usually deserve distinct boundaries.

**Apply when** identifying modules, bounded contexts, or internal seams.

**Warning signs** — one module mixes policy, transport, persistence, and orchestration; infrastructure churn forces business code changes.

**Valid exception** — the added separation would create more ceremony than value in a very small system.

---

### 8. Dependencies should point toward policy, not detail
Business policy should not depend on framework, transport, database, or vendor details.

**Apply when** structuring application core and infrastructure; reviewing imports, references, and dependency direction.

**Warning signs** — framework types leak into core business rules; business logic is hard to test without infrastructure.

**Valid exception** — the system is intentionally thin and the added indirection would be pure ceremony.

---

### 9. Separate policy from mechanism
What changes for business reasons should not be entangled with what changes for technical reasons.

**Apply when** placing orchestration, persistence, messaging, UI, and business rules.

**Warning signs** — changing HTTP shape alters core rules; swapping infrastructure rewrites use-case logic.

**Valid exception** — the application is truly a thin integration layer with minimal business policy.

---

### 10. Minimise blast radius as a design objective
A small change should stay small.

**Apply when** evaluating modularity, contracts, and team boundaries; reviewing proposed refactors or new abstractions.

**Warning signs** — simple changes require touching many modules or services; teams must coordinate for routine modifications.

**Valid exception** — cross-cutting regulatory or platform changes may legitimately affect many areas.

---

## 3. Contracts and APIs

### 11. Treat the API as a stable contract, not an implementation leak
An API is not a remote view of internal data. It is an interface for consumers.

**Apply when** designing request and response models; deciding whether to expose internal entities directly.

**Warning signs** — contract changes every time internal storage changes; the public model mirrors database tables or ORM entities.

**Valid exception** — a strictly internal API with tightly coupled ownership and low change cost.

---

### 12. Prefer additive changes over destructive changes
Growing a contract is usually safer than reshaping it.

**Apply when** evolving endpoints, payloads, and resource shapes; deciding whether to version, rename, or remove fields.

**Warning signs** — breaking changes are proposed for convenience; consumers are forced to migrate frequently.

**Valid exception** — the contract is private, tightly controlled, and migration cost is low.

---

### 13. Use standard methods when they fit clearly; use custom methods when forcing CRUD would confuse the API
Do not force awkward semantics into standard operations. Do not invent custom operations when the resource model is good enough.

**Apply when** choosing between resource-oriented design and controller-style methods.

**Warning signs** — `POST` is used as a universal escape hatch; resources are contorted to represent actions poorly.

**Valid exception** — action semantics are primary and modelling them as simple CRUD would mislead consumers.

---

### 14. Do not expose internal entities directly
Internal domain and persistence models rarely make good external contracts.

**Apply when** defining DTOs, API payloads, and integration contracts.

**Warning signs** — every internal refactor becomes an API migration; consumers depend on fields that only exist because of storage shape.

**Valid exception** — temporary internal tooling with one tightly coupled consumer.

---

### 15. Use long-running operations only when the operation truly needs them
Async operation resources are valuable when work is slow, uncertain, or externally coordinated. Otherwise they add complexity.

**Apply when** a request may take too long, trigger external processes, or need polling.

**Warning signs** — async workflow introduced for short and predictable operations; no status, result, expiration, or error model.

**Valid exception** — platform constraints force asynchronous execution.

---

### 16. Batch operations must justify their complexity
Bulk endpoints can improve efficiency but increase complexity around ordering, atomicity, and partial failure.

**Apply when** designing create-many, update-many, or delete-many operations.

**Warning signs** — the batch API has unclear error semantics; clients gain little compared to repeated normal operations.

**Valid exception** — throughput, latency, or external API constraints make batching clearly beneficial.

---

### 17. Design for idempotency where retries are likely
If retries, duplicate delivery, or flaky networks are possible, assuming exactly-once behaviour is unsafe.

**Apply when** handling commands that can be retried by clients, queues, or gateways.

**Warning signs** — repeated requests create duplicate side effects; operational recovery depends on manual cleanup.

**Valid exception** — the domain is inherently non-idempotent and the contract clearly says so.

---

## 4. Distribution and integration

### 18. Prefer a modular monolith before microservices unless there is clear evidence otherwise
Distributed systems cost more to build and more to operate.

**Apply when** deciding the system shape early; evaluating a move from monolith to services.

**Warning signs** — service decomposition is justified by trend, not force; ownership, scaling, and deployment are still shared.

**Valid exception** — hard organisational, scaling, isolation, or compliance boundaries already exist.

---

### 19. Do not distribute processes before you need independent deployment, ownership, or scaling
Process boundaries should buy something real.

**Apply when** proposing new services, queues, or separate deployables.

**Warning signs** — services deploy together; services share the same database; one team owns everything.

**Valid exception** — risk isolation or compliance isolation requires process separation.

---

### 20. Use domain events for internal effects and integration events for crossing boundaries
Events are not interchangeable. Their meaning depends on scope.

**Apply when** deciding how to react to changes inside a bounded context; integrating with other contexts or services.

**Warning signs** — internal side effects implemented through external integration mechanics; domain logic depends on event transport concerns.

**Valid exception** — in small systems, temporary simplification may blur the distinction, but it should remain conceptually explicit.

---

### 21. Do not use events to hide badly defined boundaries
Events do not fix weak modularity. They can just make coupling less visible.

**Apply when** adopting pub-sub or event-driven designs.

**Warning signs** — teams cannot trace the business flow end to end; many consumers depend on unstable event shapes; synchronous thinking is disguised as asynchronous infrastructure.

**Valid exception** — a genuinely decoupled notification model with stable ownership and contracts.

---

### 22. Avoid distributed transactions as a default solution
They are expensive, fragile, and often unnecessary.

**Apply when** coordinating state changes across databases, services, or message brokers.

**Warning signs** — design assumes atomicity across boundaries by default; failure handling is under-specified.

**Valid exception** — a tightly constrained environment with proven support and a very strong business need.

---

### 23. Choose consistency based on business impact, not technical anxiety
Not everything needs immediate global agreement.

**Apply when** deciding between synchronous confirmation and eventual consistency.

**Warning signs** — strong consistency chosen "just in case"; eventual consistency chosen without compensations or user model clarity.

**Valid exception** — financial, legal, or safety-critical invariants may require stronger guarantees.

---

## 5. Evolution, testability, and operation

### 24. Testability is not an extra; it is a symptom of design quality
Hard-to-test logic often signals poor placement or excessive coupling.

**Apply when** evaluating application core design; deciding where to place business rules.

**Warning signs** — core behaviour requires full infrastructure to test; tests are brittle because logic depends on framework plumbing.

**Valid exception** — thin integration glue may reasonably require integration tests instead of unit tests.

---

### 25. Keep important behaviour in places that are easy to test
Business rules should live where they can be verified cheaply and clearly.

**Apply when** placing validation, invariants, orchestration, and policy.

**Warning signs** — controllers, middleware, or infrastructure classes contain critical business behaviour; tests must boot the whole app for basic rules.

**Valid exception** — a very thin application with almost no independent business logic.

---

### 26. Do not optimise before locating the real bottleneck
Premature optimisation hardens the design before the real need is known.

**Apply when** evaluating caching, asynchronous processing, parallelism, or pre-optimisation of storage and APIs.

**Warning signs** — complexity increases without measured benefit; the optimisation is justified by fear instead of observation.

**Valid exception** — known platform limits or expensive external calls justify proactive treatment.

---

### 27. Design observability together with operational behaviour
If the system cannot explain what it is doing, it cannot be operated safely.

**Apply when** adding async flows, retries, external integrations, background processing, or critical commands.

**Warning signs** — no traceability for failures or state transitions; operations rely on reading raw database state.

**Valid exception** — throwaway prototypes or local-only tooling.

---

### 28. Team cognitive load is a real architectural constraint
Architecture is socio-technical. A design only a few people understand is a fragile design.

**Apply when** evaluating patterns, service decomposition, and framework usage.

**Warning signs** — debugging requires tribal knowledge; the team avoids parts of the system because they are too opaque.

**Valid exception** — isolated specialist subsystems with clear ownership and narrow boundaries.

---

### 29. Refactor incrementally when the system already delivers value
Prefer change with safety over rewrite with hope.

**Apply when** deciding between targeted improvement and large redesign.

**Warning signs** — refactor scope expands without stronger evidence; the team loses the ability to release safely.

**Valid exception** — the current architecture blocks progress so thoroughly that incremental change is no longer viable.

---

### 30. Total rewrites should be the exception, not the default strategy
A rewrite resets learning, reintroduces old bugs, and delays feedback.

**Apply when** systems feel "messy" and the team wants a fresh start.

**Warning signs** — the rewrite is sold as a universal cleanup; migration and coexistence strategy are unclear.

**Valid exception** — hard platform shifts, unsupported foundations, or irrecoverable architectural debt with a credible migration path.
