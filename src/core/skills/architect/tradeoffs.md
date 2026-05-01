# Trade-offs

Recurring engineering trade-offs that a senior architect must reason about explicitly.

These are not binary choices with universal winners. The goal is to make trade-offs visible, explain what pushes the design in each direction, and prevent accidental decisions.

For each trade-off, consider: what pushes toward one side, what pushes toward the other, signs one side is being over-applied, risks of each extreme, and the default recommendation when context is weak.

---

## 1. Simplicity vs extensibility

**Pushes toward simplicity** — the problem is still evolving; the real future variation is unclear; the team needs fast, safe delivery; the current solution is still small and understandable.

**Pushes toward extensibility** — multiple concrete variants already exist; different consumers need different behaviour; change pressure is recurring and predictable; extension cost is already visible in current design.

**Signs simplicity is over-applied** — the same change is repeatedly expensive; every new variant requires editing the same fragile code path; duplication is turning into divergence.

**Signs extensibility is over-applied** — abstractions have no real consumers; the code explains future possibilities better than current behaviour; reading the system requires understanding many empty extension points.

**Risks** — too much simplicity can become rigidity under real growth; too much extensibility can become speculative architecture.

**Default** — prefer simplicity first. Add extensibility only where real change pressure already exists.

---

## 2. Delivery speed vs architectural purity

**Pushes toward speed** — immediate business delivery matters; the change is small and low risk; the current shape is good enough; delaying delivery would create larger cost than localised debt.

**Pushes toward purity** — the same shortcut is repeatedly causing friction; the debt distorts core boundaries; the team is losing change safety; the workaround leaks into many future changes.

**Signs speed is over-applied** — "temporary" shortcuts become permanent defaults; the core gets shaped by convenience; local hacks accumulate into system-level fragility.

**Signs purity is over-applied** — architecture work delays value without clear future payoff; the team performs large rewrites for cosmetic improvement; design discussions outweigh delivery needs.

**Risks** — over-indexing on speed creates unstable systems; over-indexing on purity slows learning and delivery.

**Default** — accept localised debt when necessary, but do it consciously, document it, and avoid debt that distorts the core model.

---

## 3. Modular monolith vs microservices

**Pushes toward modular monolith** — one team owns most of the system; transactional consistency matters; the domain is not yet stable enough for physical separation; operational maturity is limited; deployment simplicity matters more than autonomous scaling.

**Pushes toward microservices** — different teams need strong ownership boundaries; parts of the system need independent deployment; scaling profiles differ significantly; fault isolation is strategically important; compliance or platform constraints require separation.

**Signs monolith is over-applied** — the deployable unit is so large that team autonomy is blocked; unrelated release cadences are tightly coupled; one area's scaling or risk model harms all others.

**Signs microservices are over-applied** — services share a database; they deploy together; simple features require many cross-service changes; distributed complexity appears without independent value.

**Risks** — monoliths can become hard to navigate if modularity is weak; microservices can become distributed monoliths with higher cost.

**Default** — prefer a modular monolith first. Extract services only when independent deployment, ownership, or scaling pressures are real.

---

## 4. Strong consistency vs availability and tolerance

**Pushes toward strong consistency** — hard business invariants exist; financial or legal correctness requires immediate agreement; user trust depends on immediate correctness; temporary divergence creates unacceptable outcomes.

**Pushes toward availability or eventual consistency** — the workflow spans multiple boundaries; latency and resilience matter more than immediate agreement; distributed coordination is too expensive or fragile; compensations are acceptable from a business perspective.

**Signs strong consistency is over-applied** — the design assumes cross-boundary atomicity everywhere; distributed transactions become the default answer; the system is brittle under partial failure.

**Signs eventual consistency is over-applied** — business invariants are hand-waved away; user experience becomes confusing; compensation logic is underdesigned.

**Risks** — too much consistency hurts autonomy and resilience; too much looseness creates trust and reconciliation problems.

**Default** — reserve strong consistency for real invariants. Use eventual consistency deliberately, with clear compensations and user-visible semantics.

---

## 5. Rich domain model vs transaction script

**Pushes toward rich domain model** — the domain contains meaningful invariants; behaviour belongs close to business concepts; rules are numerous, interdependent, and evolving; protecting consistency inside the model has real value.

**Pushes toward transaction script** — workflows are straightforward; business behaviour is thin; the system is mostly orchestration or CRUD; introducing a rich model would mostly add ceremony.

**Signs rich domain is over-applied** — objects exist mostly to wrap data; business rules still live outside the model; developers bypass the model because it feels heavy.

**Signs transaction script is over-applied** — business rules are duplicated across flows; consistency relies on procedural discipline; behaviour is spread across many scripts without clear ownership.

**Risks** — forced rich domain models create false complexity; overused transaction scripts create weak protection of business rules.

**Default** — use the simplest model that protects real invariants. Do not impose a rich model without real behavioural pressure.

---

## 6. Abstraction vs readability

**Pushes toward abstraction** — multiple implementations are real; variation is expected and valuable; infrastructure detail must be isolated; repeated behaviour is truly the same concept.

**Pushes toward readability** — there is only one concrete path; the code is easier to understand directly; indirection would hide important flow.

