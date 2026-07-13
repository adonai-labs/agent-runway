---
name: python-core
description: Python implementation guidance — stack-specific. Covers project structure, clean architecture, testing with pytest, security, and observability for Python backend services and APIs. Use when the user asks about Python-specific patterns, structuring a service, testing strategy, or production reliability. Invoke via @python-core after `agent-runway add python`. Combines with architect for design reasoning.
---

# Python Core

## How to invoke

After `agent-runway add python`, the skill is installed at `.cursor/skills/python-core/`. Use:

- **Cursor:** `@python-core` or ask a Python question while editing `*.py` (rules auto-attach)
- **Claude Code:** reference `.agent-runway/skills/python-core/SKILL.md` or ask in context of Python files

Examples:
- How should I structure this FastAPI service?
- How do I test this use case without hitting the database?
- How do I add structured logging with correlation IDs?
- Is this error handling idiomatic Python?

> Not sure which skill to use? Start with `/start` — it classifies intent and routes to the right skill.

---

## Guiding principles

Simplicity first. Python's culture favours readability and directness — respect it.

- Start flat; add structure only when complexity demands it
- One function, one responsibility — small, testable, named for what it does
- SOLID applies: DIP via dependency injection, ISP via focused ABCs, DRY for business logic
- Prefer explicit over magic; avoid metaclasses, deep decorators, and framework-specific tricks unless necessary
- Clean Architecture at the right scale — do not introduce it for a script or a small API

---

## What this skill helps with

- Project structure scaled to complexity — scripts to full layered services
- FastAPI / Django REST / Flask patterns — routing, validation, error handling
- Testing: pytest, fixtures, mocking, integration with Testcontainers
- Security: input validation, SQL injection, secrets, dependency audit
- Observability: `structlog` / standard `logging`, OpenTelemetry, health endpoints
- Toolchain: `pyproject.toml`, `uv`, type checking with `mypy`/`pyright`

---

## Skill files

| File | Contents |
|------|----------|
| [architecture.md](architecture.md) | Project structure, layers, dependency rules, config |
| [patterns.md](patterns.md) | Service layer, repository, dependency injection, error handling |
| [testing.md](testing.md) | pytest setup, fixtures, mocking, Testcontainers, API testing |
| [security.md](security.md) | Input validation, SQL injection, secrets, subprocess safety |
| [observability.md](observability.md) | Structured logging, OpenTelemetry, health checks |
| [reference.md](reference.md) | Toolchain, pyproject.toml, common commands |

---

## Related

- `architect` — design decisions and ADRs
- `code-review` — searches-python.md for review passes
- Rules in `.cursor/rules/` — python.mdc auto-attaches on `*.py` files
