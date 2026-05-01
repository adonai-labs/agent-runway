# Application Patterns

CQRS, MediatR, handlers, validation, pipeline behaviours, events, and feature organisation for .NET Core applications.

---

## CQRS principles

Separate the write model (commands) from the read model (queries).

- Commands change state, enforce invariants, and raise events; they do not return domain objects
- Queries read state, return DTOs shaped for consumers; they do not change state
- Neither commands nor queries should expose domain entities directly as results

CQRS is not mandatory for every endpoint. Apply it where read and write concerns genuinely differ in complexity, shape, or scale.

---

## Commands

A command represents explicit intent to perform a state change.

**Structure**
```csharp
public record PlaceOrderCommand(Guid CustomerId, IReadOnlyList<OrderLineDto> Lines)
    : IRequest<Result<Guid>>;
```

**Handler**
```csharp
public class PlaceOrderCommandHandler : IRequestHandler<PlaceOrderCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(PlaceOrderCommand command, CancellationToken ct)
    {
        // 1. Load aggregate
        // 2. Invoke domain method
        // 3. Persist
        // 4. Return result
    }
}
```

**Rules**
- Handlers are thin orchestrators; business rules live in the domain
- Do not return domain entities from handlers; return identifiers or lightweight result types
- Always accept `CancellationToken` and pass it to all async calls
- Use `Result<T>` or `OneOf` for expected failure cases; throw exceptions for truly unexpected failures

---

## Queries

A query retrieves a read-optimised projection for a consumer.

**Structure**
```csharp
public record GetOrderByIdQuery(Guid OrderId) : IRequest<OrderDetailDto?>;
```

**Handler**
```csharp
public class GetOrderByIdQueryHandler : IRequestHandler<GetOrderByIdQuery, OrderDetailDto?>
{
    public async Task<OrderDetailDto?> Handle(GetOrderByIdQuery query, CancellationToken ct)
    {
        return await _dbContext.Orders
            .AsNoTracking()
            .Where(o => o.Id == query.OrderId)
            .Select(o => new OrderDetailDto(...))
            .FirstOrDefaultAsync(ct);
    }
}
```

**Rules**
- Use `AsNoTracking()` for all queries; never use the write DbContext for tracking read-only queries
- Project to DTOs directly in the query; do not load the aggregate and then map
- Queries may query the database directly without going through the domain model
- Queries should not raise events or trigger side effects

---

## MediatR registration

Register MediatR and all handlers in the Application layer:

```csharp
services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssembly(typeof(ApplicationAssemblyMarker).Assembly);
    cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
    cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
    cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(TransactionBehavior<,>));
});
```

Order matters: behaviours execute in registration order. Place logging before validation; transaction after validation.

---

## Pipeline behaviours

Use pipeline behaviours for cross-cutting application concerns.

### Validation behaviour

```csharp
public class ValidationBehavior<TRequest, TResponse>
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken ct)
    {
        var failures = _validators
            .Select(v => v.Validate(request))
            .SelectMany(r => r.Errors)
            .Where(e => e is not null)
            .ToList();

        if (failures.Count != 0)
            throw new ValidationException(failures);

        return await next();
    }
}
```

### Logging behaviour

Log command name, execution time, and warnings for slow requests. Do not log request contents unless sensitive data is absent.

### Transaction behaviour

Wrap commands in a database transaction. Queries should not use this behaviour — scope it only to `ICommand` or a marker interface.

---

## FluentValidation

Define validators in the Application layer, co-located with the command or query they validate.

```csharp
public class PlaceOrderCommandValidator : AbstractValidator<PlaceOrderCommand>
{
    public PlaceOrderCommandValidator()
    {
        RuleFor(x => x.CustomerId).NotEmpty();
        RuleFor(x => x.Lines).NotEmpty().WithMessage("An order must have at least one line.");
        RuleForEach(x => x.Lines).SetValidator(new OrderLineDtoValidator());
    }
}
```

Register validators from the Application assembly:

```csharp
services.AddValidatorsFromAssembly(typeof(ApplicationAssemblyMarker).Assembly);
```

---

## Domain events

