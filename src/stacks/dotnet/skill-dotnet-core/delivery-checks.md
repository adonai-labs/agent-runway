# .NET Delivery Checks

.NET/C# specifics for the stack-neutral core workflows. The `lead`, `autonomous-lead`, `refactor`, and `code-review` skills load this file when the `dotnet-core` skill is installed.

C# versions of the `refactor` skill's patterns are in [refactoring-examples.md](refactoring-examples.md).

Use it together with [architecture.md](architecture.md), [application-patterns.md](application-patterns.md), [infrastructure.md](infrastructure.md), [api-design.md](api-design.md), [testing.md](testing.md), [security.md](security.md), and [observability.md](observability.md).

---

## Build, Test, Format (lead Phase 8, code-review Phase 6)

```powershell
dotnet build --no-incremental
dotnet test
dotnet format --verify-no-changes
dotnet list package --vulnerable
```

All must pass before handoff.

---

## Find Existing Patterns (lead Phase 0 / Phase 3 DRY analysis)

```powershell
rg "class.*Command\b|class.*Query\b" --type cs -l     # commands / queries
rg "IRequestHandler<" --type cs -l                     # handlers (MediatR or equivalent)
rg "AbstractValidator<" --type cs -l                   # FluentValidation validators
rg "interface I.*Repository" --type cs                 # repository interfaces
rg "class.*Event\b" --type cs -l                       # domain events
rg ": ValueObject|: IEquatable" --type cs -l           # value objects
rg "public static.*this " --type cs -l                 # extension methods
rg "IEntityTypeConfiguration<" --type cs -l            # EF Core configurations
```

---

## Incremental Checks (lead Phase 4b)

Run after each `.cs` file. Expected: 0 matches in touched files.

```powershell
rg "\.Result\b|\.Wait\(\)|\.GetAwaiter\(\)\.GetResult\(\)" --type cs   # blocking async
rg "async void " --type cs                                             # async void (non-event handlers)
rg "new HttpClient\(\)" --type cs                                      # use IHttpClientFactory
rg "catch\s*\([^)]*\)\s*\{\s*\}" --type cs                             # swallowed exceptions
rg "FromSqlRaw\(|ExecuteSqlRaw\(|\"SELECT |\"INSERT |\"UPDATE |\"DELETE " --type cs  # raw SQL
rg "(password|secret|apikey|connectionstring|token)\s*=\s*\"[^{\"]{4,}\"" --type cs -i  # secrets
rg "public.*Task.*Async\([^)]*\)" --type cs                            # verify CancellationToken
rg "\[ApiController\]" -A 5 --type cs                                  # verify [Authorize]/[AllowAnonymous]
```

Layer boundaries:

