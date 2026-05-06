# Agent Runway

[![npm version](https://img.shields.io/npm/v/%40adonai-labs%2Fagent-runway)](https://www.npmjs.com/package/@adonai-labs/agent-runway)
[![license](https://img.shields.io/github/license/adonai-labs/agent-runway)](LICENSE)
[![stars](https://img.shields.io/github/stars/adonai-labs/agent-runway?style=social)](https://github.com/adonai-labs/agent-runway)
[![downloads](https://img.shields.io/npm/dm/%40adonai-labs%2Fagent-runway)](https://www.npmjs.com/package/@adonai-labs/agent-runway)

Agent Runway is a practical engineering layer for teams building with coding agents.

Think of it as a portable discipline system for planning, execution, and governance, with install targets for Cursor, Claude Code, and VS Code Copilot.

> AI tools made code generation easy. Agent Runway makes delivery more reliable.

---

## Why teams use Agent Runway

Coding agents are fast, but they can still drift if the process is loose. Common failure modes:

- drift from requirements
- repeat the same mistakes
- produce inconsistent code
- lose context between sessions

Agent Runway helps by adding:

- structured planning (spec-first or ticket-first)
- controlled execution workflows
- quality gates
- persistent project memory

---

## Core idea

Agent Runway is artifact-driven. It separates work into four layers:

```text
Spec -> define intent
Workflow -> orchestrate execution
Rules -> enforce standards
Memory -> learn over time
```

Artifacts are active engineering context, not passive docs. Specs, epics, tickets, and memory files shape how agents execute.

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

## What gets installed (quick view)

In every project, Agent Runway creates a local `.agent-runway/` folder with the core artifact layer:

- `specs`
- `docs`
- `memory`
- `workflows`
- `config`

Then it installs target-specific commands/skills for your environment (Cursor, Claude Code, or VS Code).

---

## How work usually starts

### Spec-first (`spec-creator`)

Capture intent, behavior, and design before implementation.

### Ticket-first (`ticket-creator`)

Start from backlog items, chat context, or production issues.

`ticket-creator` supports a Work Item Mode Gate:

- `epic` - create an epic and propose tickets
- `ticket` - create one delivery ticket
- `auto` - let the agent decide from complexity

Both paths converge to `lead`, with quality gates and validation.

If you want a concrete flow, check:

```text
src/core/docs/examples/example-issue-to-spec-to-tickets.md
```

---

## Artifact model

Delivery knowledge stays in repository artifacts, not only in chat:

- `.agent-runway/specs/proposed/...` for specs and summaries
- `.agent-runway/docs/tickets/...` (or spec bundle folders) for delivery tickets
- `.agent-runway/memory/...` for repeated errors, decisions, and recurring patterns
- `.agent-runway/docs/...` for business, contract, architecture, and testing context

Commands and skills are the execution runtime on top of this layer.

For high-impact work, apply explicit decision governance (execution vs critical reasoning planes):

- `src/core/docs/architecture/decision-governance.md`

Note: docs are now repository-local under `.agent-runway/docs/` (not a top-level `docs/` workspace for runtime context).

---

## Autonomous mode

Use `/autonomous-lead` when you want the agent to keep moving while you're away, with the same quality bar as `/lead`.

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

Issue-to-spec-to-tickets flow example:

```text
src/core/docs/examples/example-issue-to-spec-to-tickets.md
```

---

## Global vs project installation

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

Recommended for team use and portability.

---

## Installation details

`.agent-runway/` is always created and acts as the local artifact layer (`memory`, `specs`, `config`, `workflows`, `docs`).

Target-specific files:

- **Cursor**: `.cursor/commands/`, `.cursor/skills/`, `.cursor/rules/`, `.cursor/agents/`
- **Claude Code**: `.claude/commands/`, `.claude/agents/`, `CLAUDE.md`, plus `.agent-runway/skills/` and `.agent-runway/rules/`
- **VS Code**: `.github/copilot-instructions.md`, `.github/instructions/`, `.github/prompts/`, `.github/agents/`, `.github/skills/`

---

## Commands by intent

### Planning and definition

- `/start` - entry point (routes to the right workflow)
- `/spec` - deprecated wrapper; use `spec-creator` directly
- `/ticket` - deprecated wrapper; use `ticket-creator` directly
- `/architect` - design decisions and trade-offs
- `/validate` - deprecated wrapper; use `ticket-eval` directly
- `/po-eval` - deprecated wrapper; use `po-eval` directly

### Execution

- `/lead` - full implementation workflow (quality gates)
- `/autonomous-lead` - autonomous implementation with mandatory decision logs and ADR gate
- `/fast-lead` - accelerated `lead` when you already have a plan
- `/express` - minimal-friction path for small, well-scoped changes
- `/refactor` - guided safe refactoring (no behavior change)
- `/iac` - Infrastructure as Code guidance (Bicep/Terraform)
- `/dotnet` - .NET/C# guidance

### Review and quality

- `/dry-check` - reuse analysis before building
- `/self-review` - structured self-review checklist
- `/security-scan` - focused security search pass
- `/review` - structured code review

### CLI

```bash
agent-runway init
agent-runway add <stack>
agent-runway update
agent-runway list
agent-runway status
```

---

## How it works

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

## Operational discipline

Artifact-driven workflows stay rigorous only if artifacts are maintained continuously.

If specs, tickets, decisions, and memory are not kept current, execution quality can degrade quickly and become chaotic.

For teams operating at scale, it's worth setting clear ownership and review cadence so specs and decisions stay current.

---

## Who this is for

Agent Runway is usually most valuable when:

- your codebase is long-lived
- onboarding happens often
- architecture consistency matters
- you want safer autonomous execution

For very small or short-lived projects, you can still use it, but you'll likely prefer the lighter paths (`/express`, `/fast-lead`) most of the time.

---

## Roadmap

- Dashboard (specs, workflows, quality)
- Advanced spec lifecycle
- Codex / OpenAI Agents support

---

## Final thought

Agent Runway is a shift:

> from prompt-only workflows to artifact-driven, disciplined AI development