Domain events are raised inside aggregates and dispatched after the transaction commits.

### Raising events in the aggregate

```csharp
public class Order : AggregateRoot
{
    private readonly List<IDomainEvent> _events = new();
    public IReadOnlyList<IDomainEvent> Events => _events.AsReadOnly();

    public void Place()
    {
        // validate and change state
        _events.Add(new OrderPlacedEvent(Id, CustomerId));
    }
}
```

### Dispatching after the transaction

In the `SaveChangesAsync` override of DbContext, or via a `DomainEventDispatcher` called in the transaction behaviour after `SaveChangesAsync` succeeds:

```csharp
var events = context.ChangeTracker
    .Entries<AggregateRoot>()
    .SelectMany(e => e.Entity.Events)
    .ToList();

foreach (var @event in events)
    await mediator.Publish(@event, cancellationToken);
```

### Domain event handlers

```csharp
public class OrderPlacedEventHandler : INotificationHandler<OrderPlacedEvent>
{
    public async Task Handle(OrderPlacedEvent notification, CancellationToken ct)
    {
        // send confirmation, trigger downstream workflow, etc.
    }
}
```

---

## Integration events

Integration events cross module or service boundaries. They differ from domain events in scope and transport.

- Define integration events in a shared contracts project or publish them through a message broker
- Do not directly publish a domain event as an integration event; translate at the application boundary
- Use the outbox pattern when reliable delivery is required alongside state persistence

---

## Orchestration vs choreography

**Orchestration** — a handler explicitly invokes each step in a workflow. The flow is visible and debuggable. Prefer orchestration for complex workflows.

**Choreography** — handlers react to events independently. The flow is more decoupled but harder to trace. Prefer choreography for simple, stable side effects.

Do not mix orchestration and choreography in the same workflow without a clear model for each.

---

## Transaction boundaries

- One command = one transaction
- Transactions should not span multiple aggregates if possible; if they must, keep scope tight
- Query handlers do not need transactions; use `AsNoTracking` and read-only scopes
- Do not rely on EF Core change tracking across multiple aggregates; load and save per handler

---

## Repositories in the application layer

- Repositories are defined as interfaces in Application (`IOrderRepository`)
- Handlers accept repositories via constructor injection
- Keep repository interfaces focused on aggregate access; do not add complex query methods to the write-side repository
- Use the DbContext directly in query handlers for flat projections; use repositories in command handlers for aggregate loading

---

## Feature-first file layout

Group handlers, validators, and DTOs by feature inside the Application project:

```
Application/
├── Orders/
│   ├── Commands/
│   │   ├── PlaceOrder/
│   │   │   ├── PlaceOrderCommand.cs
│   │   │   ├── PlaceOrderCommandHandler.cs
│   │   │   └── PlaceOrderCommandValidator.cs
│   │   └── CancelOrder/
│   └── Queries/
│       └── GetOrderById/
│           ├── GetOrderByIdQuery.cs
│           ├── GetOrderByIdQueryHandler.cs
│           └── OrderDetailDto.cs
└── Common/
    ├── Behaviours/
    │   ├── ValidationBehavior.cs
    │   ├── LoggingBehavior.cs
    │   └── TransactionBehavior.cs
    └── Exceptions/
        ├── ValidationException.cs
        └── NotFoundException.cs
```

---

## Minimal API vs controllers

Use **Minimal APIs** when:
- The endpoint is simple and self-contained
- You want concise syntax and less boilerplate
- The team is comfortable with the pattern

Use **controllers** when:
- You need attribute-based conventions at class level (e.g., shared `[Authorize]`, `[Route]`)
- The team has strong existing familiarity
- Many endpoints share common filter or action filter logic

Both are valid. Choose consistently within a project or module. The endpoint should be thin regardless of approach.

---

## Application exceptions

Define well-typed exceptions in the Application layer:

```csharp
public class NotFoundException : Exception
{
    public NotFoundException(string name, object key)
        : base($"Entity '{name}' ({key}) was not found.") { }
}

public class ForbiddenAccessException : Exception { }
```

Map these to HTTP status codes in the global exception handler, not in individual handlers.
