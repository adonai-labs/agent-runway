# Antipatterns

Recurring design and architecture failures that appear across many codebases, regardless of language or framework.

Use this file when reviewing architecture proposals, diagnosing why a system feels harder than it should, evaluating whether a refactor is improving the design, or identifying hidden coupling, accidental complexity, or false abstractions.

Each antipattern includes: what it is, why it appears, symptoms, risks, and preferred correction.

---

## 1. Framework-driven design

**What it is** — the architecture mirrors the framework more than the domain.

**Why it appears** — teams start from framework defaults and never pull the business model back to the centre.

**Symptoms** — folders are organised mostly by framework role; business rules are scattered across controllers, middleware, filters, and ORM models; changing framework behaviour forces domain changes.

**Risks** — poor testability; weak domain boundaries; high coupling to technical details; difficult migration or substitution later.

**Preferred correction** — re-centre the design around business capabilities, use cases, and change boundaries. Treat the framework as a delivery and infrastructure mechanism.

---

## 2. Cargo cult architecture

**What it is** — adopting patterns because respected systems or teams use them, not because the problem requires them.

**Why it appears** — pattern reputation replaces problem analysis.

**Symptoms** — CQRS, microservices, event buses, or hexagonal layers appear without clear forces; the justification is "this is best practice"; the resulting system is harder to explain than the problem itself.

**Risks** — unnecessary complexity; higher operational cost; slower delivery; reduced clarity.

**Preferred correction** — start from the problem shape, the team shape, and the expected change patterns. Use patterns only when they solve a concrete force.

---

## 3. Overengineering

**What it is** — building more architecture than the current problem can justify.

**Why it appears** — fear of future change, desire for elegance, or confusion between flexibility and quality.

**Symptoms** — too many layers; too many abstractions; code paths harder to follow than the business process; significant setup for simple features.

**Risks** — reduced velocity; increased cognitive load; accidental rigidity; hidden bugs in unnecessary plumbing.

**Preferred correction** — return to the smallest design that supports current needs and the next plausible change.

---

## 4. Speculative abstraction

**What it is** — an abstraction created for a future variation that does not yet exist.

**Why it appears** — "maybe we will need multiple implementations later."

**Symptoms** — interfaces with one implementation; generic extension points with no users; indirection without instability isolation.

**Risks** — more code, less clarity; artificial constraints; difficulty tracing behaviour.

**Preferred correction** — inline or simplify until real variation appears. Abstract only after pressure is visible.

---

## 5. Distributed monolith

**What it is** — a system deployed as many services but behaving like one tightly coupled application.

**Why it appears** — teams split deployment units without real autonomy in data, ownership, or release cadence.

**Symptoms** — services share the same database; services must deploy together; simple changes require synchronised coordination; cross-service calls are mandatory for basic workflows.

**Risks** — worst of both worlds; operational overhead without autonomy; failure propagation; painful debugging.

**Preferred correction** — either consolidate back into a modular monolith or complete the separation with explicit ownership, contracts, and independent release boundaries.

---

## 6. Cosmetic CQRS

**What it is** — separating commands and queries mechanically without solving any real complexity.

**Why it appears** — CQRS is applied as style rather than as a response to divergent read/write needs.

**Symptoms** — every CRUD endpoint becomes a command or query object; handlers mostly forward one line of logic; ceremony grows faster than value.

**Risks** — inflated architecture; noisy code; slower onboarding; harder traceability.

**Preferred correction** — use CQRS where read and write concerns genuinely differ in behaviour, scale, or cross-cutting needs.

---

## 7. Ceremonial layering

**What it is** — layers exist mainly to satisfy a diagram, not to improve changeability or isolation.

**Why it appears** — architecture is treated as mandatory structure instead of a tool.

**Symptoms** — many pass-through services; data crosses the same layers regardless of complexity; every feature must traverse identical boilerplate.

**Risks** — low signal-to-noise ratio; fragile refactors; many files per small change.

**Preferred correction** — collapse layers that do not isolate meaningful volatility. Keep only seams that pay their rent.

---

## 8. Event-driven coupling disguised as decoupling

**What it is** — events are used as a loose-looking integration model, but consumers are tightly dependent on unstable producer details.

**Why it appears** — teams assume asynchronous transport automatically creates good boundaries.

**Symptoms** — event schemas change frequently; consumers rely on internal semantics from the producer; end-to-end flows are difficult to understand; failures are hard to trace.

**Risks** — hidden coupling; brittle integrations; operational opacity.

**Preferred correction** — stabilise event contracts, clarify ownership, and use events only where asynchronous boundaries are actually beneficial.

---

## 9. API leaks internal models

**What it is** — public contracts mirror domain entities or persistence models too directly.

**Why it appears** — teams optimise for implementation convenience instead of contract quality.

**Symptoms** — API fields reflect table shape; storage refactors break consumers; external models include persistence-oriented details.

**Risks** — weak encapsulation; poor backward compatibility; slower internal evolution.

**Preferred correction** — create contract models intentionally. Expose stable concepts, not internal structure.

