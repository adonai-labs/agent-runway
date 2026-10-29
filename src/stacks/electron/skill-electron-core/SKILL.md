---
name: electron-core
description: Electron implementation guidance — stack-specific. Covers process architecture (main, preload, renderer, utility process), secure defaults (context isolation, sandbox, CSP, navigation guards, fuses), typed IPC, testing with Vitest and Playwright, observability, and packaging. Use when the user asks how to structure an Electron app, whether IPC or webPreferences are safe, how to test main/renderer code, or how to ship and update a desktop app. Invoke via @electron-core after `agent-runway add electron`. Combines with typescript-core and react-core for renderer code and architect for design reasoning.
---

# Electron Core

## How to invoke

After `agent-runway add electron`, the skill is installed into each configured agent's skills directory as `electron-core`. Use:

- **Cursor:** `@electron-core` or ask an Electron question while editing main, preload, or renderer files (rules auto-attach)
- **Claude Code / other agents:** invoke the `electron-core` skill by name, or ask in context of Electron files

Examples:
- Is this `BrowserWindow` configuration secure?
- How should I expose file access to the renderer?
- How do I test this IPC handler without launching Electron?
- How do I capture crashes from the renderer?

> Not sure which skill to use? Start with `/start` — it classifies intent and routes to the right skill.

---

## Guiding principles

Treat the renderer as untrusted web content. Everything else follows from that.

- Secure defaults are non-negotiable: `contextIsolation`, `sandbox`, no `nodeIntegration`, `webSecurity` on
- The main process orchestrates; it must never block — move heavy work to a `utilityProcess`
- IPC is an API boundary: narrow, typed, validated (sender and payload) on every call
- Business logic lives in plain modules with no `electron` import, so it is testable in isolation
- Simplicity first: one window manager, one IPC contract, one preload per window type

---

## What this skill helps with

- Process model and project structure (main / preload / renderer / shared)
- Secure `webPreferences`, CSP, navigation and permission handlers, fuses
- Typed IPC contracts, sender validation, and preload bridges
- Testing: services and handlers with Vitest, E2E with Playwright
- Observability: logging, crash reporting, renderer crash recovery
- Packaging, code signing, and auto-update

---

## Skill files

| File | Contents |
|------|----------|
| [architecture.md](architecture.md) | Processes, project layout, window manager, dependency rules |
| [patterns.md](patterns.md) | Typed IPC, preload bridges, utility processes, lifecycle |
| [testing.md](testing.md) | Unit tests for services and handlers, renderer tests, Playwright E2E |
| [security.md](security.md) | webPreferences, CSP, navigation, IPC validation, fuses, updates |
| [observability.md](observability.md) | Logging, crash reporting, metrics, recovery |
| [reference.md](reference.md) | Toolchain, scripts, packaging, common commands |

---

## Related

- `typescript-core` and `react-core` — renderer and shared type patterns
- `architect` — design decisions and ADRs
- `code-review` — `searches-electron.md` and `commands-electron.md` (installed into the code-review skill) for stack-specific review passes
- Rules: `{{rules}}/electron.mdc` (main, preload, renderer), `{{rules}}/advanced-patterns.mdc` (main process), `{{rules}}/testing-electron.mdc` (tests)
