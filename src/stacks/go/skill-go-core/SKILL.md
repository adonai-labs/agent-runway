---
name: go-core
description: Go implementation guidance — stack-specific. Covers project structure, idiomatic patterns, testing, security, and observability for Go backend services and CLIs. Use when the user asks about Go-specific structure, error handling, concurrency, testing strategy, or production reliability. Invoke via @go-core after `agent-runway add go`. Combines with architect for design reasoning.
---

# Go Core

## How to invoke

After `agent-runway add go`, the skill is installed at `.cursor/skills/go-core/`. Use:

- **Cursor:** `@go-core` or ask a Go question while editing `*.go` (rules auto-attach)
- **Claude Code:** reference `.agent-runway/skills/go-core/SKILL.md` or ask in context of Go files

Examples:
- How should I structure this HTTP service?
- Is this error handling idiomatic Go?
- How do I test this handler without spinning up a real server?
- How do I propagate context through this service?

> Not sure which skill to use? Start with `/start` — it classifies intent and routes to the right skill.

---

## Guiding principles

Simplicity is the core Go value. Respect it.

- Start flat; add packages only when the code genuinely separates
- Explicit over implicit — no magic, no frameworks that hide behaviour
- One thing per function; keep function bodies short and readable
- SOLID applies: small interfaces defined at the consumer; single responsibility per package
- DRY for business rules; duplication in wiring / glue is acceptable
- Concurrency only when the problem requires it — do not default to goroutines

---

## What this skill helps with

- Project structure scaled to size — single package to multi-package services
- Idiomatic error handling, context propagation, and interface design
- HTTP services with `net/http` or chi — routing, middleware, error handling
- Testing: table-driven tests, `httptest`, Testcontainers
- Security: OWASP Go, SQL injection, secrets, subprocess safety
- Observability: `slog`, OpenTelemetry, health endpoints

---

## Skill files

| File | Contents |
|------|----------|
| [architecture.md](architecture.md) | Project structure, packages, dependency rules, config |
| [patterns.md](patterns.md) | Error handling, context, interfaces, service layer |
| [testing.md](testing.md) | Table-driven tests, httptest, Testcontainers, benchmarks |
| [security.md](security.md) | SQL injection, input validation, subprocess safety, secrets |
| [observability.md](observability.md) | `slog`, OpenTelemetry, health endpoints |
| [reference.md](reference.md) | `go.mod`, common commands, module conventions |

---

## Related

- `architect` — design decisions and ADRs
- `code-review` — `code-review-searches.md` for Go-specific review passes
- Rules in `.cursor/rules/` — `go.mdc` auto-attaches on `*.go` files