---

## 10. URI versioning by reflex

**What it is** — version numbers are pushed into URIs whenever any response shape changes.

**Why it appears** — versioning is used as an escape hatch instead of designing additive evolution.

**Symptoms** — many URI versions with overlapping semantics; consumers migrate often for minor changes; the resource concept stays the same but only the representation changes.

**Risks** — cluttered API surface; fragmented clients; unnecessary migration burden.

**Preferred correction** — prefer additive changes and compatibility. Introduce a new resource identity only when the concept changes meaningfully.

---

## 11. Batch operations without clear semantics

**What it is** — bulk endpoints exist, but ordering, partial failure, and atomicity are unclear.

**Why it appears** — teams optimise for fewer round trips without fully designing the behaviour.

**Symptoms** — clients cannot know what succeeded; the endpoint mixes many semantics; retries are dangerous.

**Risks** — inconsistent state; poor client ergonomics; operational ambiguity.

**Preferred correction** — define whether the batch is atomic, best-effort, ordered, unordered, idempotent, and how errors are reported.

---

## 12. Long-running operation without an operational contract

**What it is** — an async API exists, but clients cannot reliably inspect status, results, failures, or cancellation.

**Why it appears** — the implementation goes async before the contract design is finished.

**Symptoms** — no operation resource; no stable status model; unclear expiration behaviour; polling is undocumented or inconsistent.

**Risks** — poor client experience; support burden; orphaned jobs and ambiguous failures.

**Preferred correction** — model long-running work explicitly with status, result, error, cancellation, and retention semantics.

---

## 13. Transaction script pretending to be a rich domain model

**What it is** — objects look domain-rich but only wrap procedural orchestration with little real behaviour.

**Why it appears** — teams want the appearance of DDD without true invariants or domain behaviour.

**Symptoms** — methods mostly move data around; invariants live outside the model; domain types are anemic behind decorative names.

**Risks** — misleading structure; harder maintenance; confused responsibility boundaries.

**Preferred correction** — either commit to a real behavioural model with invariants, or use clear application-centric scripts honestly.

---

## 14. Rich domain model imposed without need

**What it is** — a heavy domain model is introduced into a problem that is mostly straightforward CRUD or process orchestration.

**Why it appears** — teams assume "more domain" always means "better design."

**Symptoms** — simple workflows require many domain types; the model adds ceremony but little protection; developers bypass the model for speed.

**Risks** — reduced clarity; fake complexity; inconsistent usage.

**Preferred correction** — use the simplest model that protects actual business rules. Not every system needs a rich behavioural core.

---

## 15. Large refactor without safety net

**What it is** — a broad structural change is attempted without sufficient tests, migration strategy, or staged rollout.

**Why it appears** — the team sees architectural debt and jumps directly to a large correction.

**Symptoms** — big-bang branch; weak rollback path; poor visibility into regressions; business delivery pauses.

**Risks** — long instability; reintroduced bugs; missed deadlines; team distrust in architectural work.

**Preferred correction** — refactor in smaller slices, preserve behaviour visibly, and improve safety before changing structure.

---

## 16. Shared database as fake integration contract

**What it is** — multiple modules or services integrate by reading and writing the same tables directly.

**Why it appears** — it feels fast and convenient early on.

**Symptoms** — ownership is ambiguous; schema changes require synchronised coordination; modules rely on each other's storage assumptions.

**Risks** — hidden coupling; blocked evolution; weak boundaries.

**Preferred correction** — move integration to explicit contracts or module APIs. Let each boundary own its own persistence model where appropriate.

---

## 17. Cross-cutting logic in delivery endpoints

**What it is** — controllers or endpoints accumulate validation, logging, authorisation nuances, orchestration, and business decisions.

**Why it appears** — endpoints are the easiest place to add "just one more thing."

**Symptoms** — controllers become long and branching; business logic is hard to reuse or test; transport concerns and use-case policy are mixed.

**Risks** — low cohesion; duplicated logic; brittle tests.

**Preferred correction** — keep delivery entry points thin. Move use-case policy to application or domain-level code and use framework mechanisms for true cross-cutting concerns.

---

## 18. Infrastructure concepts bleed into the core model

**What it is** — business policy becomes shaped by database, messaging, or framework mechanics.

**Why it appears** — infrastructure decisions are made before core concepts are stabilised.

**Symptoms** — domain code knows too much about persistence or transport; business rules exist mainly to satisfy technical constraints; core logic cannot evolve independently.

**Risks** — design distortion; poor testability; expensive platform changes.

**Preferred correction** — keep infrastructure-specific mechanics near the edges. Protect the core from vendor and transport details.

---

## Review questions

Use when scanning for antipatterns:

- Is this complexity solving a real force?
- Does this abstraction isolate volatility, or just add indirection?
- Would a simpler structure achieve the same outcome?
- Is the system pretending to be more decoupled than it really is?
- Are public contracts exposing internal decisions?
- Is architecture improving change safety, or just adding ceremony?
