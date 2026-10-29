# Standards — DO / DON'T & Self-Review Checklist

Stack-neutral standards. Examples use TypeScript and Python for brevity; the principle is what matters. When the stack skill is installed, its `../<stack>-core/patterns.md` shows the idiomatic form (for .NET, `dotnet-core` also provides C# examples in its delivery checks).

---

## Naming

| DO | DON'T |
|----|-------|
| `calculateOrderTotal()` | `calc()`, `doStuff()` |
| `isOrderCancelled` | `flag`, `check`, `b` |
| `userAccountBalance` | `x`, `val`, `temp` |
| `OrderRepository` | `Repo`, `Data` |
| `OrderCreated` (event) | `Event1`, `OrderEvent` |
| `cancelOrder` (use case) | `handler`, `processor` |

---

## Dependency Injection

```ts
// DO — dependencies passed in (constructor, factory, or function parameters)
export function createOrderService(repo: OrderRepository, mailer: Mailer, log: Logger) { /* ... */ }

// DON'T — hidden construction or global lookup inside business logic
function processOrder() {
  const repo = new PostgresOrderRepository(globalPool); // untestable, tightly coupled
}
```

---

## Async / Concurrency

```ts
// DO — await all the way, propagate cancellation
async function getOrder(id: string, signal?: AbortSignal): Promise<Result<Order>> {
  const order = await repo.find(id, { signal });
  return order ? ok(order) : err('not_found');
}

// DON'T — fire-and-forget or blocking on async work
repo.save(order);            // unawaited promise: errors vanish
```

Equivalent rules: no `.Result`/`.Wait()` in C#, no `asyncio.run()` inside a running loop in Python, no `block_on` inside async Rust, always pass `context.Context` in Go.

---

## Error Handling

```python
# DO — explicit, logged, meaningful
try:
    repo.save(order)
except DatabaseError as exc:
    log.error("failed to persist order", extra={"order_id": order.id})
    raise OrderPersistenceError("unable to save order") from exc

# DON'T — swallowed
try:
    repo.save(order)
except Exception:
    pass
```

---

## Expected Failures as Values

```ts
// DO — expected outcomes are explicit results, not exceptions
async function cancelOrder(id: string): Promise<Result<Order>> {
  const order = await repo.find(id);
  if (!order) return err('order_not_found');
  if (order.isCancelled) return err('already_cancelled');
  order.cancel();
  await repo.save(order);
  return ok(order);
}

// DON'T — exceptions as control flow for expected paths
if (!order) throw new NotFoundError('Order not found');
```

Use the project's idiom: `Result<T>` types, `(value, error)` returns in Go, `Result<T, E>` in Rust, discriminated unions in TypeScript.

---

## Validation

```python
# DO — validate once, at the boundary, with a schema
class CreateOrder(BaseModel):
    customer_id: UUID
    items: conlist(OrderItem, min_length=1)

# DON'T — ad-hoc checks scattered across layers
if not command.customer_id:
    raise ValueError("...")
```

Typical tools: Zod/Valibot (TS), Pydantic (Python), FluentValidation/DataAnnotations (.NET), `validator` crates (Rust), struct tags + validator (Go).

---

## Structured Logging

```ts
// DO — semantic properties, queryable in the log backend
log.info({ orderId: order.id, customerId: order.customerId }, 'order created');

// DON'T — interpolated strings
log.info(`Order ${order.id} created for customer ${order.customerId}`);
```

---

## Self-Review Checklist

Run before Phase 7 (Summary).

### Code Quality
- [ ] All function names express intent clearly
- [ ] No function longer than ~30 lines without justification
- [ ] No nesting deeper than 3 levels
- [ ] No magic numbers or strings
- [ ] No dead code committed

### SOLID
- [ ] Each module/class has a single reason to change
- [ ] Dependencies passed in — no hidden construction of services
- [ ] Interfaces/ports are narrow and purposeful
- [ ] No copy-pasted logic — DRY applied

### Security
- [ ] All inputs validated at the boundary
- [ ] Authorisation on all protected endpoints
- [ ] No secrets in source
- [ ] No sensitive data in logs
- [ ] Injection impossible (parameterised queries, safe command execution)

### Architecture
- [ ] Domain/core has no framework references
- [ ] Application layer reaches I/O only through abstractions
- [ ] Correct feature/module placement
- [ ] Migrations included if the schema changed

### Testing
- [ ] Unit tests for domain logic and use cases
- [ ] Edge cases covered (null/empty, boundary values)
- [ ] All tests pass
- [ ] No flaky patterns (real sleeps, unseeded randomness, test-order dependence)

### Observability
- [ ] Key operations logged with structured properties
- [ ] Correlation/trace IDs propagated
- [ ] Health checks updated if new dependencies added

### Scope
- [ ] No unrelated changes in this PR
- [ ] IaC updated if new infrastructure required
- [ ] Breaking changes identified and documented
