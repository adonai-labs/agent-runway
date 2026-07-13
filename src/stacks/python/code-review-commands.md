# Python Build & Test Commands

Commands to run during code review for Python projects.

---

## Test

```bash
pytest
# with coverage
pytest --cov=src --cov-report=term-missing
```

All must pass. Document any failures as Critical findings.

---

## Type Checking

```bash
mypy src
# or
pyright
```

Type checking should pass. Document new type errors as High findings.

---

## Linting

```bash
ruff check .
```

Linting should pass with no errors. Document failures as High findings.

---

## Format Check

```bash
black --check .
ruff format --check .
```

Code must be formatted. Document failures as Medium findings.

---

## Security Audit

```bash
# Dependency vulnerabilities
pip-audit

# Static security analysis
bandit -r src
```

Review vulnerabilities and insecure patterns. Document High and Critical issues as Critical findings.
