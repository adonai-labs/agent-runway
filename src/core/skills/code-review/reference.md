# Reference — Review Checklists

> The checklists below are reviewer-specific — they cover what a reviewer verifies layer by layer.
>
> **Stack note**: these checklists are stack-neutral. When a stack skill is installed, apply its deeper checks too (`../<stack>-core/security.md`, `../<stack>-core/testing.md`, and for .NET the `dotnet-core` delivery checks).

---

## Domain / Core Layer Checklist

- [ ] No framework, persistence, or transport dependencies in domain code
- [ ] Entities enforce invariants in constructors/factories — not in services
- [ ] State changes go through intention-revealing methods, not public setters on aggregates
- [ ] Domain events (or equivalent) raised for cross-aggregate side effects
- [ ] Value objects compare by value and are immutable

---

## Application / Use-Case Layer Checklist

- [ ] Each handler/use case/service function has exactly one responsibility
- [ ] Inputs validated at the boundary with the project's validation approach
- [ ] No direct database/ORM client access — depends on repository/port abstractions
- [ ] Cancellation/abort signals (tokens, contexts, `AbortSignal`) accepted and propagated
- [ ] Expected failures returned as explicit results/errors; exceptions/panics reserved for the unexpected

---

## Infrastructure Layer Checklist

- [ ] Read-only queries avoid unnecessary tracking/locking; queries are bounded (pagination/limits)
- [ ] Migrations are additive — no destructive drops without a data migration step
- [ ] Mapping/configuration kept out of domain code
- [ ] HTTP and DB clients are pooled/reused (no per-call client construction)
- [ ] Retries with backoff for transient failures; timeouts on every outbound call
- [ ] No business logic — pure adapters

---

## API / Interface Layer Checklist

- [ ] Authorisation applied to every protected endpoint (anonymous access explicit and justified)
- [ ] Request payloads validated before reaching the handler
- [ ] Response contracts are explicit — internal/persistence models never returned directly
- [ ] Consistent error format (e.g. RFC 9457 Problem Details) and correct status codes
- [ ] Route naming follows the project's convention (e.g. `api/v{ver}/<plural-resource>`)
- [ ] No blocking on async work inside request handlers
- [ ] Request cancellation propagated downstream

---

## Security Checklist (OWASP Top 10)

| # | Risk | Check |
|---|------|-------|
| A01 | Broken Access Control | Every endpoint has explicit authorisation |
| A02 | Cryptographic Failures | Sensitive data encrypted at rest and in transit |
| A03 | Injection | No raw SQL, inputs validated, output encoded |
| A04 | Insecure Design | Threat modelling done for sensitive flows |
| A05 | Security Misconfiguration | Dev error pages off in prod; HSTS enabled |
| A06 | Vulnerable Components | The stack's dependency audit passes (see `commands-<stack>.md`) |
| A07 | Auth Failures | Tokens validated; sessions expire; MFA considered |
| A08 | Integrity Failures | No unsafe deserialisation of untrusted data; package sources trusted and pinned |
| A09 | Logging Failures | Auth events logged; no sensitive data in logs |
| A10 | SSRF | External URLs validated; no user-controlled redirects |

---

## Testing Checklist

- [ ] New behaviour has at least one unit test
- [ ] Happy path tested
- [ ] Null / empty / boundary inputs tested
- [ ] Failure path tested (what happens when dependency fails?)
- [ ] No real sleeps/timers — use a fake clock or controllable time source
- [ ] Assertions present and meaningful
- [ ] Test names describe behaviour (e.g. `returns failure when order not found`)

---

## IaC Checklist

- [ ] All resources parameterised — no environment-specific hardcodes
- [ ] Every resource tagged: `environment`, `application`, `owner`, `cost-centre`
- [ ] Secrets come from the provider's secret store (Key Vault, Secrets Manager, Secret Manager) — never plaintext parameters
- [ ] Workload identity (managed identity, IAM role, service account) used instead of long-lived credentials
- [ ] Private endpoints on data services in production
- [ ] Diagnostic settings configured for all resources
- [ ] Plan / what-if / change-set preview documented in PR description
