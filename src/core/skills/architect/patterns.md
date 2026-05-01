# Patterns

Reusable architecture and design patterns — selected based on applicability, trade-off clarity, and practical usage.

These are not templates to apply by default. Each pattern solves specific forces. Understand the forces before choosing the pattern.

---

## 1. Clean Architecture (Layered by dependency direction)

**Intent** — separate policy from mechanism by ensuring all dependencies point inward, toward the core.

**Forces** — business rules need to be isolated from framework, database, and delivery detail; core logic needs to be independently testable; infrastructure should be swappable.

**Structure**
```
Domain ← Application ← Infrastructure
Domain ← Application ← Presentation
```
- Domain: entities, value objects, domain events, core rules
- Application: use cases, commands, queries, ports (interfaces)
- Infrastructure: database, messaging, external services (implements ports)
- Presentation: HTTP, gRPC, queues (invokes use cases)

**Applicability** — medium-to-large systems with meaningful business rules; systems needing testable core logic; systems expecting infrastructure evolution.

**Anti-force** — very thin systems, pure CRUD, or systems where the domain has minimal behaviour. Clean Architecture in these contexts creates ceremonial layering with no real value.

**Signals of good application** — core code contains no framework imports; business rules can be unit tested without booting infrastructure; infrastructure changes do not affect use cases.

---

## 2. CQRS (Command Query Responsibility Segregation)

**Intent** — separate models for writing state and reading state.

**Forces** — read and write concerns diverge in shape, complexity, or scale; queries need to be denormalised or flattened while commands enforce invariants; independent optimisation of read and write paths.

**Structure**
- Command side: validates, enforces domain invariants, raises domain events, updates the write store
- Query side: reads from a projection or a read-optimised store, returns flat response DTOs

**Applicability** — complex domains with divergent read and write concerns; event sourcing systems; systems needing independent scaling of reads vs writes.

**Anti-force** — CRUD-heavy systems or simple workflows where commands and queries look nearly identical. Applying CQRS to simple resources adds ceremony without reducing complexity.

**Signals of overuse** — handlers only forward one line of persistence logic; every record type has a command and query object pair; developers describe the ceremony but not the benefit.

---

## 3. Outbox pattern

**Intent** — ensure event or message publication is atomically consistent with database state changes.

**Forces** — a transaction writes to the database and must also publish a message; publish-then-fail or fail-then-publish create lost events or duplicate side effects.

**Structure**
1. Application writes the state change and an outbox record in the same transaction
2. A separate relay process reads the outbox and publishes confirmed messages
3. Published outbox records are marked complete or deleted

**Applicability** — any system that produces integration or domain events alongside state changes; systems using message brokers; at-least-once delivery contexts.

**Anti-force** — low-value events in a system with simple operations; systems where message loss is acceptable and no compensations exist.

**Cost** — requires a relay process or CDC mechanism; adds eventual delivery latency; outbox table must be maintained.

---

## 4. Saga (Choreography and Orchestration)

**Intent** — coordinate a multi-step business process that spans multiple services or persistence boundaries without a distributed transaction.

**Choreography** — each service listens to events and reacts independently. No central coordinator exists.

**Orchestration** — a central orchestrator explicitly directs each step and handles failures.

**Forces** — multi-service workflows where each step must be compensated on failure; distributed atomicity is not feasible.

**Applicability** — order processing, multi-party approval, long-running business workflows.

**Choreography trade-offs** — simpler, lower coupling, but flow visibility is poor and coordination logic is distributed.

**Orchestration trade-offs** — clearer flow, easier debugging, but the orchestrator is a coordination bottleneck and must handle failure at each step.

**Anti-force** — simple single-service transactions; workflows that can be handled locally without cross-service state.

---

## 5. Repository pattern

**Intent** — provide a collection-like interface to a set of aggregate roots, abstracting persistence mechanics from application code.

**Forces** — domain code should not depend on ORM mechanics, query builders, or database API specifics; persistence should be swappable; aggregate access should be clean and discoverable.

**Structure**
- `IRepository<T>` defined in Application or Domain
- Concrete implementation in Infrastructure
- No complex query logic exposed; queries go via specifications or query methods on the repository

**Applicability** — meaningful domain models with aggregate roots; Clean Architecture structures; systems with changing persistence mechanisms or testability requirements.

**Anti-force** — thin CRUD systems where the repository just wraps a DbSet; systems where adding the pattern only adds indirection without isolation.

---

## 6. Mediator pattern

**Intent** — decouple request senders from handlers by routing through a central dispatcher.

**Forces** — cross-cutting concerns (logging, validation, transaction management) should not repeat in every handler; callers should not know handler implementations; pipeline behaviours should compose cleanly.

**Applicability** — CQRS command/query pipelines; systems with cross-cutting application behaviours; reducing controller or service fat.

**Anti-force** — trivial applications where mediator adds indirection without eliminating meaningful coupling; small systems where direct calls are clearer and faster to trace.

**Common implementation** — MediatR in .NET applications.

---

## 7. Specification pattern

**Intent** — encapsulate a business query or selection criterion as a reusable, composable object.

**Forces** — query logic is duplicated across services or repositories; business selection criteria need to be named and reused; filtering logic should not leak into the domain layer.

**Applicability** — complex domain queries; filtering use cases; rule evaluation.

**Anti-force** — simple queries with one or two fixed conditions; contexts where specifications create more boilerplate than clarity.

---

## 8. Value Object

**Intent** — model a concept purely by its attributes, with no independent identity, immutability, and meaningful equality.

**Forces** — concepts like money, dates, addresses, or measurements should not carry mutable state or be compared by reference; type safety improves over using primitives.

**Applicability** — any domain concept that is defined entirely by its value, has no lifecycle, and should enforce invariants on construction.

**Signals of good use** — calculations, comparisons, and validations live inside the type; primitive obsession is reduced.

**Anti-force** — simple primitives where a value object adds class boilerplate without meaningful behaviour or invariants.

---

## 9. Domain Event

**Intent** — represent something meaningful that has happened in the domain, decoupling producers from side effects.

**Forces** — side effects from a domain action should not be hard-coded into the action itself; multiple parts of the system react to business facts.

**Structure**
- Event raised inside a domain aggregate when a state change occurs
- Application layer publishes the event after the transaction commits
- Handlers respond independently

**Applicability** — side effects that should happen reliably but not inline; business events that consumers need to know about.

**Distinction** — domain events express facts inside a bounded context; integration events cross context or service boundaries.

---

## 10. Anti-Corruption Layer (ACL)

**Intent** — protect the core domain model from external models, legacy systems, or third-party concepts.

**Forces** — external systems have different semantics; direct exposure of external models would distort internal design; the external system is unstable or controlled by a third party.

**Structure**
- Translation layer at the boundary
- Maps external types to internal domain types
- Absorbs external schema changes without propagating them inward

**Applicability** — integrating with legacy systems, third-party APIs, or other bounded contexts with incompatible models.

**Anti-force** — tight integration where both sides are owned and aligned; pure pass-through with no semantic mismatch.

---

## Pattern selection guide

| Force | Consider |
|---|---|
| Core logic needs to be independently testable | Clean Architecture |
| Reads and writes diverge significantly | CQRS |
| Events must be reliably published with state changes | Outbox pattern |
| Multi-service workflow needs compensation | Saga |
| Domain access should be persistence-agnostic | Repository |
| Cross-cutting application concerns recur | Mediator |
| Query criteria are complex and reusable | Specification |
| Concept has value-equality and invariants | Value Object |
| Side effects should decouple from triggers | Domain Event |
| External model threatens core domain | Anti-Corruption Layer |
