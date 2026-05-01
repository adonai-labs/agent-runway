# Anti-Patterns — Canonical List

Shared between `lead` and `code-review` skills. This is the single source of truth.

---

## Async / Await

| Anti-pattern | Why it's harmful | Fix |
|-------------|-----------------|-----|
| `.Result` or `.Wait()` on a Task | Deadlocks in ASP.NET Core sync context | `await` the Task |
| `async void` (outside event handlers) | Exceptions are uncatchable | Return `Task` |
| `Thread.Sleep` in async code | Blocks the thread | `await Task.Delay(ms)` |
| Not propagating `CancellationToken` | Requests can't be cancelled gracefully | Accept and pass `CancellationToken` through |
| Missing `ConfigureAwait(false)` in library code | Context switching overhead | Add `ConfigureAwait(false)` in non-UI libraries |

---

## Dependency Injection & Coupling

| Anti-pattern | Why it's harmful | Fix |
|-------------|-----------------|-----|
| `new ServiceClass()` inside a method | Tight coupling, untestable | Inject via constructor |
| `new HttpClient()` directly | Socket exhaustion | Use `IHttpClientFactory` |
| Service locator (`serviceProvider.GetService<T>()`) inside domain | Hides dependencies | Inject directly |
| Static state or mutable singletons | Race conditions, test pollution | Avoid shared mutable state |

---

## Error Handling

| Anti-pattern | Why it's harmful | Fix |
|-------------|-----------------|-----|
| `catch (Exception) { }` — swallowed exception | Failures silently ignored | Log and rethrow or return `Result.Failure` |
| Exception as control flow for expected paths | Performance and clarity | Use `Result<T>` or `Option<T>` |
| Returning `null` from service methods | Forces null checks everywhere | Return `Result<T>` or throw a domain exception |
| Generic error messages to callers | Aids attackers; hides root cause | Log detail internally, expose safe message externally |

---

## Security

| Anti-pattern | Why it's harmful | Fix |
|-------------|-----------------|-----|
| SQL string concatenation | SQL injection | Parameterised queries / EF Core |
| Secrets in source code or `appsettings.json` | Leaked credentials | Azure Key Vault / user-secrets locally |
| Missing `[Authorize]` on protected endpoints | Unauthenticated access | Explicit `[Authorize]` on every protected action |
| Logging sensitive data (passwords, tokens, PII) | Data breach via logs | Mask or exclude sensitive fields |
| `BinaryFormatter` usage | Arbitrary code execution via deserialisation | Use `System.Text.Json` |
| XSS via unencoded output | Cross-site scripting | `HtmlEncoder.Default.Encode()` |

---

## Data Access

| Anti-pattern | Why it's harmful | Fix |
|-------------|-----------------|-----|
| N+1 queries (missing `.Include()`) | Exponential DB calls | Eager load with `.Include()` |
| Loading entire table then filtering in memory | Memory and performance | Apply `.Where()` before materialising |
| Unbounded queries (no pagination) | OOM on large datasets | Add `.Take()` + `.Skip()` or use cursor pagination |
| `SaveChanges` inside a loop | DB round-trips per iteration | Batch and save once |

---

## Design

| Anti-pattern | Why it's harmful | Fix |
|-------------|-----------------|-----|
| Anemic domain model — logic in services, entities are DTOs | Scattered business rules | Move behaviour to entities |
| God class / God service | Impossible to test or change | Split by Single Responsibility |
| Feature envy — method uses another object's data more than its own | Wrong layer for the logic | Move method to the correct class |
| Primitive obsession — `string` for Email, `int` for Money | No validation or semantics | Introduce value objects |
| Magic numbers and strings | Unclear intent | Named constants or configuration |
| Deep nesting (3+ levels) | Hard to read and test | Guard clauses, extract methods |

---

## Testing

| Anti-pattern | Why it's harmful | Fix |
|-------------|-----------------|-----|
| `Thread.Sleep` in tests | Flaky and slow | Use `FakeTimeProvider` or mock time |
| Testing implementation details | Breaks on refactoring | Test observable behaviour |
| No assertion — test always passes | False confidence | At least one meaningful `Assert` |
| Shared mutable state between tests | Test order dependency | Isolate state per test |
