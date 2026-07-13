# python-core/security.md

# Security for Python

OWASP-aligned security standards for Python backend applications.

---

## Input validation

Validate all external input at the boundary using Pydantic.

```python
from pydantic import BaseModel, field_validator, EmailStr
from uuid import UUID

class PlaceOrderDto(BaseModel):
    customer_id: UUID
    lines: list[OrderLineDto]

    @field_validator("lines")
    @classmethod
    def lines_not_empty(cls, v: list) -> list:
        if not v:
            raise ValueError("Order must have at least one line")
        if len(v) > 100:
            raise ValueError("Too many lines")
        return v

# FastAPI validates automatically; raise 422 on failure
@router.post("/orders")
async def place_order(dto: PlaceOrderDto) -> dict:
    ...
```

**Rules:**
- Use Pydantic models at every external boundary: HTTP, message queue, config, env vars
- Never trust data from a queue or webhook any less than HTTP input
- Apply length limits and range checks to all string and numeric inputs

---

## SQL injection prevention

```python
# Safe — SQLAlchemy ORM (parameterised by default)
result = await session.execute(select(OrderModel).where(OrderModel.id == order_id))

# Safe — raw SQL with explicit binding
await session.execute(text("SELECT * FROM orders WHERE id = :id"), {"id": order_id})

# NEVER do this
await session.execute(text(f"SELECT * FROM orders WHERE id = '{order_id}'"))
```

**Rules:**
- Use SQLAlchemy ORM or Core; never f-string / `%`-format user input into SQL
- Apply least-privilege database credentials — the app user should not own the schema

---

## Subprocess safety

```python
import subprocess

# Safe — pass args as a list, never shell=True with user input
result = subprocess.run(["ffmpeg", "-i", input_path, output_path], capture_output=True)

# NEVER do this with user-controlled input
subprocess.run(f"ffmpeg -i {user_input} out.mp4", shell=True)  # shell injection
```

**Rules:**
- Pass arguments as a list; avoid `shell=True` unless absolutely necessary
- Validate file paths before passing to subprocesses; reject `..` traversal

---

## Secrets hygiene

```python
# Validate at startup — fail fast
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    jwt_secret: str          # no default; missing = startup failure
    database_url: str

# Use structlog redaction or logging.Filter for sensitive fields
import structlog
structlog.configure(
    processors=[structlog.processors.EventRenamer("event"), ...],
)
# Never log: passwords, tokens, full request bodies with credentials
```

**Rules:**
- Never commit `.env` files; use `.env.example` to document required variables
- Rotate secrets on suspected exposure; use a secrets manager in production
- Do not log PII or credentials; add a custom `logging.Filter` to redact sensitive keys

---

## Dependency security

```bash
# Audit for known vulnerabilities
pip-audit                        # fast, pip-native
safety check -r requirements.txt # alternative

# Check for outdated deps
pip list --outdated

# In CI — fail on high/critical
pip-audit --fail-on-vuln
```

**Rules:**
- Run `pip-audit` in CI as a blocking step
- Pin all dependencies in `pyproject.toml` and lock with `uv lock` or `pip-compile`
- Separate runtime and dev dependencies; `[dev]` extras should not ship in production

---

## Security checklist

- [ ] All external input validated with Pydantic at the boundary
- [ ] No f-string / `%` SQL; parameterised queries only
- [ ] `subprocess.run` uses arg list; `shell=True` avoided
- [ ] Secrets validated at startup; never logged or committed
- [ ] `pip-audit` passes in CI
- [ ] Stack traces not returned in API error responses
