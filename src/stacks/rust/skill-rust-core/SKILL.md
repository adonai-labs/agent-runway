---
name: rust-core
description: Rust implementation guidance — stack-specific. Covers project structure, idiomatic patterns, ownership, error handling, testing, security, and observability for Rust backend services and CLIs. Use when the user asks about Rust-specific patterns, ownership, async with Tokio, testing strategy, or production reliability. Invoke via @rust-core after `agent-runway add rust`. Combines with architect for design reasoning.
---

# Rust Core

## How to invoke

After `agent-runway add rust`, the skill is installed at `.cursor/skills/rust-core/`. Use:

- **Cursor:** `@rust-core` or ask a Rust question while editing `*.rs` (rules auto-attach)
- **Claude Code:** reference `.agent-runway/skills/rust-core/SKILL.md` or ask in context of Rust files

Examples:
- How should I structure this Axum service?
- Is this ownership correct or should I clone?
- How do I test this handler without a real database?
- Which error type should I use in this library vs application?

> Not sure which skill to use? Start with `/start` — it classifies intent and routes to the right skill.

---

## Guiding principles

Rust's type system and ownership model enforce correctness — let them do the work.

- Prefer owned types and borrowing over complex lifetimes; readable code first
- Start with the simplest module layout that works; split only when the file becomes hard to navigate
- SOLID applies: single-responsibility modules, small focused traits, DI via trait objects or generics
- DRY for business logic; avoid macro magic when a plain function would do
- Async with Tokio for I/O-bound services; sync for CLIs and tools — do not default to async
- No over-engineering: a struct with plain methods is usually the right start

---

## What this skill helps with

- Workspace and crate structure scaled to complexity
- Ownership, borrowing, and lifetime patterns
- Async services with Axum / Actix; CLI with Clap
- Error handling: `thiserror` for libraries, `anyhow` for applications
- Testing: unit (`#[cfg(test)]`), integration (`tests/`), property-based, HTTP
- Security: OWASP Rust, dependency audit with `cargo audit`
- Observability: `tracing`, OpenTelemetry, health endpoints

---

## Skill files

| File | Contents |
|------|----------|
| [architecture.md](architecture.md) | Workspace layout, crate boundaries, config |
| [patterns.md](patterns.md) | Ownership, error handling, service layer, trait-based DI |
| [testing.md](testing.md) | Unit, integration, HTTP handler testing, proptest |
| [security.md](security.md) | Input validation, SQL injection, subprocess safety, `cargo audit` |
| [observability.md](observability.md) | `tracing`, OpenTelemetry, health endpoints |
| [reference.md](reference.md) | `Cargo.toml`, common commands, toolchain |

---

## Related

- `architect` — design decisions and ADRs
- `code-review` — Rust-specific review searches
- Rules in `.cursor/rules/` — `rust-development.mdc` auto-attaches on `*.rs` files