- [ ] Domain: no `Microsoft.*`, EF Core, or HTTP references
- [ ] Application: no direct `DbContext` — repository interfaces only
- [ ] Infrastructure implements interfaces defined in Application
- [ ] API: no business logic — delegates to handlers (MediatR or the project's mediator)
- [ ] Public async methods accept `CancellationToken ct = default` and pass it downstream
- [ ] Inputs validated with FluentValidation or DataAnnotations

---

## .NET Anti-Patterns

| Anti-pattern | Why it's harmful | Fix |
|-------------|-----------------|-----|
| `.Result` / `.Wait()` / `GetAwaiter().GetResult()` | Deadlocks and thread-pool starvation | `await` the Task |
| `async void` (outside event handlers) | Exceptions are uncatchable | Return `Task` |
| `Thread.Sleep` in async code | Blocks a thread-pool thread | `await Task.Delay(ms)` |
| Missing `ConfigureAwait(false)` in library code | Context capture overhead | Add it in shared/library projects only |
| `new HttpClient()` | Socket exhaustion | `IHttpClientFactory` |
| `serviceProvider.GetService<T>()` in domain | Hidden dependencies | Constructor injection |
| `BinaryFormatter` | Arbitrary code execution | `System.Text.Json` |
| Secrets in `appsettings.json` | Leaked credentials | Key Vault / user-secrets locally |
| Missing `[Authorize]` | Unauthenticated access | Explicit `[Authorize]` or justified `[AllowAnonymous]` |
| N+1 (missing `.Include()`) | Query per row | `.Include()` or batch query |
| `.ToList()` before `.Where()` | Filters in memory | Filter before materialising |
| Unbounded `.ToListAsync()` | OOM on large sets | `.Skip()/.Take()` or keyset pagination |
| `SaveChanges` inside a loop | Round-trip per item | Batch and save once |
| `Thread.Sleep` in tests | Flaky, slow | `FakeTimeProvider` |
| String interpolation in log calls | Not queryable | Message templates: `LogInformation("Order {OrderId}", id)` |

---

## C# Standards Examples

```csharp
// Constructor injection (primary constructor)
public class OrderService(IOrderRepository repository, ILogger<OrderService> logger) { }

// Async all the way, with cancellation and Result<T> for expected failures
public async Task<Result<Order>> CancelOrderAsync(Guid id, CancellationToken ct = default)
{
    var order = await repository.FindAsync(id, ct);
    if (order is null) return Result.Failure<Order>("Order not found");
    order.Cancel();
    await repository.SaveAsync(order, ct);
    return Result.Success(order);
}

// Explicit, logged error handling
catch (DbException ex)
{
    logger.LogError(ex, "Failed to persist order {OrderId}", order.Id);
    throw new OrderPersistenceException("Unable to save order", ex);
}

// FluentValidation at the application boundary
public class CreateOrderCommandValidator : AbstractValidator<CreateOrderCommand>
{
    public CreateOrderCommandValidator()
    {
        RuleFor(x => x.CustomerId).NotEmpty();
        RuleFor(x => x.Items).NotEmpty();
    }
}
```

---

## Conventional Layout and Naming

```
src/<AppName>.Domain/<Aggregate>/...
src/<AppName>.Application/Features/<Feature>/<Command|Query>/...
src/<AppName>.Infrastructure/Persistence/{Configurations,Migrations,Repositories}
src/<AppName>.Api/{Endpoints|Controllers,Middleware}
tests/<AppName>.{Domain,Application,Integration}.Tests/
```

| Concern | Convention |
|---------|------------|
| Command / query | `VerbNounCommand`, `GetNounQuery` / `ListNounQuery` |
| Handler | Command/query name + `Handler` |
| Domain event | Past tense: `OrderCancelledEvent` |
| Repository | `I<Entity>Repository` (Application), `Ef<Entity>Repository` (Infrastructure) |
| Migration | `dotnet ef migrations add <PascalCaseDescription>` |

```powershell
dotnet ef migrations add <Name> --project src/<AppName>.Infrastructure --startup-project src/<AppName>.Api
dotnet ef database update --project src/<AppName>.Infrastructure --startup-project src/<AppName>.Api
```

---

## Code Review Layer Checklist (.NET additions)

- [ ] Domain: navigation properties use private setters or `init`; value objects override `Equals`/`GetHashCode`
- [ ] Application: handlers implement one `IRequestHandler<TRequest, TResponse>`; validators registered
- [ ] Infrastructure: `.AsNoTracking()` for read-only queries; `IEntityTypeConfiguration<T>` instead of `OnModelCreating` bloat; Polly (or `Microsoft.Extensions.Http.Resilience`) for transient failures
- [ ] API: `ProblemDetails` for errors; `CancellationToken` from `HttpContext.RequestAborted`

---

## Refactoring Smell Searches (C#)

```powershell
rg "^\s{16,}(if|else|foreach|for|while|switch|try|catch)" --type cs      # deep nesting
rg "(string\s+(email|phone|currency|country|url))" --type cs -i           # primitive obsession
rg "(decimal\s+(amount|price|total|cost|fee|rate))" --type cs -i
rg "\.\w+\s*=\s*" --type cs --glob "*Service.cs" --glob "*Handler.cs"     # anemic domain (services mutating entities)
rg "switch\s*\(" -A 15 --type cs                                          # switch on type
rg "using.*Infrastructure" --type cs --glob "**/Domain/**" --glob "**/Application/**"   # layer leaks
rg "DbContext|SqlConnection|HttpClient|BlobClient" --type cs --glob "**/Domain/**" --glob "**/Application/**"
```

Characterisation test example (xUnit + FluentAssertions):

```csharp
[Fact]
public async Task PlaceOrder_WithEmptyLines_ThrowsInvalidOperation()
{
    var act = () => CreateHandler().HandleAsync(new PlaceOrderCommand(Guid.NewGuid(), []), CancellationToken.None);
    await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("No items");
}
```
