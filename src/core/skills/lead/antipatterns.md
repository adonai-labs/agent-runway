# Anti-Patterns — Canonical List

Shared between `lead`, `autonomous-lead`, `refactor`, and `code-review`. This is the single source of truth for stack-neutral anti-patterns. Stack-specific forms (for example C# `.Result`/`async void`, Node unhandled promises, Python mutable default arguments) live in the stack skill when it is installed: `../<stack>-core/patterns.md` or `../<stack>-core/delivery-checks.md`.

---

## Async / Concurrency

| Anti-pattern | Why it's harmful | Fix |
|-------------|-----------------|-----|
| Blocking on async work (sync-over-async) | Deadlocks, thread/event-loop starvation | Await all the way down |
| Fire-and-forget without error handling | Failures silently lost | Await, attach error handling, or use a supervised background job |
| Sleeping to wait for something | Slow and flaky | Await the event, poll with timeout, or use a fake clock in tests |
| Not propagating cancellation | Work continues after the caller gave up | Accept and pass the cancellation token/context/signal |
| Unprotected shared mutable state | Race conditions | Immutability, ownership, or explicit synchronisation |

---

## Dependency Injection & Coupling

| Anti-pattern | Why it's harmful | Fix |
|-------------|-----------------|-----|
| Constructing services inside business logic | Tight coupling, untestable | Pass dependencies in |
| Creating a new HTTP/DB client per call | Socket/connection exhaustion | Reuse a pooled client or factory |
| Service locator / global registry lookup in domain code | Hides dependencies | Inject directly |
| Static state or mutable singletons | Race conditions, test pollution | Avoid shared mutable state |

---

## Error Handling

| Anti-pattern | Why it's harmful | Fix |
|-------------|-----------------|-----|
| Swallowed error (empty catch, `except: pass`, ignored `err`) | Failures silently ignored | Log and propagate, or return an explicit error |
| Exceptions as control flow for expected paths | Performance and clarity | Return result/option types |
| Returning `null`/`None` from service functions for failures | Forces defensive checks everywhere | Return a result type or raise a domain error |
| Leaking internal error detail to callers | Aids attackers | Log detail internally, return a safe message |

---

## Security

| Anti-pattern | Why it's harmful | Fix |
|-------------|-----------------|-----|
| String-built SQL/shell commands | Injection | Parameterised queries, safe exec APIs |
| Secrets in source or committed config | Leaked credentials | Environment/secret manager; local secret store for dev |
| Missing authorisation on protected endpoints | Unauthenticated access | Explicit authorisation on every protected route |
| Logging sensitive data (passwords, tokens, PII) | Data breach via logs | Mask or exclude sensitive fields |
| Deserialising untrusted data with unsafe serializers | Remote code execution | Safe, schema-based serializers |
| Unencoded output in HTML | XSS | Framework auto-escaping / explicit encoding |

---

## Data Access

| Anti-pattern | Why it's harmful | Fix |
|-------------|-----------------|-----|
| N+1 queries | Query per row | Eager load, join, or batch |
| Loading everything then filtering in application memory | Memory and latency | Filter in the query |
| Unbounded queries (no pagination/limit) | OOM on large datasets | Limit + cursor/keyset pagination |
| Writes inside a loop | Round-trip per item | Batch and commit once |

---

## Design

| Anti-pattern | Why it's harmful | Fix |
|-------------|-----------------|-----|
| Anemic domain model — logic in services, entities are data bags | Scattered business rules | Move behaviour to entities/modules that own the data |
| God class / god module | Impossible to test or change | Split by single responsibility |
| Feature envy | Logic in the wrong place | Move the function to the data it uses |
| Primitive obsession (`string` email, `number` money) | No validation or semantics | Introduce value types |
| Magic numbers and strings | Unclear intent | Named constants or configuration |
| Deep nesting (3+ levels) | Hard to read and test | Guard clauses, extract functions |

---

## Testing

| Anti-pattern | Why it's harmful | Fix |
|-------------|-----------------|-----|
| Real sleeps in tests | Flaky and slow | Fake clock / controllable time |
| Testing implementation details | Breaks on refactoring | Test observable behaviour |
| No assertion | False confidence | At least one meaningful assertion |
| Shared mutable state between tests | Test order dependency | Isolate state per test |
| Skipped or focused tests committed | Hidden regressions | Fix or delete with a linked issue |
