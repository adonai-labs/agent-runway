---
name: typescript-core
description: TypeScript implementation guidance — stack-specific. Covers architecture, application patterns, testing, security, observability, and API design for TypeScript applications. Use when the user asks how to structure TypeScript code, type-safe patterns, testing strategies, or security practices. Invoke via skill discovery or @typescript-core after `agent-runway add typescript`. Combines with the `architect` skill for design and trade-off reasoning.
---

# TypeScript Core

## How to invoke

After `agent-runway add typescript`, the skill is installed at `.cursor/skills/typescript-core/`. Use:

- **Cursor:** `@typescript-core` or ask a TypeScript question while editing `*.ts` / `*.tsx` (rules auto-attach)
- **Claude Code:** reference `.agent-runway/skills/typescript-core/SKILL.md` or ask in context of TypeScript files

Examples:
- How should I structure this service layer?
- Is this generics pattern idiomatic?
- How do I test this use-case function?
- How do I add structured logging with correlation IDs?

> Not sure which skill to use? Start with `/start` — it classifies intent and routes to the right skill.

---

## Role

Act as a senior TypeScript engineer with deep experience in scalable application architecture, type system design, testing strategy, and production observability for Node.js and browser targets.

This skill is **TypeScript-specific**. For system design and trade-off reasoning, combine with the `architect` skill.

---

## Guiding principles

Simplicity first. SOLID, DRY, and Clean Architecture apply at the right scale — not ceremonially.

- Start with the simplest structure that satisfies the requirement
- Add layers, interfaces, and patterns only when there is a proven reason (variation, instability, scale)
- One responsibility per unit; no mixed concerns in a single function or module
- DRY for business logic and decision rules; duplication in glue code is acceptable
- Prefer explicit code over clever code; readability is a feature

## What this skill helps with

- Project structure scaled to complexity — flat for small, layered for large
- Type-safe patterns — service layer, repository, Result types, DI
- Testing: unit, integration, and API testing with Vitest/Jest
- Security: input validation, JWT, secrets hygiene, dependency audit
- Observability: structured logging with Pino, OpenTelemetry
- Toolchain: tsconfig, ESM/CJS, build scripts

---

## Skill files

| File | Contents |
|------|----------|
| [architecture.md](architecture.md) | Project structure, layering, dependency rules, monorepo patterns |
| [patterns.md](patterns.md) | DI, service layer, repository, Result types, CQRS-lite |
| [testing.md](testing.md) | Test strategy, Vitest/Jest setup, mocking, integration testing |
| [security.md](security.md) | Input validation, OWASP, JWT, secrets, dependency hygiene |
| [observability.md](observability.md) | Pino logging, OpenTelemetry, correlation IDs, health checks |
| [reference.md](reference.md) | Toolchain, tsconfig options, common scripts, ESM/CJS |

---

## Related

- `architect` — design decisions and ADRs
- `code-review` — searches-typescript.md for review passes
- Rules in `.cursor/rules/` — typescript.mdc, advanced-patterns.mdc, api-design-typescript.mdc auto-attach on `*.ts` files
