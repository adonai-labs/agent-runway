# Agent Runway

[![npm version](https://img.shields.io/npm/v/%40adonai-labs%2Fagent-runway)](https://www.npmjs.com/package/@adonai-labs/agent-runway)
[![license](https://img.shields.io/github/license/adonai-labs/agent-runway)](LICENSE)
[![stars](https://img.shields.io/github/stars/adonai-labs/agent-runway?style=social)](https://github.com/adonai-labs/agent-runway)
[![downloads](https://img.shields.io/npm/dm/%40adonai-labs%2Fagent-runway)](https://www.npmjs.com/package/@adonai-labs/agent-runway)

Agent Runway is a structured, AI-assisted development framework installable via npm.

It acts as a **portable planning, execution, and control layer for coding agents**, with install targets for Cursor, Claude Code, and VS Code Copilot.

> Agent Runway turns AI coding agents from guessers into disciplined engineers.

---

## Why Agent Runway?

AI coding agents are powerful, but without structure they:

- drift from requirements
- repeat the same mistakes
- produce inconsistent code
- lose context between sessions

Agent Runway fixes this with:

- structured planning (spec-first or ticket-first)
- controlled execution workflows
- enforced quality gates
- persistent project memory

---

## Core Concept

Agent Runway is artifact-driven. It separates development into four layers:

```text
Spec -> define intent
Workflow -> orchestrate execution
Rules -> enforce standards
Memory -> learn over time
```

Artifacts are not passive documentation. Specs, epics, tickets, and memory files act as executable guides that shape agent behavior.

---

## Quick Start

```bash
npx @adonai-labs/agent-runway init
```

Or install first:

```bash
npm install -D @adonai-labs/agent-runway
npx agent-runway init
```

After initialization:

1. Populate `.agent-runway/docs/` with your domain and architecture context.
2. Open the project in your selected agent environment.
3. Run `/start` and describe your task.

---

## Development Entry Points

### Spec-first (`spec-creator`)

Capture intent, behavior, and design before implementation.

### Ticket-first (`ticket-creator`)

Start from backlog items, chat context, or production issues.

`ticket-creator` supports a Work Item Mode Gate:

- `epic` - create an epic and propose tickets
- `ticket` - create one delivery ticket
- `auto` - let the agent decide from complexity

Both paths converge to `lead`, with quality gates and validation.

---

## Artifact Model

Delivery knowledge stays in repository artifacts, not only in chat:

- `.agent-runway/specs/proposed/...` for specs and summaries
- `.agent-runway/docs/tickets/...` (or spec bundle folders) for delivery tickets
- `.agent-runway/memory/...` for repeated errors, decisions, and recurring patterns
- `.agent-runway/docs/...` for business, contract, architecture, and testing context

Commands and skills are the execution runtime on top of this artifact layer.

Note: docs are now repository-local under `.agent-runway/docs/` (not a top-level `docs/` workspace for runtime context).

---

## Autonomous Mode

Use `/autonomous-lead` when you want low-supervision execution with the same quality bar as `/lead`.

What it guarantees:

- same engineering rigor as `lead`
- mandatory run log for each autonomous execution
- ADR creation for architecture-impact decisions
- explicit human approval before destructive/irreversible actions

Run log path:

```text
.agent-runway/logs/autonomous-runs/<run-id>.md
```

Recommended template:

```text
.agent-runway/docs/examples/autonomous-run-log-template.md
```

---

## Global vs Project Installation

### Global

```bash
npx @adonai-labs/agent-runway init --scope global --preset core-only
```

Applies Cursor commands/rules/skills globally on your machine.
A local `.agent-runway/` scaffold (including `.agent-runway/docs/`) is still created in the current project so artifacts remain repository-scoped.

### Project (default)

```bash
npx @adonai-labs/agent-runway init --scope project --target vscode --preset web-fullstack-ts
```

Recommended for teams and portability.

---

## What Gets Installed

`.agent-runway/` is always created and is the local artifact layer (`memory`, `specs`, `config`, `workflows`, `docs`).

Target-specific files:

- **Cursor**: `.cursor/commands/`, `.cursor/skills/`, `.cursor/rules/`, `.cursor/agents/`
- **Claude Code**: `.claude/commands/`, `.claude/agents/`, `CLAUDE.md`, plus `.agent-runway/skills/` and `.agent-runway/rules/`
- **VS Code**: `.github/copilot-instructions.md`, `.github/instructions/`, `.github/prompts/`, `.github/agents/`, `.github/skills/`

---

## Commands

### Slash Commands

- `/start` - entry point (routes to the right workflow)
- `/spec` - deprecated wrapper; use `spec-creator` directly
- `/ticket` - deprecated wrapper; use `ticket-creator` directly
- `/lead` - full implementation workflow (quality gates)
- `/autonomous-lead` - autonomous implementation with mandatory decision logs and ADR gate
- `/fast-lead` - accelerated `lead` when you already have a plan
- `/express` - minimal-friction path for small, well-scoped changes
- `/dry-check` - reuse analysis before building
- `/self-review` - structured self-review checklist
- `/security-scan` - focused security search pass
- `/review` - structured code review
- `/architect` - design decisions and trade-offs
- `/validate` - deprecated wrapper; use `ticket-eval` directly
- `/po-eval` - deprecated wrapper; use `po-eval` directly
- `/refactor` - guided safe refactoring (no behavior change)
- `/dotnet` - .NET/C# guidance
- `/iac` - Infrastructure as Code guidance (Bicep/Terraform)

### CLI

```bash
agent-runway init
agent-runway add <stack>
agent-runway update
agent-runway list
agent-runway status
```

---

## How It Works

```text
Developer -> Request
        ->
Artifacts updated (spec/ticket/docs/memory)
        ->
Workflow (Skill/Command)
        ->
Rules + quality gates enforced
        ->
Agents execute
        ->
Artifacts and memory refine next iterations
```

---

## Operational Discipline

Artifact-driven workflows stay rigorous only if artifacts are maintained continuously.

If specs, tickets, decisions, and memory are not kept current, execution quality can degrade quickly and become chaotic.

For teams operating at scale, a documentation management workflow (clear ownership + review cadence) is strongly recommended to keep specs and decisions alive.

---

## Roadmap

- Dashboard (specs, workflows, quality)
- Advanced spec lifecycle
- Codex / OpenAI Agents support

---

## Final Thought

Agent Runway is a shift:

> from prompt-only workflows to artifact-driven, disciplined AI development
