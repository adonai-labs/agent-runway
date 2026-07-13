# python-core/testing.md

# Testing for Python

---

## Core principles

- Test behaviour, not implementation — assert outcomes, not which internal methods were called
- Business logic should be testable without HTTP, a real database, or a running server
- A balanced portfolio: fast unit tests for logic, integration tests with real infrastructure, minimal E2E

---

## pytest setup

```toml
# pyproject.toml
[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"       # pytest-asyncio — handles async test functions automatically
addopts = "--strict-markers -q"

[tool.coverage.run]
source = ["src"]
omit = ["*/__init__.py", "*/migrations/*"]

[tool.coverage.report]
fail_under = 80
```

---

## Unit testing services

```python
# tests/unit/test_order_service.py
import pytest
from unittest.mock import AsyncMock, MagicMock
from src.application.order_service import OrderService
from src.domain.models import PlaceOrderDto

@pytest.fixture
def order_repo() -> AsyncMock:
    repo = AsyncMock()
    repo.save.return_value = None
    return repo

@pytest.fixture
def event_publisher() -> AsyncMock:
    return AsyncMock()

@pytest.fixture
def service(order_repo: AsyncMock, event_publisher: AsyncMock) -> OrderService:
    return OrderService(repo=order_repo, events=event_publisher)

async def test_place_order_saves_and_publishes(service: OrderService, order_repo: AsyncMock, event_publisher: AsyncMock) -> None:
    dto = PlaceOrderDto(customer_id="c-1", lines=[{"product_id": "p-1", "qty": 2}])

    order_id = await service.place_order(dto)

    assert order_id is not None
    order_repo.save.assert_awaited_once()
    event_publisher.publish.assert_awaited_once()

async def test_place_order_raises_for_empty_lines(service: OrderService) -> None:
    dto = PlaceOrderDto(customer_id="c-1", lines=[])
    with pytest.raises(InvalidOrderError):
        await service.place_order(dto)
```

**Rules:**
- Use `AsyncMock` for async dependencies; `MagicMock` for sync
- One test per scenario; name as `test_<what>_<condition>`
- `pytest.raises` for expected exceptions — assert the type, not the message (messages change)
- Clear mocks per test via fixtures, not global state

---

## Faking dependencies

Prefer fakes over mocks when the fake is simple:

```python
class FakeOrderRepository:
    def __init__(self) -> None:
        self._store: dict[str, Order] = {}

    async def find_by_id(self, order_id: OrderId) -> Order | None:
        return self._store.get(str(order_id))

    async def save(self, order: Order) -> None:
        self._store[str(order.id)] = order
```

Use `AsyncMock` when you only need to assert a method was called; use a fake when the state matters (e.g. the repository needs to return what was saved).

---

## API testing with pytest + TestClient

```python
# tests/api/test_orders.py
import pytest
from httpx import AsyncClient
from src.main import create_app

@pytest.fixture
async def client() -> AsyncClient:
    app = create_app(settings_override={"environment": "test"})
    async with AsyncClient(app=app, base_url="http://test") as c:
        yield c

async def test_post_order_returns_201(client: AsyncClient) -> None:
    res = await client.post(
        "/orders",
        json={"customer_id": "c-1", "lines": [{"product_id": "p-1", "qty": 1}]},
        headers={"Authorization": "Bearer test-token"},
    )
    assert res.status_code == 201
    assert "order_id" in res.json()

async def test_post_order_returns_422_for_missing_field(client: AsyncClient) -> None:
    res = await client.post("/orders", json={"lines": []})
    assert res.status_code == 422
```

---

## Integration testing with Testcontainers

```python
# tests/integration/conftest.py
import pytest
from testcontainers.postgres import PostgresContainer
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

@pytest.fixture(scope="session")
def postgres():
    with PostgresContainer("postgres:16-alpine") as pg:
        yield pg

@pytest.fixture(scope="session")
async def db_engine(postgres: PostgresContainer):
    engine = create_async_engine(postgres.get_connection_url(driver="asyncpg"))
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()

@pytest.fixture
async def session(db_engine) -> AsyncSession:
    async with AsyncSession(db_engine) as s:
        yield s
        await s.rollback()  # clean state between tests
```

---

## Checklist

- [ ] Services tested without infrastructure dependencies
- [ ] All error paths tested with `pytest.raises`
- [ ] Fixtures used for setup; no shared mutable state between tests
- [ ] API layer tested with `AsyncClient`/`TestClient`
- [ ] Integration tests use Testcontainers; isolated from unit tests in CI
- [ ] `pytest --cov` runs in CI; coverage threshold enforced
