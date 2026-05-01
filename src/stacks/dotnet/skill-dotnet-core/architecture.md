# Architecture

Clean Architecture and structural standards for .NET solutions.

---

## Project structure

A standard .NET solution follows dependency inversion: outer layers depend on inner layers; inner layers have no knowledge of outer layers.

```
Solution.sln
├── src/
│   ├── MyApp.Domain/           ← no external dependencies
│   ├── MyApp.Application/      ← depends on Domain only
│   ├── MyApp.Infrastructure/   ← depends on Application (implements ports)
│   └── MyApp.Api/              ← depends on Application (calls use cases)
└── tests/
    ├── MyApp.Domain.Tests/
    ├── MyApp.Application.Tests/
    ├── MyApp.Infrastructure.Tests/
    └── MyApp.Api.Tests/
```

---

## Layer rules

### Domain

- Contains entities, value objects, domain events, aggregates, domain services, and domain exceptions
- No dependency on any framework, ORM, or infrastructure package
- All external ports (repository interfaces, external service contracts) are defined here or in Application
- Business invariants live here; enforcement happens through constructors and methods, not external validation

### Application

- Contains use cases expressed as command handlers, query handlers, and application services
- References domain but not infrastructure
- Defines interfaces (ports) that infrastructure implements
- No framework-specific code in handlers; keep them independently testable

### Infrastructure

- Implements application and domain ports
- Contains EF Core context, repository implementations, messaging producers/consumers, HTTP clients, external service adapters
- Registers all dependencies in extension methods
- Infrastructure concerns (connection strings, retry policies, health checks) stay here

### Presentation (API)

- Maps HTTP requests to application commands and queries
- Transforms application results to HTTP responses
- Authentication, authorisation middleware, rate limiting, and global error handling live here
- Controllers or endpoints should be thin; no business logic

---

## Feature-first organisation (recommended for medium/large systems)

Within the Application project, organise by feature rather than by technical role:

```
Application/
├── Orders/
│   ├── Commands/
│   │   ├── PlaceOrder.cs
│   │   └── CancelOrder.cs
│   └── Queries/
│       └── GetOrderById.cs
├── Payments/
│   ├── Commands/
│   │   └── ProcessPayment.cs
│   └── Queries/
│       └── GetPaymentStatus.cs
└── Common/
    ├── Behaviours/
    └── Exceptions/
```

This keeps all use-case logic for a feature co-located and makes features independently navigable.

---

## Domain modelling

### Entities

- Entities have identity (`Id`) that persists through state changes
- Constructors enforce creation invariants; do not allow invalid state
- Business behaviour belongs on the entity as methods; avoid anemic models where behaviour lives outside
- Avoid public property setters on domain entities; use intent-expressing methods

### Value objects

- Values have no identity; equality is by their attributes
- Immutable by design; all properties set at construction
- Enforce their own invariants in the constructor; throw domain exceptions for invalid values
- Common examples: `Money`, `Email`, `Address`, `DateRange`

### Aggregates

- An aggregate is a consistency boundary: all invariants within the boundary are enforced by the aggregate root
- External code accesses only the aggregate root; never navigate to child entities directly from outside
- Aggregates should be kept small — if navigation inside requires multiple steps, consider splitting
- Aggregate roots raise domain events to signal important state changes

### Domain events

- Raised inside the aggregate when something meaningful happens
- Collected on the aggregate and dispatched after the transaction commits
- Consumers are application-layer handlers; domain should not know about transport mechanics

---

## CQRS in .NET (Clean Architecture)

Use CQRS to separate concerns between state changes and queries:

- Commands: represent intent to change state; validate, enforce rules, persist, raise events
- Queries: return read-oriented projections; optimised for consumer shape, not domain model shape
- Keep command and query models separate; do not share domain entities with query responses

For implementation details, see [application-patterns.md](application-patterns.md).

---

## Dependency registration

Organise registrations in `IServiceCollection` extension methods, one per layer:

```csharp
builder.Services
    .AddDomainServices()
    .AddApplicationServices()
    .AddInfrastructureServices(builder.Configuration)
    .AddApiServices();
```

Prefer `AddScoped` for request-scoped services (handlers, repositories, DbContext).
Use `AddSingleton` only for truly stateless or thread-safe infrastructure components.
Use `AddTransient` for lightweight stateless utilities.

---

## Naming conventions

| Concept | Convention |
|---------|-----------|
| Command | `PlaceOrderCommand`, `CancelOrderCommand` |
| Query | `GetOrderByIdQuery`, `ListOrdersQuery` |
| Command handler | `PlaceOrderCommandHandler` |
| Query handler | `GetOrderByIdQueryHandler` |
| Domain event | `OrderPlacedEvent`, `PaymentProcessedEvent` |
| Integration event | `OrderPlacedIntegrationEvent` |
| Repository interface | `IOrderRepository` |
| Repository implementation | `OrderRepository` |
| Value object | `Money`, `Email`, `OrderStatus` |
| Aggregate root | `Order`, `Customer`, `Invoice` |
| Application service | `OrderService` (use sparingly; prefer handlers) |

---

## Modular monolith (recommended default)

Before splitting into separate deployable services, structure the solution as a modular monolith:

```
src/
├── Modules/
│   ├── Orders/
│   │   ├── Orders.Domain/
│   │   ├── Orders.Application/
│   │   └── Orders.Infrastructure/
│   └── Payments/
│       ├── Payments.Domain/
│       ├── Payments.Application/
│       └── Payments.Infrastructure/
└── Host/
    └── MyApp.Api/
```

- Modules communicate via explicit contracts (events or public interfaces), not direct project references
- Each module owns its own DbContext and schema
- Services are only extracted when independent deployment, ownership, or scaling pressure is real

---

## Global error handling

Use `IExceptionHandler` (ASP.NET Core 8+) or middleware to map domain and application exceptions to HTTP responses:

- Domain exceptions (`DomainException`, `NotFoundException`) → 400/404/422
- Application exceptions (`ValidationException`) → 422 Unprocessable Entity
- Unexpected exceptions → 500 Internal Server Error with generic message
- Never leak stack traces or internal details to API consumers

Use Problem Details (`application/problem+json`) as the standard error response format.
