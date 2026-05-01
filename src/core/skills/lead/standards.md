# Standards — DO / DON'T & Self-Review Checklist

---

## Naming

| DO | DON'T |
|----|-------|
| `CalculateOrderTotal()` | `Calc()`, `DoStuff()` |
| `isOrderCancelled` | `flag`, `check`, `b` |
| `userAccountBalance` | `x`, `val`, `temp` |
| `IOrderRepository` | `IRepo`, `IData` |
| `OrderCreatedEvent` | `Event1`, `OrderEvent` |
| `CreateOrderCommandHandler` | `Handler`, `Processor` |

---

## Dependency Injection

```csharp
// ✅ Constructor injection — always
public class OrderService(
    IOrderRepository repository,
    IEmailSender emailSender,
    ILogger<OrderService> logger)
{ }

// ❌ Service locator — never
public void Process() {
    var repo = _serviceProvider.GetService<IOrderRepository>();
}

// ❌ Direct instantiation — never
public void Process() {
    var repo = new OrderRepository(_db);
}
```

---

## Async / Await

```csharp
// ✅ Async all the way down
public async Task<Result<Order>> GetOrderAsync(Guid id, CancellationToken ct = default)
{
    var order = await _repository.FindAsync(id, ct);
    return order is null ? Result.Failure<Order>("Not found") : Result.Success(order);
}

// ❌ Blocking — causes deadlocks
var order = GetOrderAsync(id).Result;
var order = GetOrderAsync(id).GetAwaiter().GetResult();
```

---

## Error Handling

```csharp
// ✅ Explicit, logged, meaningful
try
{
    await _repository.SaveAsync(order, ct);
}
catch (DbException ex)
{
    _logger.LogError(ex, "Failed to persist order {OrderId}", order.Id);
    throw new OrderPersistenceException("Unable to save order", ex);
}

// ❌ Swallowed — dangerous
try { await _repository.SaveAsync(order, ct); }
catch { }
```

---

## Result Pattern

```csharp
// ✅ Explicit outcomes — no exception for expected failures
public async Task<Result<Order>> CancelOrderAsync(Guid id, CancellationToken ct)
{
    var order = await _repository.FindAsync(id, ct);
    if (order is null) return Result.Failure<Order>("Order not found");
    if (order.IsCancelled) return Result.Failure<Order>("Order already cancelled");

    order.Cancel();
    await _repository.SaveAsync(order, ct);
    return Result.Success(order);
}

// ❌ Exception as control flow for expected outcomes
if (order is null) throw new NotFoundException("Order not found");
```

---

## Validation

```csharp
// ✅ FluentValidation at the application boundary
public class CreateOrderCommandValidator : AbstractValidator<CreateOrderCommand>
{
    public CreateOrderCommandValidator()
    {
        RuleFor(x => x.CustomerId).NotEmpty();
        RuleFor(x => x.Items).NotEmpty().ForEach(item =>
            item.ChildRules(i => i.RuleFor(x => x.Quantity).GreaterThan(0)));
    }
}

// ❌ Manual validation scattered across multiple layers
if (command.CustomerId == Guid.Empty) throw new ArgumentException("...");
```

---

## Structured Logging

```csharp
// ✅ Semantic properties — searchable in Application Insights / Seq
_logger.LogInformation("Order {OrderId} created for customer {CustomerId}", order.Id, order.CustomerId);

// ❌ String interpolation — not queryable
_logger.LogInformation($"Order {order.Id} created for customer {order.CustomerId}");
```

---

## Self-Review Checklist

Run before Phase 7 (Summary).

### Code Quality
- [ ] All method names express intent clearly
- [ ] No method longer than ~30 lines without justification
- [ ] No nesting deeper than 3 levels
- [ ] No magic numbers or strings
- [ ] No dead code committed

### SOLID
- [ ] Each class has a single reason to change
- [ ] Dependencies injected — no `new` for services
- [ ] Interfaces are narrow and purposeful
- [ ] No copy-pasted logic — DRY applied

### Security
- [ ] All inputs validated at the boundary
- [ ] `[Authorize]` on all protected endpoints
- [ ] No secrets in source
- [ ] No sensitive data in logs
- [ ] SQL injection impossible (parameterised or EF Core)

### Architecture
- [ ] Domain layer has no framework references
- [ ] Application layer uses only interfaces for I/O
- [ ] Correct feature folder placement
- [ ] EF Core migrations included if schema changed

### Testing
- [ ] Unit tests for domain logic and handlers
- [ ] Edge cases covered (null, empty, boundary)
- [ ] All tests pass
- [ ] No flaky patterns (`Thread.Sleep`, random data without seed)

### Observability
- [ ] Key operations logged with structured properties
- [ ] Correlation IDs propagated
- [ ] Health checks updated if new dependencies added

### Scope
- [ ] No unrelated changes in this PR
- [ ] IaC updated if new infrastructure required
- [ ] Breaking changes identified and documented
