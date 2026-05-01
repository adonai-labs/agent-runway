# Review Lenses

Structured lenses for reviewing architecture proposals, system designs, and significant code changes.

Apply each lens as a deliberate perspective. Not every lens applies to every review; select based on what the change touches.

---

## Lens 1 — Complexity proportionality

Ask: is the complexity in this design proportionate to the problem it is solving?

**Check for**
- Layers or abstractions that exist without a clear problem they isolate or solve
- Patterns chosen by reputation rather than by matching forces
- Code that explains a hypothetical future better than the current case
- Features that require significant ceremony for simple behaviour

**Good outcome** — the design is proportionate; extra complexity is justified by a concrete force.

**Risk signal** — explaining why the architecture looks this way requires more effort than explaining what it does.

---

## Lens 2 — Dependency direction

Ask: do dependencies point in the right direction, and do the boundaries reflect different reasons to change?

**Check for**
- Infrastructure types imported into domain or application core
- Business logic shaped by framework or database mechanics
- Layers that should isolate volatility but bleed through it
- Circular dependencies between layers or modules

**Good outcome** — dependencies are inward-pointing; infrastructure and framework details are at the edges.

**Risk signal** — changing a database or transport mechanism would require touching business rules.

---

## Lens 3 — Change safety

Ask: how easy is it to change this system safely?

**Check for**
- Broad blast radius for small changes
- Missing or inadequate test coverage for important logic
- Strong coupling between components that should evolve independently
- Tight synchronous chains that propagate failures

**Good outcome** — changes are well-contained; tests verify important behaviour; components can evolve without requiring coordinated updates elsewhere.

**Risk signal** — small changes in one area require defensive re-testing or modification in unrelated areas.

---

## Lens 4 — Testability

Ask: can the important behaviour be verified cheaply and clearly?

**Check for**
- Business rules embedded in controllers, middleware, or ORM events
- Application core that cannot be tested without booting infrastructure
- Overuse of mocks as a symptom of excessive coupling
- Integration tests as the only way to verify domain rules

**Good outcome** — important domain and application logic is unit-testable; infrastructure concerns are isolated and replaceable in tests.

**Risk signal** — developers avoid writing tests because the system makes it too expensive.

---

## Lens 5 — Contract quality

Ask: are the public contracts designed for consumers, not for implementation convenience?

**Check for**
- API responses mirroring internal persistence models
- Breaking changes introduced casually
- Versioning used as a crutch instead of additive evolution
- Contract fields with no clear consumer semantics

**Good outcome** — contracts are stable, consumer-oriented, and evolve additively; internal changes are absorbed without surfacing to consumers.

**Risk signal** — contract changes are frequent and consumers must adapt often.

---

## Lens 6 — Observability and operability

Ask: when this system fails, can it explain what happened?

**Check for**
- Missing correlation IDs across service calls or async flows
- Insufficient logging around important commands, state changes, or failures
- No health or readiness signals for dependencies
- Background jobs with no error visibility or status reporting

**Good outcome** — failures are diagnosable from logs and traces without database inspection; operational runbooks are supportable.

**Risk signal** — understanding a failure requires attaching a debugger or inspecting raw database state.

---

## Lens 7 — Security boundaries

Ask: is access controlled at the right level, and are inputs validated before use?

**Check for**
- Missing authorisation checks on commands or endpoints
- Inputs used before validation
- Secrets or credentials handled in code rather than through secure mechanisms
- Sensitive data exposed in logs or responses

**Good outcome** — authorisation is verified at boundary entry; inputs are validated before processing; secrets are injected from infrastructure.

**Risk signal** — security is relying on developers remembering to apply it each time, rather than on structural defaults.

---

## Lens 8 — Team cognitive load

Ask: can a developer on this team understand, change, and operate this system without extensive tribal knowledge?

**Check for**
- System areas that only specific individuals understand
- Deeply indirect paths that obscure business flow
- Documentation that is required for basic navigation
- Patterns that are correct in theory but not understood in practice

**Good outcome** — any developer on the team can orient in the codebase and make a change without needing expert guidance.

**Risk signal** — certain areas of the system are avoided because they are too difficult to understand safely.

---

## Lens 9 — Distribution justification

Ask: if this system uses distributed components, does each separation carry real value?

**Check for**
- Services that deploy together
- Services that share the same database
- Services where a single business change requires coordinated releases
- Async pipelines that add latency without providing resilience or decoupling

**Good outcome** — each distribution boundary is justified by autonomous deployment, ownership, scaling, or risk isolation.

**Risk signal** — the system carries the cost of distribution without the autonomy benefits.

---

## Lens 10 — Evolution strategy

Ask: how will this system evolve as requirements change, and is that path clear?

**Check for**
- Contracts or models that are difficult to extend without breaking changes
- Assumptions baked into core structures that may not hold
- Missing migration strategies for long-running data or integrations
- Backwards compatibility not considered in the design

**Good outcome** — the system can grow incrementally; extensions are additive; breaking changes are rare and planned.

**Risk signal** — the current design assumes a fixed future and has no clear path for common changes.

---

## Review output structure

For each lens applied:

```
Lens: [name]
Observation: [what was found]
Severity: [good | informational | concern | blocker]
Recommendation: [what to do if action is needed]
```

Overall verdict: `Approved` | `Approved with concerns` | `Needs revision` | `Blocked`
