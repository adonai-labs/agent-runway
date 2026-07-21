# Agent Runway

[npm version](https://www.npmjs.com/package/@adonai-labs/agent-runway)
[license](LICENSE)
[stars](https://github.com/adonai-labs/agent-runway)
[downloads](https://www.npmjs.com/package/@adonai-labs/agent-runway)
[roadmap](ROADMAP.md)

**AI agents are good at writing code. They are not good at remembering what they decided last week.**

Agent Runway keeps delivery knowledge in the repository: specs, memory, checkpoints, run logs, rules, and quality gates. Agents and humans can keep building without starting from scratch every session.

It does not replace your stack, architecture, or process. It wraps around them.

As of v1.5, Agent Runway supports Cursor, Claude Code, and VS Code Copilot, and ships implementation skills for .NET, TypeScript, Node.js, React, Python, Go, and Rust.

## Requirements

- Node.js 22 or newer

## Quick Start

Choose the amount of structure you want.

### Vibe/Lite

Fast, skill-first setup for prototypes, solo work, and low-ceremony coding.

```bash
npx @adonai-labs/agent-runway init --preset vibe-lite --target all
```

Lite installs `@start`, `@express`, `@code-review`, `@checkpoint`, `@learning`, `@safety-check`, `@council` preview, and a small rule set for engineering principles, security, and testing. It does not install slash command aliases, agents, or heavy structured delivery workflows.

When the work outgrows Lite, upgrade in place:

```bash
npx agent-runway upgrade --to structured
```

This preserves memory, logs, checkpoints, and docs while adding the full Structured workflow set.

### Structured

Full delivery workflow for long-lived products, teams, and work that needs traceability.

```bash
npx @adonai-labs/agent-runway init --preset node-typescript --target all
```

Structured installs slash commands, agents, specs, tickets, lead/autonomous workflows, architecture/contrarian gates, full rules, and optional governance checks.

Or install first:

```bash
npm install -D @adonai-labs/agent-runway
npx agent-runway init
```

## Why

Generating code with AI is no longer the hard part. Maintaining continuity across a real codebase is.

Most teams hit the same wall:

- context lost between sessions
- architectural decisions made and forgotten
- the same mistakes showing up in different features
- autonomous execution with no traceability
- implementations that drift from requirements

The repository is the only context that survives. Agent Runway makes it an active engineering environment, not just a file store.

## Before vs After

| Without Agent Runway         | With Agent Runway                       |
| ---------------------------- | --------------------------------------- |
| Repeated prompting           | Persistent engineering memory           |
| Inconsistent implementations | Repeatable execution patterns           |
| Lost architectural context   | Reusable delivery context               |
| Chaotic autonomous runs      | Governed autonomous workflows           |
| Weak traceability            | Traceable decisions and run logs        |
| Documentation entropy        | Lightweight, useful operational context |

## How It Works

Agent Runway is artifact-driven. Work moves through four layers:

```text
Spec       -> define intent and behavior
Workflow   -> orchestrate execution with quality gates
Rules      -> enforce standards at every step
Memory     -> capture decisions and lessons for future sessions
```

Artifacts are active engineering context, not passive docs. Specs, tickets, memory files, checkpoints, and run logs shape how agents reason, plan, and execute across sessions.

## Work Modes

### Vibe/Lite

Use Lite when you want speed without losing basic safety.

| Skill | Purpose |
| ----- | ------- |
| `@start` | Route vague work to the right skill |
| `@express` | Make a small, well-scoped change with minimal ceremony |
| `@code-review` | Review code without requiring slash commands or agents |
| `@checkpoint` | Save current state for pause, resume, or handoff |
| `@learning` | Save durable lessons to project memory |
| `@safety-check` | Quick Go / Go with caution / Stop risk check |
| `@council` | Preview council review for idea, hypothesis, or implementation validation |

### Structured Delivery

Use Structured when the work needs traceability, multiple steps, or team alignment.

| Command | Purpose |
| ------- | ------- |
| `/start` | Route work to the right workflow |
| `/spec-creator` | Define intent and behavior before implementation |
| `/ticket-creator` | Create ready-to-dev tickets from descriptions or backlogs |
| `/lead` | Full implementation workflow with quality gates |
| `/review` | Structured code review with engineering, security, and performance lenses |

### Governed Autonomous Execution

Use this for unattended or low-supervision runs where you still need control.

| Command | Purpose |
| ------- | ------- |
| `/autonomous-lead` | Same quality bar as `/lead`, plus mandatory run logs, ADR gates, and human approval before destructive actions |

## Commands and Skills

Most slash commands point to a full skill workflow. Lightweight workflows can be invoked directly as skills.

| Entry point | Skill folder | Notes |
| ----------- | ------------ | ----- |
| `/start` | `start` | Router |
| `/spec-creator` | `spec-creator` | Structured planning |
| `/ticket-creator` | `ticket-creator` | Ticket generation |
| `/validate` | `ticket-eval` | Command name kept for readability |
| `/po-eval` | `po-eval` | Product readiness review |
| `/architect` | `architect` | Design decisions, trade-offs, ADRs |
| `/contrarian` | `contrarian` | Adversarial review of a chosen approach |
| `/lead` | `lead` | Full implementation workflow |
| `/autonomous-lead` | `autonomous-lead` | Governed autonomous workflow |
| `/express` | `express` | Minimal-friction implementation |
| `/refactor` | `refactor` | Guided behavior-preserving refactor |
| `/review` | `code-review` | Command-backed review workflow |
| `/iac` | `iac` | Infrastructure as Code guidance |
| `@checkpoint` | `checkpoint` | Skill-only checkpoint |
| `@learning` | `learning` | Skill-only memory capture |
| `@safety-check` | `safety-check` | Skill-only risk check |
| `@council` | `council` | Skill-only preview council review |

Stack-specific guidance has no slash commands. Use installed rules and stack skills such as `@dotnet-core`, `@typescript-core`, `@node-core`, or `@react-core` after `agent-runway add <stack>`.

## CLI

```bash
agent-runway init          # Initialize project
agent-runway add <stack>   # Add a stack
agent-runway remove <stack> # Remove a stack
agent-runway update        # Update framework files
agent-runway list          # List installed stacks
agent-runway status        # Show installation state
agent-runway metrics       # Delivery scorecard from gate verdicts + run logs
agent-runway ci-check      # Optional governance validation for CI
agent-runway upgrade       # Upgrade Lite projects to Structured mode
```

## Artifact Model

Delivery knowledge lives in the repository, not in chat.

```text
.agent-runway/
|-- specs/
|   `-- <slug>/
|       |-- spec.md
|       |-- epic.md
|       |-- summary.md
|       `-- tickets/
|           |-- task-01-<description>.md
|           `-- task-02-<description>.md
|-- docs/
|-- memory/
|-- config/
|-- workflows/
`-- logs/
```

| Artifact | Purpose |
| -------- | ------- |
| `specs` | Intent, scope, behavior, and delivery tickets grouped by feature |
| `memory` | Repeated mistakes, decisions, and lessons learned |
| `docs` | Business context, architecture, contracts, and testing context |
| `logs` | Checkpoints, review outputs, and autonomous execution traces |

## Supported Environments

- Cursor
- Claude Code
- VS Code Copilot

The artifact layer is repository-local and portable across all three.

## Installation Details

`init` always creates a local `.agent-runway/` folder with the artifact layer.

Target-specific files:

| Environment | Files installed in Structured mode |
| ----------- | ---------------------------------- |
| Cursor | `.cursor/commands/`, `.cursor/skills/`, `.cursor/rules/`, `.cursor/agents/` |
| Claude Code | `.claude/commands/`, `.claude/agents/`, `CLAUDE.md`, `.agent-runway/skills/`, `.agent-runway/rules/`. Existing `CLAUDE.md` content is preserved; Agent Runway updates only its marked block. |
| VS Code | `.github/copilot-instructions.md`, `.github/instructions/`, `.github/prompts/`, `.github/agents/`, `.github/skills/` |

Lite installs a smaller subset: skills, selected rules, and the `.agent-runway/` artifact layer.

### Global Installation

```bash
npx @adonai-labs/agent-runway init --scope global --preset core-only
```

Applies commands and rules globally in Cursor. The `.agent-runway/` scaffold is still created per project so artifacts remain repository-scoped.

### Project Installation

```bash
npx @adonai-labs/agent-runway init --scope project --target claude --preset web-fullstack-ts
```

Recommended for teams. All files go into the repository and can be committed and shared.

## Stack Depth Policy

The core framework is stack-agnostic. No stack has its own slash command. Stacks install rules, code-review integration, and optional stack skills via `agent-runway add <stack>`.

| Stack | Stack skill | Primary scope | Rules | Review |
| ----- | ----------- | ------------- | ----- | ------ |
| .NET | `dotnet-core` | ASP.NET Core, EF Core, MediatR | Full | Full |
| TypeScript | `typescript-core` | Vitest, Zod, Pino | Full | Full |
| Node.js | `node-core` | Express / Fastify | Full | Full |
| React | `react-core` | React 18+ Vite SPA, React Query | Full | Full |
| Python | `python-core` | FastAPI, pytest, structlog | Full | Full |
| Go | `go-core` | net/http / chi, slog | Full | Full |
| Rust | `rust-core` | Axum, sqlx, tracing | Full | Full |

All stack skills enforce the same principles: simplicity first, SOLID and DRY as guides, Clean Architecture at the right scale, and no over-engineering.

## What It Is Not

Agent Runway is not a magic system that removes the need for engineering judgment.

It is not:

- an application framework
- an SDK abstraction layer
- a fully autonomous AI engineer
- a replacement for architecture or documentation practices

Governance enforcement is opt-in: use `agent-runway ci-check --profile strict` in CI when you want artifact validation. The default install does not require it.

## Roadmap

See [ROADMAP.md](ROADMAP.md) for what is shipped, next, and being explored.

## The Bottom Line

Most teams do not struggle because AI cannot write code.

They struggle because context disappears, decisions are forgotten, and every session starts from scratch.

Agent Runway keeps the knowledge in the repository, where it belongs, so agents and humans can keep building without losing ground.

Start small. Keep what works. Evolve as your team grows.
