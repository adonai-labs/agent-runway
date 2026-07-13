# python-core/reference.md

# Reference

Toolchain, `pyproject.toml`, and common commands for Python projects.

---

## pyproject.toml

```toml
[project]
name = "my-service"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.110",
    "uvicorn[standard]>=0.29",
    "pydantic>=2.6",
    "pydantic-settings>=2.2",
    "sqlalchemy[asyncio]>=2.0",
    "asyncpg>=0.29",
    "structlog>=24.1",
    "opentelemetry-sdk>=1.23",
    "opentelemetry-instrumentation-fastapi>=0.44b0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8",
    "pytest-asyncio>=0.23",
    "pytest-cov>=5",
    "httpx>=0.27",          # AsyncClient for API tests
    "testcontainers[postgres]>=4",
    "pip-audit>=2.7",
    "mypy>=1.9",
    "ruff>=0.4",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.ruff]
line-length = 100
select = ["E", "F", "I", "UP", "B", "SIM"]
ignore = ["E501"]

[tool.mypy]
strict = true
ignore_missing_imports = false

[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"
addopts = "--strict-markers -q"
```

---

## Package management with uv (recommended)

```bash
# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# Create project and venv
uv init my-service
uv venv

# Add dependency
uv add fastapi

# Add dev dependency
uv add --dev pytest pytest-asyncio

# Lock
uv lock

# Install from lock (CI)
uv sync --frozen
```

---

## Common commands

```bash
# Run dev server
uvicorn src.main:app --reload

# Type check
mypy src

# Lint and format
ruff check src
ruff format src

# Tests
pytest                                   # all tests
pytest tests/unit                        # unit only
pytest -m "not integration"             # skip integration
pytest --cov=src --cov-report=term-missing

# Security audit
pip-audit
pip-audit --fail-on-vuln               # CI blocking check

# Dependency check
uv pip list --outdated
```

---

## Useful stdlib modules

| Module | Use for |
|--------|---------|
| `asyncio` | Async event loop, `gather`, `create_task`, `to_thread` |
| `pathlib` | Cross-platform file paths |
| `contextlib` | `asynccontextmanager`, `contextmanager`, `suppress` |
| `functools` | `lru_cache`, `wraps`, `partial` |
| `dataclasses` | Lightweight data containers (prefer Pydantic at boundaries) |
| `uuid` | `uuid4()` for IDs |
| `datetime` | Dates and times; use `datetime.now(timezone.utc)` for UTC |
| `subprocess` | Child processes; always pass args as a list |
| `logging` | Standard logging; use `structlog` on top |
