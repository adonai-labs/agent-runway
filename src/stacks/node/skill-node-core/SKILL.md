---
name: node-core
description: Node.js implementation guidance — stack-specific. Covers architecture, async patterns, process lifecycle, testing, security, and observability for Node.js backend services, APIs, workers, and CLIs. Use when the user asks about Node.js-specific patterns, process management, stream handling, or production reliability. Invoke via skill discovery or @node-core after `agent-runway add node`. Combines with typescript-core for type safety and architect for design reasoning.
---

# Node Core

## How to invoke

After `agent-runway add node`, the skill is installed at `.cursor/skills/node-core/`. Use:

- **Cursor:** `@node-core` or ask a Node.js question while editing `*.js` / `*.ts` (rules auto-attach)
- **Claude Code:** reference `.agent-runway/skills/node-core/SKILL.md` or ask in context of Node.js files

Examples:
- How should I structure this Express service?
- How do I handle graceful shutdown with a Kafka consumer?
- How do I test this worker with a real Redis instance?
- How do I stream large files without loading them into memory?

> Not sure which skill to use? Start with `/start` — it classifies intent and routes to the right skill.

---

## Role

Act as a senior Node.js engineer with deep experience in production backend services, process lifecycle management, async patterns, stream processing, and operational reliability.

This skill is **Node.js runtime-specific**. For TypeScript type system guidance, combine with `typescript-core`. For system design and trade-offs, combine with `architect`.

---

## Guiding principles

Simplicity first. Add complexity only when the problem demands it.

- Start with the simplest structure that solves the problem
- SOLID and DRY as guides, not ceremonies — SRP means one reason to change, not one file per concept
- Clean Architecture at the right scale; a flat `src/routes/, src/services/, src/db/` is fine for small services
- No premature abstraction; extract only when duplication is in business logic, not glue code
- Prefer explicit over clever; the next developer should understand the code without this skill

## What this skill helps with

- Project structure scaled to complexity
- Async patterns: async/await, streams, graceful shutdown
- Express / Fastify API patterns — middleware, routing, error handling
- Testing: Supertest, Testcontainers, process and queue testing
- Security: OWASP Node, child process safety, SSRF, secrets
- Observability: Pino, OpenTelemetry, health checks

---

## Skill files

| File | Contents |
|------|----------|
| [architecture.md](architecture.md) | Project structure, layering, hexagonal patterns, module system |
| [patterns.md](patterns.md) | Async patterns, streams, EventEmitter, worker threads, queues |
| [testing.md](testing.md) | Jest + Supertest, Testcontainers, worker and stream testing |
| [security.md](security.md) | OWASP Node, child process safety, dependency audit, secrets |
| [observability.md](observability.md) | Pino, OpenTelemetry, health checks, memory and CPU profiling |
| [reference.md](reference.md) | Common CLI commands, package.json scripts, useful built-ins |

---

## Related

- `typescript-core` — type safety, tsconfig, TypeScript patterns
- `architect` — design decisions and ADRs
- `code-review` — searches-node.md for review passes
- Rules in `.cursor/rules/` — node.mdc auto-attaches on Node.js files
