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

[dependency-groups]              # PEP 735; `uv add --dev` writes here
dev = [
    "pytest>=8",
    "pytest-asyncio>=0.23",
    "pytest-cov>=5",
    "httpx>=0.27",          # AsyncClient for API tests
    "testcontainers[postgres]>=4",
    "pip-audit>=2.7",
    "mypy>=1.9",
    "ruff>=0.8",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.ruff]                      # ruff is both linter and formatter — no black/isort/flake8
line-length = 100

[tool.ruff.lint]
select = ["E", "F", "I", "UP", "B", "SIM", "S"]   # S = bandit security rules
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

# Create project (uv creates and manages .venv automatically)
uv init my-service

# Add dependency
uv add fastapi

# Add dev dependency
uv add --dev pytest pytest-asyncio

# Lock
uv lock

# Install from lock (CI)
uv sync --locked

# Run tools inside the project environment
uv run pytest
uv run ruff check .
```

---

## Common commands

```bash
# Run dev server
uv run uvicorn src.main:app --reload

# Type check
uv run mypy src

# Lint and format (ruff only)
uv run ruff check src
uv run ruff format src

# Tests
pytest                                   # all tests
pytest tests/unit                        # unit only
pytest -m "not integration"             # skip integration
pytest --cov=src --cov-report=term-missing

# Security audit — exits non-zero when vulnerabilities are found (CI blocking by default)
uv run pip-audit

# Dependency check
uv tree --outdated
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
