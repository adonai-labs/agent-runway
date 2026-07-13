# python-core/patterns.md

# Application Patterns

Patterns for Python — apply when the problem justifies the structure, not by default.

**Simplicity rule:** a function that takes arguments and returns a value is the right starting point. Add a class, a protocol, or a layer only when you have a concrete reason: testability, variation, reuse.

---

## Service layer

A service is a plain class or module that encapsulates a business operation. It should not know about HTTP, databases, or queues directly.

```python
# Plain service — no framework dependency
class OrderService:
    def __init__(self, repo: OrderRepository, events: EventPublisher) -> None:
        self._repo = repo
        self._events = events

    async def place_order(self, dto: PlaceOrderDto) -> OrderId:
        order = Order.create(customer_id=dto.customer_id, lines=dto.lines)
        await self._repo.save(order)
        await self._events.publish(OrderPlacedEvent(order_id=order.id))
        return order.id
```

**Rules:**
- One method per business operation; avoid "manager" classes with unrelated methods
- Use cases orchestrate; domain logic lives in domain objects (entities, value objects)
- Do not return ORM models from services — return domain objects or DTOs

---

## Repository pattern via Protocol

Define the interface in domain/application; implement in infrastructure.

```python
# domain/protocols.py
from typing import Protocol
from .models import Order, OrderId

class OrderRepository(Protocol):
    async def find_by_id(self, order_id: OrderId) -> Order | None: ...
    async def save(self, order: Order) -> None: ...

# infrastructure/sqlalchemy_order_repo.py
class SqlAlchemyOrderRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def find_by_id(self, order_id: OrderId) -> Order | None:
        row = await self._session.get(OrderModel, str(order_id))
        return OrderMapper.to_domain(row) if row else None

    async def save(self, order: Order) -> None:
        row = OrderMapper.to_orm(order)
        self._session.add(row)
        await self._session.flush()
```

**Rules:**
- Use `typing.Protocol` (structural subtyping) — no import coupling, easier to fake in tests
- The domain must not import SQLAlchemy models; a mapper translates between representations
- Do not add methods to the protocol unless a use case requires them — YAGNI

---

## Error handling

```python
# Domain exceptions — specific, meaningful
class OrderError(Exception): ...
class OrderNotFoundError(OrderError): ...
class InvalidOrderError(OrderError): ...

# Service raises domain errors; API layer maps them to HTTP status codes
async def place_order(self, dto: PlaceOrderDto) -> OrderId:
    if not dto.lines:
        raise InvalidOrderError("Order must have at least one line")
    ...

# FastAPI exception handler
@app.exception_handler(OrderNotFoundError)
async def order_not_found_handler(request: Request, exc: OrderNotFoundError) -> JSONResponse:
    return JSONResponse(status_code=404, content={"error": str(exc)})
```

**Rules:**
- Always catch specific exceptions; never `except Exception` or bare `except:`
- Add context when re-raising: `raise OrderNotFoundError(...) from original_err`
- Do not log and re-raise the same error — do one or the other at each layer

---

## Async patterns

```python
# Use async for I/O; gather for concurrent independent operations
async def get_order_summary(order_id: str) -> OrderSummary:
    order, customer = await asyncio.gather(
        order_repo.find_by_id(order_id),
        customer_repo.find_by_id(order_id),  # independent I/O
    )
    return OrderSummary(order=order, customer=customer)
```

**Rules:**
- Never call blocking I/O (`requests`, `psycopg2` sync, `open()` for large files) inside an async function — use async clients or `asyncio.to_thread()`
- Use `asyncio.gather()` for independent concurrent awaits, not sequential `await`
- Do not mix sync and async in the same execution path without `asyncio.to_thread()`