**Signs abstraction is over-applied** — behaviour is difficult to trace; interfaces outnumber meaningful variations; new developers need many jumps to understand one action.

**Signs readability is over-applied** — repetitive code drifts apart; swapping dependencies becomes invasive; unstable details leak broadly.

**Default** — prefer directness until repeated variation or unstable detail justifies abstraction.

---

## 7. Decoupling vs cognitive load

**Pushes toward decoupling** — teams need independence; unstable details should be isolated; modules need clear boundaries; external dependencies should not shape the core.

**Pushes toward lower cognitive load** — the system is small; one team understands the whole flow; extra indirection would not protect anything meaningful; debugging speed matters more than formal separation.

**Signs decoupling is over-applied** — boundaries exist only in diagrams and wrappers; developers cannot follow end-to-end behaviour easily; many concepts are introduced without reducing risk.

**Signs cognitive simplicity is over-applied** — unrelated concerns bleed together; changes propagate too broadly; external details shape core logic.

**Default** — decouple around real volatility, ownership, and failure boundaries, not around abstract ideals alone.

---

## 8. Stable contracts vs backend implementation speed

**Pushes toward stable contracts** — multiple consumers depend on the API; backward compatibility matters; external adoption cost is high; the API should outlive internal implementation changes.

**Pushes toward implementation speed** — the contract is early and internal; consumers are tightly aligned with the team; learning speed matters more than external stability.

**Signs contract stability is over-applied** — the backend cannot evolve because every internal improvement becomes blocked; too much energy goes into preserving weak original decisions.

**Signs speed is over-applied** — breaking changes are frequent; consumers adapt to internal churn; the contract feels like a thin wrapper over current storage.

**Default** — prefer stable contracts and additive change as soon as multiple consumers or external dependencies exist.

---

## 9. Synchronous integration vs asynchronous integration

**Pushes toward synchronous** — immediate answers are required; the caller needs direct confirmation; the interaction is naturally request/response; the consistency need is immediate and local.

**Pushes toward asynchronous** — workflows are slow or long-running; temporary unavailability should not block all progress; multiple consumers need notification; decoupling of time and load matters.

**Signs synchronous is over-applied** — one slow dependency creates broad request fragility; request chains become long and failure-prone; latency accumulates across services.

**Signs asynchronous is over-applied** — users lose clarity about outcome timing; tracing business flow becomes difficult; compensations and ordering are poorly defined.

**Default** — use synchronous calls for direct request/response needs. Use asynchronous integration where time decoupling, resilience, or fan-out are real drivers.

---

## 10. Atomic batch behaviour vs operational flexibility

**Pushes toward atomic batch** — all-or-nothing behaviour matches business expectations; partial completion would be misleading or harmful; rollback semantics are feasible.

**Pushes toward partial or flexible batch** — large-scale operations are expected; partial progress is useful; retries need to be granular; throughput matters more than total atomicity.

**Signs atomicity is over-applied** — implementation complexity becomes extreme; large operations become fragile or slow; a small invalid item blocks all useful work.

**Signs flexibility is over-applied** — clients cannot reason about success and failure; reconciliation becomes manual or unclear; retries cause duplicate or conflicting effects.

**Default** — choose semantics that match real business expectations and document them explicitly.

---

## 11. Deep observability vs operational cost

**Pushes toward deep observability** — workflows are distributed; failures are costly; compliance or auditing matters; background jobs and async processes are critical.

**Pushes toward lower operational cost** — the system is small and local; telemetry volume is expensive; the failure surface is limited; the team can operate effectively with simpler signals.

**Signs observability is over-applied** — logs are noisy but not useful; telemetry cost grows faster than insight; teams drown in signals without actionability.

**Signs observability is under-applied** — failures require database forensics; async workflows cannot be traced; operators cannot answer "what happened?"

**Default** — invest observability where failure, distribution, and business criticality justify it. Prefer useful telemetry over exhaustive noise.

---

## 12. Clean layering vs vertical slices

**Pushes toward clean layering** — infrastructure isolation is important; the team benefits from strong dependency direction; domain policy deserves explicit protection; the system has meaningful cross-cutting boundaries.

**Pushes toward vertical slices** — feature cohesion matters more than formal layers; the team delivers through use cases; many features are independent enough to group end-to-end; ceremony from shared layers is becoming expensive.

**Signs layering is over-applied** — changes must cross many shared layers even for small features; pass-through classes dominate the structure; "architecture compliance" becomes more visible than the business flow.

**Signs vertical slicing is over-applied** — infrastructure and policy leak together inside features; consistent dependency direction disappears; duplication rises without clear benefit.

**Default** — favour feature cohesion, but preserve clear dependency direction and keep infrastructure concerns from contaminating core policy.

---

## Trade-off review questions

Use when a decision feels contested:

- What real force is driving each side of the choice?
- Are we solving a present problem or a hypothetical one?
- Which option reduces future change cost in the most likely scenarios?
- Which option increases team cognitive load more?
- Which option creates more operational burden?
- Are we paying distributed or architectural cost too early?
- Is the complexity proportionate to the problem?
- If we choose the simpler option now, what is the real migration path later?
