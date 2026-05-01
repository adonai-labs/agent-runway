# Reference — Review Checklists

> **Source of truth for quality criteria**: [`../lead/standards.md`](../lead/standards.md)
> The checklists below are reviewer-specific — they cover what a reviewer verifies layer by layer.
> For the canonical DO/DON'T examples and developer self-review checklist, see `standards.md`.
> If a criterion appears in both files and they conflict, `standards.md` takes precedence.

---

## Domain Layer Checklist

- [ ] No `using Microsoft.*` or `using System.Data.*` in domain entities
- [ ] Entities enforce invariants in constructors or factory methods — not services
- [ ] Navigation properties are private setters or `init`
- [ ] Domain events raised for cross-aggregate side effects
- [ ] Value objects override `Equals` and `GetHashCode`
- [ ] No `public` setters on aggregate roots for mutable state — use methods

---

## Application Layer Checklist

- [ ] Each handler handles exactly one command or query
- [ ] `IRequestHandler<TRequest, TResponse>` used consistently (MediatR)
- [ ] Validators registered and applied (`AbstractValidator<T>`)
- [ ] No direct `DbContext` — only repository interfaces
- [ ] `CancellationToken` accepted and propagated
- [ ] `Result<T>` returned for expected failures; exceptions for unexpected ones

---

## Infrastructure Layer Checklist

- [ ] EF Core queries use `.AsNoTracking()` for read-only scenarios
- [ ] Migrations are additive — no destructive column drops without a data migration step
- [ ] `IEntityTypeConfiguration<T>` used — no `OnModelCreating` bloat
- [ ] `HttpClient` registered via `IHttpClientFactory`
- [ ] Polly retry policies applied to transient HTTP/DB failures
- [ ] No business logic — pure infrastructure adapters

---

## API Layer Checklist

- [ ] `[Authorize]` applied (or `[AllowAnonymous]` explicitly justified)
- [ ] Request DTOs use `[Required]` or FluentValidation
- [ ] Response DTOs are explicit — no entity objects returned directly
- [ ] Problem Details (`ProblemDetails`) used for error responses
- [ ] Route naming follows `api/v{ver}/<plural-resource>` convention
- [ ] Async all the way — no `.Result` or `.Wait()`
- [ ] `CancellationToken` accepted from `HttpContext.RequestAborted`

---

## Security Checklist (OWASP Top 10)

| # | Risk | Check |
|---|------|-------|
| A01 | Broken Access Control | Every endpoint has explicit authorisation |
| A02 | Cryptographic Failures | Sensitive data encrypted at rest and in transit |
| A03 | Injection | No raw SQL, inputs validated, output encoded |
| A04 | Insecure Design | Threat modelling done for sensitive flows |
| A05 | Security Misconfiguration | Dev error pages off in prod; HSTS enabled |
| A06 | Vulnerable Components | `dotnet list package --vulnerable` passes |
| A07 | Auth Failures | Tokens validated; sessions expire; MFA considered |
| A08 | Integrity Failures | `BinaryFormatter` not used; NuGet source trusted |
| A09 | Logging Failures | Auth events logged; no sensitive data in logs |
| A10 | SSRF | External URLs validated; no user-controlled redirects |

---

## Testing Checklist

- [ ] New behaviour has at least one unit test
- [ ] Happy path tested
- [ ] Null / empty / boundary inputs tested
- [ ] Failure path tested (what happens when dependency fails?)
- [ ] No `Thread.Sleep` — use `FakeTimeProvider` or mock
- [ ] Assertions present and meaningful
- [ ] Test method names describe behaviour: `Should_ReturnFailure_When_OrderNotFound`

---

## IaC Checklist

- [ ] All resources parameterised — no environment-specific hardcodes
- [ ] Every resource tagged: `environment`, `application`, `owner`, `cost-centre`
- [ ] Secrets are Key Vault references — not in parameter files in plaintext
- [ ] Managed identity used instead of service principal where possible
- [ ] Private endpoints on data services in production
- [ ] Diagnostic settings configured for all resources
- [ ] `what-if` run documented in PR description
