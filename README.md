# Agent Runway

[npm version](https://www.npmjs.com/package/@adonai-labs/agent-runway)
[license](LICENSE)
[stars](https://github.com/adonai-labs/agent-runway)
[downloads](https://www.npmjs.com/package/@adonai-labs/agent-runway)

**AI agents are good at writing code. They are not good at remembering what they decided last week.**

Agent Runway keeps delivery knowledge in the repository — specs, memory, run logs, quality gates — so agents and humans can keep building without starting from scratch every session.

It does not replace your stack, your architecture, or your process. It wraps around them.

As of v1.5, Agent Runway ships implementation skills for seven stacks: .NET, TypeScript, Node.js, React, Python, Go, and Rust. Each skill covers the primary web and service patterns for that stack — architecture, testing, security, and observability — following the same principles: simplicity, SOLID, DRY, and Clean Architecture at the right scale.

## Quick Start

```bash
npx @adonai-labs/agent-runway init
```

Then open the project in Cursor, Claude Code, or VS Code and run `/start`.

Or install first:

```bash
npm install -D @adonai-labs/agent-runway
npx agent-runway init
```

## Before vs after

| Without Agent Runway         | With Agent Runway                       |
| ---------------------------- | --------------------------------------- |
| Repeated prompting           | Persistent engineering memory           |
| Inconsistent implementations | Repeatable execution patterns           |
| Lost architectural context   | Reusable delivery context               |
| Chaotic autonomous runs      | Governed autonomous workflows           |
| Weak traceability            | Traceable decisions and run logs        |
| Documentation entropy        | Lightweight, useful operational context |

## See it in action

| `/spec-creator` | `/ticket-creator` | `/lead`   |
| --------------- | ----------------- | --------- |
| spec demo       | ticket demo       | lead demo |

## The problem

Generating code with AI is no longer the hard part. Maintaining continuity across a real codebase is.

Most teams hit the same wall:

- context lost between sessions
- architectural decisions made and forgotten
- the same mistakes showing up in different features
- autonomous execution with no traceability
- implementations that drift from requirements

The repository is the only context that survives. Agent Runway makes it an active engineering environment — not just a file store.

## How it works

Agent Runway is artifact-driven. Work moves through four layers:

```
Spec       →  define intent and behavior
Workflow   →  orchestrate execution with quality gates
Rules      →  enforce standards at every step
Memory     →  capture decisions and lessons for future sessions
```

Artifacts are active engineering context — not passive docs. Specs, tickets, memory files, and run logs shape how agents reason, plan, and execute across sessions.

## Work modes

### Lightweight

For small, low-risk, well-scoped work:

- `/express` — minimal ceremony
- `/lead` — use Fast-Track Mode when you already have a plan (see `/lead` skill)

### Structured delivery

For normal feature work:

- `/spec-creator` — define intent and behavior before implementation
- `/ticket-creator` — create ready-to-dev tickets from descriptions or backlog items
- `/lead` — full implementation workflow with quality gates

### Governed autonomous execution

For unattended runs where you need full traceability:

- `/autonomous-lead` — same quality bar as `/lead`, plus mandatory run logs, ADR gates, and human approval before destructive actions

## Commands

Each command points to a full skill workflow. Names may differ from the skill folder — see mapping below.

### Command → skill mapping

| Command | Skill folder | Notes |
| ------- | ------------ | ----- |
| `/start` | `start` | Router |
| `/spec-creator` | `spec-creator` | |
| `/ticket-creator` | `ticket-creator` | |
| `/validate` | `ticket-eval` | Command name kept for readability |
| `/po-eval` | `po-eval` | |
| `/architect` | `architect` | |
| `/contrarian` | `contrarian` | |
| `/lead` | `lead` | Includes Fast-Track Mode when you already have a plan |
| `/autonomous-lead` | `autonomous-lead` | |
| `/express` | `express` | |
| `/refactor` | `refactor` | |
| `/review` | `code-review` | Command name kept for readability |
| `/iac` | `iac` | |

Stack-specific guidance has **no slash commands** — use installed rules (auto on matching files) and stack skills (e.g. `@dotnet-core`) after `agent-runway add <stack>`.

### Planning

| Command           | What it does                                                           |
| ----------------- | ---------------------------------------------------------------------- |
| `/start`          | Entry point — routes to the right workflow                             |
| `/spec-creator`   | Create and refine implementation specs                                 |
| `/ticket-creator` | Create ready-to-dev tickets from descriptions or backlogs              |
| `/validate`       | Evaluate a ticket or user story for development readiness              |
| `/po-eval`        | Evaluate a spec or ticket from a product perspective                   |
| `/architect`      | Design decisions, trade-off analysis, and ADRs                         |
| `/contrarian`     | Adversarial review of a chosen approach — isolated context, clean bias |

### Execution

| Command            | What it does                                         |
| ------------------ | ---------------------------------------------------- |
| `/lead`            | Full implementation workflow with quality gates (Fast-Track Mode when you have a plan) |
| `/autonomous-lead` | Autonomous implementation with run logs and ADR gate |
| `/express`         | Minimal-friction path for small changes              |
| `/refactor`        | Guided refactoring without behavior changes          |
| `/iac`             | Infrastructure as Code guidance (Bicep / Terraform)  |

### Review and quality

| Command   | What it does                                                                    |
| --------- | ------------------------------------------------------------------------------- |
| `/review` | Structured code review — multi-pass lenses (engineering, security, performance) |

### CLI

```bash
agent-runway init          # Initialise project
agent-runway add <stack>   # Add a stack
agent-runway update        # Update framework files
agent-runway list          # List installed stacks
agent-runway status        # Show current installation state
agent-runway metrics       # Delivery scorecard from gate verdicts + run logs
agent-runway ci-check      # Optional governance validation for CI (see --profile strict)
```

## Artifact model

Delivery knowledge lives in the repository, not in chat.

```
.agent-runway/
├── specs/
│   └── <slug>/
│       ├── spec.md
│       ├── epic.md
│       ├── summary.md
│       └── tickets/
│           ├── task-01-<description>.md
│           └── task-02-<description>.md
├── docs/
├── memory/
├── config/
├── workflows/
└── logs/
```

| Artifact | Purpose                                                                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `specs`  | Intent, scope, behavior, and delivery tickets — grouped by feature                                                                          |
| `memory` | Repeated mistakes, architectural decisions, lessons learned — kept signal-dense by a hygiene policy (deduped, capped, archived not deleted) |
| `docs`   | Business context, architecture, contracts                                                                                                   |
| `logs`   | Autonomous execution traces and run decisions                                                                                               |

## Supported environments

- **Cursor**
- **Claude Code**
- **VS Code Copilot**

The artifact layer is repository-local and portable across all three.

## Installation details

`init` always creates a local `.agent-runway/` folder with the artifact layer (`specs`, `memory`, `docs`, `config`, `workflows`, `logs`).

Target-specific files:

| Environment     | Files installed                                                                                                      |
| --------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Cursor**      | `.cursor/commands/`, `.cursor/skills/`, `.cursor/rules/`, `.cursor/agents/`                                          |
| **Claude Code** | `.claude/commands/`, `.claude/agents/`, `CLAUDE.md`, `.agent-runway/skills/`, `.agent-runway/rules/`                 |
| **VS Code**     | `.github/copilot-instructions.md`, `.github/instructions/`, `.github/prompts/`, `.github/agents/`, `.github/skills/` |

### Global installation

```bash
npx @adonai-labs/agent-runway init --scope global --preset core-only
```

Applies commands and rules globally in Cursor. The `.agent-runway/` scaffold is still created per-project so artifacts remain repository-scoped.

### Project installation (default)

```bash
npx @adonai-labs/agent-runway init --scope project --target claude --preset web-fullstack-ts
```

Recommended for teams. All files go into the repository and can be committed and shared.

## What it is not

Agent Runway is not a magic system that removes the need for engineering judgment.

It is not:

- an application framework
- an SDK abstraction layer
- a "fully autonomous AI engineer"
- a replacement for architecture or documentation practices

## Who this is for

Agent Runway delivers the most value when:

- your codebase is long-lived
- your team onboards new members often
- architecture consistency matters across features
- you use coding agents heavily and want consistent output
- autonomous execution must stay controlled and traceable

For small or short-lived projects, the lighter paths (`/express`, `/lead` Fast-Track Mode) will cover most of what you need.

## Roadmap

### Recently shipped

- **Stack skills for TypeScript, Node.js, React, Python, Go, and Rust** — full implementation skills (architecture, patterns, testing, security, observability) at parity with the .NET reference stack
- Delivery metrics CLI (`agent-runway metrics`) — gate pass rates, pending ACs, autonomous run stats
- Machine-readable gate verdicts (`# agent-runway:verdict`) and run headers (`# agent-runway:run`)
- Optional CI governance validation (`agent-runway ci-check --profile strict`)
- Update notifications and version-drift warnings via `agent-runway status`
- Command hygiene — phase shortcuts and stack commands removed; core workflows only

### Next

| Area | Goal |
| ---- | ---- |
| **Spec lifecycle** | Explicit states (draft → ready → in-progress → done) linked to tickets, runs, and metrics |
| **Dashboard** | Visual view over metrics data — gate outcomes, run health, memory usage |
| **VS Code extension** | Discoverability and in-editor slash commands |
| **OpenAI Agents / Codex** | Fourth install target using the same skills/commands model |

### Later (design first)

- Richer workflow orchestration — declarative phase states without over-building a workflow engine
- Stronger multi-agent coordination — shared finding artefacts and deduplicated handoffs between review passes

### Stack depth policy

The core framework is stack-agnostic. **No stack has its own slash command** — stacks install rules, code-review integration, and optional stack skills via `agent-runway add <stack>`.

| How to get stack guidance | Mechanism |
| ------------------------- | --------- |
| Editing matching source files | Rules (`.mdc`) attach via globs — e.g. `*.cs`, `*.ts`, `*.py` |
| Deep implementation patterns | Stack skill when installed — e.g. `@dotnet-core` in Cursor |
| Review and build commands | Injected into `/review` (`searches-*`, `commands-*`) |

All stacks ship with an implementation skill covering architecture, patterns, testing, security, and observability. Each skill targets the primary web and service frameworks for that stack — not the entire language ecosystem.

| Stack | Stack skill | Primary scope | Rules | Review |
| ----- | ----------- | ------------- | ----- | ------ |
| **.NET** | `dotnet-core` | ASP.NET Core, EF Core, MediatR | Full | Full |
| **TypeScript** | `typescript-core` | Vitest, Zod, Pino | Full | Full |
| **Node.js** | `node-core` | Express / Fastify | Full | Full |
| **React** | `react-core` | React 18+ Vite SPA, React Query | Full | Full |
| **Python** | `python-core` | FastAPI, pytest, structlog | Full | Full |
| **Go** | `go-core` | net/http / chi, slog | Full | Full |
| **Rust** | `rust-core` | Axum, sqlx, tracing | Full | Full |

All stack skills enforce the same principles: simplicity first, SOLID and DRY as guides, Clean Architecture at the right scale, and no over-engineering.

Governance enforcement is **opt-in**: use `agent-runway ci-check --profile strict` in CI when you want artefact validation; the default install does not require it.

## The bottom line

Most teams don't struggle because AI can't write code.

They struggle because context disappears, decisions are forgotten, and every session starts from scratch.

Agent Runway keeps the knowledge in the repository, where it belongs — so agents and humans can keep building without losing ground.

Start small. Keep what works. Evolve as your team grows.
