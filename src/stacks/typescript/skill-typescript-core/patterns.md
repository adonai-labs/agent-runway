# typescript-core/patterns.md

# Application Patterns

Patterns for TypeScript — apply at the right scale, not by default.

**Simplicity rule:** a plain function with explicit parameters is the right starting point. Add a pattern only when you have a concrete reason: reuse, variation, testability, isolation. Patterns introduced prematurely become accidental complexity.

---

## Result type

Use a `Result<T, E>` type for expected failures instead of exceptions. Exceptions are for truly unexpected conditions.

```typescript
type Ok<T> = { ok: true; value: T };
type Err<E> = { ok: false; error: E };
export type Result<T, E = Error> = Ok<T> | Err<E>;

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
export const err = <E>(error: E): Err<E> => ({ ok: false, error });
```

**Rules:**
- Return `Result` from use cases and domain methods for predictable failure paths
- Throw only for truly unexpected conditions (programming errors, infrastructure panics)
- Do not use `Result` for validation — validate at the boundary and throw `ValidationError` before reaching the use case

---

## Service layer

Each use case is a function or a class with a single `execute` method.

```typescript
// use-case as function (preferred for simple cases)
export async function placeOrder(
  dto: PlaceOrderDto,
  deps: { orderRepo: OrderRepository; events: EventBus }
): Promise<Result<OrderId, OrderError>> {
  const order = Order.create(dto);
  if (!order.ok) return order;
  await deps.orderRepo.save(order.value);
  await deps.events.publish(new OrderPlacedEvent(order.value.id));
  return ok(order.value.id);
}

// use-case as class (preferred when you need lifecycle or multiple deps)
export class PlaceOrderUseCase {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly events: EventBus
  ) {}

  async execute(dto: PlaceOrderDto): Promise<Result<OrderId, OrderError>> {
    const order = Order.create(dto);
    if (!order.ok) return order;
    await this.orderRepo.save(order.value);
    await this.events.publish(new OrderPlacedEvent(order.value.id));
    return ok(order.value.id);
  }
}
```

**Rules:**
- One use case per business operation
- Use cases orchestrate; business rules live in domain
- Do not return domain entities from use cases; return IDs or output DTOs
- Accept a `CancellationToken` / `AbortSignal` equivalent for long operations

---

## Repository pattern

Define the port (interface) in Domain or Application; implement in Infrastructure.

```typescript
// domain/order.repository.ts
export interface OrderRepository {
  findById(id: OrderId): Promise<Order | null>;
  findByCustomer(customerId: CustomerId): Promise<Order[]>;
  save(order: Order): Promise<void>;
  delete(id: OrderId): Promise<void>;
}

// infrastructure/prisma-order.repository.ts
export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: OrderId): Promise<Order | null> {
    const row = await this.db.order.findUnique({ where: { id: id.value } });
    return row ? OrderMapper.toDomain(row) : null;
  }
  // ...
}
```

**Rules:**
- Repository interfaces belong in domain/application, never in infrastructure
- Repositories work with domain objects; mapping from/to DB models lives in a mapper
- Do not leak Prisma/TypeORM types across the boundary — domain must not know about the ORM

---

## CQRS-lite

**Use only when read and write concerns genuinely diverge** — different shapes, different scale, different ownership. For most CRUD services, CQRS adds ceremony without benefit.

For services where the divergence is real:

```typescript
// commands
export type PlaceOrderCommand = { customerId: string; lines: OrderLine[] };
export async function handlePlaceOrder(cmd: PlaceOrderCommand, deps: Deps): Promise<Result<string, OrderError>> { ... }

// queries — can bypass domain model and hit DB directly for read-optimised projections
export type GetOrderByIdQuery = { orderId: string };
export async function handleGetOrderById(query: GetOrderByIdQuery, db: DB): Promise<OrderDetailDto | null> {
  return db.query('SELECT ... FROM orders WHERE id = $1', [query.orderId]);
}
```

Full CQRS with event sourcing is heavy — apply only when the read/write shape genuinely differs at scale.

---

## Domain events

```typescript
// domain/events/order-placed.event.ts
export type OrderPlacedEvent = {
  type: 'order.placed';
  orderId: string;
  customerId: string;
  occurredAt: Date;
};

// infrastructure/event-bus.ts
export interface EventBus {
  publish<T extends DomainEvent>(event: T): Promise<void>;
  subscribe<T extends DomainEvent>(type: T['type'], handler: (event: T) => Promise<void>): void;
}
```

**Rules:**
- Domain events describe what happened; they are immutable facts
- Events raised in the domain; published after the transaction commits
- Consumers must be idempotent — duplicate events happen

---

## Value objects and branded types

```typescript
// Branded type for domain primitives
type Brand<T, B extends string> = T & { readonly __brand: B };
export type OrderId = Brand<string, 'OrderId'>;
export type CustomerId = Brand<string, 'CustomerId'>;

// Factory with validation
export const OrderId = {
  create: (raw: string): Result<OrderId, 'invalid-id'> =>
    raw.length > 0 ? ok(raw as OrderId) : err('invalid-id'),
  from: (raw: string) => raw as OrderId,   // only when provenance is trusted
};
```

Use branded types wherever a raw primitive could be confused with another (IDs, emails, currency amounts).
