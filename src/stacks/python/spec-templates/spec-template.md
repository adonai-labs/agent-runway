# Python Spec Template (Clean Architecture + Clean Code)

Use this template when the active stack is Python.

## Stack Scaffold Proposal

```text
src/
  <package>/
    domain/
      entities.py
      value_objects.py
      errors.py
    application/
      use_cases/
      ports.py          # Protocol classes the use cases depend on
      dto.py
    infrastructure/
      persistence/      # SQLAlchemy repositories implementing ports
      clients/          # external HTTP/queue clients
    api/
      routes/           # FastAPI routers: parse, call use case, map response
      schemas.py        # Pydantic request/response models
    config.py           # pydantic-settings, validated at startup
    main.py             # composition root / app factory
tests/
  unit/
  integration/
pyproject.toml          # managed with uv; ruff + mypy/pyright configured
```

## Clean Architecture Guidance

- Domain and application must not import FastAPI, SQLAlchemy, or HTTP clients.
- Application declares ports as `typing.Protocol`; infrastructure implements them.
- API layer converts Pydantic schemas to DTOs; never return ORM models directly.
- Wire dependencies in `main.py` (or FastAPI dependencies), not inside use cases.

## Clean Code Guidance

- Type-annotate every public function; type checker runs in CI.
- Raise specific domain exceptions; map them to HTTP errors in one handler.
- Keep functions small; name use cases by intent (`place_order`, `cancel_order`).
- pytest with fixtures; fakes for ports in unit tests; Testcontainers for integration.
