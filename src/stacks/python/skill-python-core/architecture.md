# python-core/architecture.md

# Architecture

Project structure for Python services — scaled to what is needed, not more.

---

## Start flat

For a small service or API: a simple layout is enough and easier to understand.

```
src/
├── main.py          ← entry point
├── config.py        ← env validation
├── routes/          ← HTTP handlers
├── services/        ← business logic
├── db/              ← database access
└── models/          ← data models / schemas
tests/
```

Do not introduce layers until the flat structure becomes hard to change.

---

## Layered structure (larger services)

When the service grows and concerns need to separate — infrastructure must not leak into business logic:

```
src/
├── domain/          ← entities, value objects, port protocols (no external deps)
├── application/     ← use cases; depends on domain protocols only
├── infrastructure/  ← implements protocols: SQLAlchemy repos, HTTP clients, queues
├── api/             ← FastAPI routers, middleware, error handlers
├── config.py        ← typed env validation with Pydantic settings
└── shared/          ← logging, exceptions, utilities
tests/
├── unit/
├── integration/
└── e2e/
```

**Layer rules:**
- Domain: no SQLAlchemy, FastAPI, or any framework import
- Application: imports domain only; defines repository protocols via `typing.Protocol`
- Infrastructure: implements protocols; knows about the ORM and external services
- API: maps HTTP to application use cases; handles auth, error mapping

---

## Configuration

```python
# config.py
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    database_url: str
    jwt_secret: str
    log_level: str = "INFO"
    environment: str = "development"

settings = Settings()  # raises ValidationError at startup if required vars are missing
```

**Rules:**
- Use `pydantic-settings` to validate env vars at startup — fail fast with a clear error
- Export a single `settings` object; never read `os.environ` directly in application code
- Never default-fill secrets; a missing secret at startup is safer than silent misconfiguration

---

## Dependency injection

Python's DI is usually done with simple constructor injection — no framework needed for most cases.

```python
# Explicit injection — simple and testable
class OrderService:
    def __init__(self, repo: OrderRepository, events: EventPublisher) -> None:
        self._repo = repo
        self._events = events

# In tests — inject a fake
service = OrderService(repo=FakeOrderRepo(), events=FakeEventPublisher())

# With FastAPI — use Depends()
def get_order_service(db: Session = Depends(get_db)) -> OrderService:
    return OrderService(repo=SqlAlchemyOrderRepo(db))

@router.post("/orders")
async def place_order(dto: PlaceOrderDto, svc: OrderService = Depends(get_order_service)):
    ...
```

Reach for `dependency-injector` or similar containers only when the object graph becomes difficult to manage manually.

---

## Naming conventions

| Concept | Convention | Example |
|---------|------------|---------|
| Files / modules | `snake_case` | `order_service.py` |
| Classes | `PascalCase` | `OrderService` |
| Functions / variables | `snake_case` | `place_order`, `order_id` |
| Constants | `UPPER_SNAKE` | `MAX_RETRIES` |
| Abstract base / Protocol | `PascalCase` | `OrderRepository` |
| Test files | `test_*.py` | `test_order_service.py` |
