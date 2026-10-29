# Agent Runway - Usage Guide

Detailed examples and workflows for using Agent Runway.

---

## Requirements

- Node.js 22.12 or newer (the CLI relies on `require()` of ES modules, unflagged since 22.12)

## Installation & Setup

### First Time Setup

```bash
# Navigate to your project
cd /path/to/your/project

# Initialize Agent Runway
npx agent-runway init
```

**Interactive prompts:**

```
? Where should Agent Runway be installed?  Project
? Which AI agent environment are you installing for?  Cursor
? What type of project is this?
  [LITE] Vibe/Lite
  [TS] Node.js + TypeScript
  [WEB] Full-stack Web (TypeScript + React)
  [NET] .NET Backend API
  [DESK] Electron Desktop App
  [RS] Rust Systems Programming
  [PY] Python Backend
  [GO] Go Backend
  [CORE] Core Only
  [POLY] Polyglot Backend
  [CUSTOM] Custom Selection
  [EXIT] Exit

✔ Agent Runway installed successfully!

📋 Installed for: cursor

Cursor: open the project and run Developer: Reload Window
Then run /start and describe what you want to do

Mode: structured
Installed stacks: node, typescript
```

Next, populate `.agent-runway/docs/` with your project context.


### Vibe/Lite Preset

Use Lite when you want fast, skill-first workflows without slash command aliases or full governance assets:

```bash
npx agent-runway init --preset vibe-lite --target all
```

Lite installs `@start`, `@express`, `@code-review`, `@checkpoint`, `@learning`, `@safety-check`, `@council` preview, and a small rule set for engineering principles, security, and testing. In Claude Code each of these is also a slash command (`/start`, `/express`, ...).

`start`, `express`, `council`, and `safety-check` detect a Lite install and route only to skills that are actually installed. When the work needs a Structured-only workflow (`lead`, `spec-creator`, `architect`, ...), they say so and suggest the upgrade below.

Upgrade to Structured when the work needs specs, tickets, agents, slash commands, lead/autonomous workflows, architecture/contrarian gates, full rules, or governed delivery:

```bash
npx agent-runway upgrade --to structured
```

Structured keeps the lightweight skill-only workflows too, including `@checkpoint`, `@learning`, `@safety-check`, and `@council` preview.

### Non-Interactive Setup

```bash
# Specify stacks directly
npx agent-runway init --stacks node,typescript,react

# Use recommended preset
npx agent-runway init --yes
```

`--yes` never prompts: it uses project scope, the `cursor` target (unless `--target` is given), the recommended preset (`node-typescript`) unless `--stacks` or `--preset` is given, and reinitializes an existing install. Unknown `--stacks` or `--target` values are rejected instead of being silently ignored.

### Multi-Target Setup

Install for multiple agent environments in one command:

```bash
# Cursor only (default)
npx agent-runway init --target cursor --preset node-typescript

# Claude Code only
npx agent-runway init --target claude --preset node-typescript

# VS Code Copilot only
npx agent-runway init --target vscode --preset web-fullstack-ts

# Cursor + Claude Code
npx agent-runway init --target both --preset web-fullstack-ts

# All three environments
npx agent-runway init --target all --preset web-fullstack-ts
```

Each target installs different files:

| Target | Files created |
|--------|--------------|
| `cursor` | `.cursor/commands/`, `.cursor/agents/`, `.cursor/skills/`, `.cursor/rules/` (global installs use `~/.cursor/`) |
| `claude` | `.claude/skills/` (native skills, each invocable as `/<skill>`), `.claude/commands/` (aliases only), `.claude/agents/`, `.agent-runway/rules/`, `CLAUDE.md`. Existing `CLAUDE.md` content is preserved; Agent Runway updates only its marked block. |
| `vscode` | `.github/skills/`, `.github/prompts/` (one per command), `.github/agents/`, `.github/instructions/agent-runway/`, `.github/copilot-instructions.md` (marked block), `.agent-runway/rules/` |

Every target shares the same project config file, `.agent-runway/agent-runway.json`, and the editable workflow config in `.agent-runway/config/`. Lite installs skills and rules only: no commands, prompts, or agents.

In Claude Code, `.claude/commands/` holds only the aliases whose name does not collide with a skill (`/review` -> `code-review`, `/validate` -> `ticket-eval`); everything else is invoked as `/<skill>`. The `contrarian` skill runs forked in the isolated `contrarian` subagent.

Project installs also create or update a root `AGENTS.md` with an Agent Runway marked block. Existing content outside that block is preserved, so teams can keep their own agent instructions alongside the generated Runway entrypoint.

### Generated Instruction Files

Agent Runway keeps long-lived project knowledge in `.agent-runway/` artifacts and uses generated instruction files only as entrypoints.

| File | Purpose | Update behavior |
| ---- | ------- | --------------- |
| `AGENTS.md` | Neutral instructions for coding agents that support the `AGENTS.md` convention | Agent Runway updates only the marked block |
| `CLAUDE.md` | Claude Code entrypoint and rule index | Agent Runway updates only the marked block |
| `.github/copilot-instructions.md` | VS Code Copilot project instructions | Agent Runway updates only the marked block |

Do not put all engineering standards directly into `AGENTS.md` or `CLAUDE.md`. Put durable project decisions in `.agent-runway/memory/`, ADRs/docs in `.agent-runway/docs/`, and generated framework rules in `.agent-runway/rules/`.

---

## Managing Stacks

### Add a Stack

```bash
# Add .NET support to existing project
npx agent-runway add dotnet

✔ Stack "dotnet" added successfully!
Reload your editor to activate the new rules and skills.
```

### Remove a Stack

```bash
# Remove Rust stack
npx agent-runway remove rust

✔ Stack "rust" removed successfully!
```

The stack's rules, skills, code-review extensions, and spec templates are removed on refresh. Files you added yourself are left alone.

### List Stacks

```bash
npx agent-runway list

Installed Targets:

  cursor, claude

Installed Stacks:

  - Node.js (node)
  - TypeScript (typescript)
  - React (react)

Available Stacks:

  - .NET / C# (dotnet)
  - Rust (rust)
  - Python (python)
  - Go (go)
  - Electron (electron)

Use `agent-runway add <stack>` to install a stack.
```

### Update Framework

```bash
# Refresh generated files with the currently running CLI version
npx agent-runway update

📁 Updating project installation

✔ Agent Runway updated successfully!
Updated: cursor + claude. Reload your editor to apply changes.
```

`agent-runway update` refreshes generated Agent Runway files inside the project. It does not upgrade the npm package by itself.

To move an existing project to the latest published Agent Runway release:

```bash
# If installed as a dev dependency
npm install -D @adonai-labs/agent-runway@latest
npx agent-runway update

# Or run the latest CLI directly
npx @adonai-labs/agent-runway@latest update
```

The command keeps the existing mode, targets, and stacks from `.agent-runway/agent-runway.json`. It preserves project memory, logs, docs, checkpoints, `.agent-runway/config/`, and existing `CLAUDE.md` / `AGENTS.md` / `.github/copilot-instructions.md` content outside the Agent Runway marked blocks.

Your own skills, rules, commands, and agents are preserved too: each folder Agent Runway writes to (skills, rules, commands, agents, prompts) keeps a `.agent-runway-managed.json` manifest, and an update replaces only the entries listed there. Projects installed before 1.7 are migrated automatically: the config moves from `.cursor/` to `.agent-runway/`, and Claude Code skills move from the old `.agent-runway/skills/` folder (now removed) to `.claude/skills/`.

### Delivery Metrics

```bash
npx agent-runway metrics
```

Aggregates the machine-readable `# agent-runway:verdict` blocks found under `.agent-runway/specs/` and `.agent-runway/logs/` (saved reviews and council outputs) plus autonomous run headers into a scorecard: gate pass rates, blocking findings, acceptance criteria still `pending`, run gate pass rates, retries, time-to-green, and how often each memory entry was applied. Pass rates are also shown as monthly trends.

| Gate | Counts as pass |
| ---- | -------------- |
| `ticket-eval`, `po-eval` | `yes` |
| `review` | `approve` |
| `contrarian`, `safety-check` | `go` |
| `council` | `pursue` |

Add `--json` for machine-readable output.

### PR Code Review Format

`@code-review` and `/review` are suitable for CI-assisted PR review. The default report is consolidated so GitHub Actions or Azure DevOps can publish it as one stable PR comment:

- verdict first: `APPROVE`, `REQUEST CHANGES`, or `NEEDS DISCUSSION`
- deduplicated severity counts
- source labels `CR` (code review), `SEC` (security), `SNR` (senior architecture/operational review), and optional `CTR` (contrarian)
- findings with file/line evidence, impact, why fix, a paste-ready English PR comment, and suggested solutions
- positives and a suggested merge gate

Use the optional `CTR` contrarian lens only for high-impact assumptions such as architecture boundaries, audit/compliance integrity, data consistency, least-privilege security, or public contracts. Keep ordinary PR reviews on the standard code-review lenses.

### Narrative Delivery

Use narrative delivery when work is large enough that future readers need more than the diff:

- **Context**: why the work exists now
- **Intent**: what outcome the change should create
- **Change**: what implementation step was taken
- **Evidence**: tests, checks, review, logs, screenshots, or metrics
- **Remaining work**: risks, deferred scope, or follow-ups

Tickets use this to explain the problem and evidence plan before implementation details. Commits use it by staying atomic: each commit should represent one coherent step in the implementation story. PRs use it as the full chapter:

```markdown
### Story
**Problem:** Why this work exists.
**Approach:** What path was chosen and why.
**What changed:** Main behavior, code, config, or docs changes.
**Validation:** Evidence collected.
**Risks / Follow-ups:** Known residual risk or deferred work.
```

Keep it brief. Narrative text should clarify intent and evidence; it does not replace acceptance criteria, tests, code review, or ADRs.

### Test-Driven Delivery

Use test-driven delivery for behavior changes:

1. Understand the problem, user impact, expected behavior, and boundaries.
2. Define the evidence plan before implementation.
3. Add or identify failing evidence when feasible.
4. Implement the smallest change that makes the evidence pass.
5. Refactor without changing behavior.
6. Record validation and remaining gaps.

Evidence can be a unit test, integration test, E2E test, contract check, security check, smoke test, reproducible bug signal, or documented manual validation. Prefer test-first for new behavior, bug fixes, validation rules, domain logic, API contracts, authorization changes, and regressions.

When strict test-first is not practical, record the reason and the alternative evidence. Do not skip problem understanding just because code generation is fast.

### CI governance preview (optional)

`agent-runway ci-check` is a preview, opt-in CI feature. Use it for GitHub Actions, Azure DevOps, or another pipeline when you want artifact checks on Agent Runway governance files.

Preview status means the command is usable, but its checks and JSON shape may still evolve before being treated as a stable CI contract.

For teams that want **verifiable** governance — not just prose in skills — run artefact checks in CI:

```bash
# Advisory: warnings only, exit 0 (default)
npx agent-runway ci-check

# Strict: fail the pipeline when artefacts are missing or incomplete
npx agent-runway ci-check --profile strict

# Machine-readable output for CI dashboards
npx agent-runway ci-check --profile strict --json

# Markdown report, e.g. to post as a PR comment
npx agent-runway ci-check --format markdown
```

When `$GITHUB_STEP_SUMMARY` is set (GitHub Actions), the markdown report is also written to the workflow run summary.

**Strict profile checks:**

| Code | What it catches |
| ---- | ---------------- |
| `GOVERNANCE_GAP` | Specs exist but no verdict blocks anywhere — same blind spot as zero metrics |
| `SPEC_WITHOUT_VERDICT` | A spec folder has no gate verdict under `.agent-runway/specs/<slug>/` |
| `AC_PENDING` | Acceptance criteria still have `Verified by: pending` |
| `RUN_LOG_WITHOUT_HEADER` | Autonomous run logs missing `# agent-runway:run` header |

In GitHub Actions, use the bundled action (opt-in). Inputs: `profile` (`light` or `strict`, default `light`), `version` (npm version or dist-tag, default `latest`), and `working-directory` (folder containing `.agent-runway/`, default `.`):

```yaml
- uses: actions/checkout@v4
- uses: adonai-labs/agent-runway@v1.7.0
  with:
    profile: strict
```

Most teams can skip this entirely. Start with advisory mode, inspect the output for a few PRs, then move to `--profile strict` only when the team accepts the gate.

---

## Using Commands

After a Structured initialization, slash commands are available in every target: Cursor commands, Claude Code skills (plus the `/review` and `/validate` aliases), and VS Code prompt files.

### Recommended Delivery Paths

Use one of these two starts:

1. **Spec-first**
   - Create/refine a spec with `spec-creator`
   - Optionally derive a ticket with `ticket-creator`
   - Implement with `/lead`

2. **Ticket-first**
   - Create/refine directly with `ticket-creator` from chat context
   - Implement with `/lead`

`ticket-creator` starts with a work-item gate:
- `epic`: create an epic and ticket proposal first (use `epic + N tickets` wording, not "child tickets")
- `ticket`: create one delivery ticket
- `auto`: let the agent decide based on complexity

If `ticket` (or `auto`) exceeds complexity thresholds, the skill should propose a split before final approval.

Use `/architect` before implementation when the change has meaningful design trade-offs (public contracts, schema migrations, cross-module impact, or non-obvious alternatives).

### Why This Works (Skill Narrative)

- `spec-creator` captures intent and business behavior changes before coding.
- `ticket-creator` transforms work into executable delivery units (or starts directly from chat).
- `lead` executes with disciplined phased quality gates.
- `architect` is invoked when the design surface is risky or ambiguous.

This keeps fast paths available without losing rigor on complex changes.

### Repeated Error Registration

If a repeated failure pattern is detected during spec work, `spec-creator` asks
whether to register it in project memory. If approved, it logs a concise entry in:

`.agent-runway/memory/common-failures.md`

Other memory files (`project-decisions`, `execution-memory`, `reasoning-memory`, `recurring-patterns`, `review-findings`, `testing-notes`, `ticket-quality-notes`) follow the same policy: skills write only with your approval, except a few that may auto-record a lesson seen at least twice.

Use this to reduce recurring mistakes across future cycles.

### Human Summary from Specs

After `spec-creator` generates a spec, it should ask:

`Generate human summary?` (requires explicit confirmation)

If accepted, it creates `summary.md` next to the spec:

```text
.agent-runway/specs/<implementation-slug>/
|-- spec.md        # full implementation artefact
|-- epic.md        # when ticket-creator proposes an epic
|-- summary.md     # human summary
`-- tickets/
    `-- task-01-<description>.md
```

Use this summary for PM/stakeholder quick review while keeping `spec.md` as the full implementation artefact. The slug folder carries the identity; a spec is never written outside one.

### `/start` - Entry Point

Classifies your intent and routes to the appropriate skill.

```
/start I need to add email notifications when an order is placed
```

Cursor analyzes your request and suggests:

```
What I found:

Intent: Implementation — Standard
Classification: Standard

Why: This adds a new feature that touches Application and Infrastructure layers,
which makes it a Standard implementation task.

Context for this work:
- Layer(s) in scope: Application, Infrastructure, External Service
- Recommended pattern: Async background job queue for email sending

Task classification: Standard
Recommended: invoke the `lead` skill (`/lead`) — full workflow with quality gates
Alternatives: /lead in Fast-Track Mode if you already have a plan, /express if it is a simple single-layer change
```

In a Lite install, `/start` recommends only the installed Lite skills.

### `/lead` - Full Implementation Workflow

Input validation plus Phases 0–10, with approval gates on Phases 0–2:

```
/lead

Pre-Phase 0: Input Validation
- Ticket provided -> ticket-eval verdict, or inline description checked for what/where/why

Phase 0: Exploration & Alternatives [GATE]
- Searching for existing email notification patterns...
- 2-3 approaches with trade-offs; recommendation: reuse EmailService pattern

[... Phase 1 Requirement Analysis [GATE], Phase 2 Implementation Plan [GATE],
     Phase 3 DRY Analysis, Phase 4 Implementation, Phase 5 Testing, Phase 6 Self-Review,
     Phase 7 Summary, Phase 8 Automated Verification, Phase 9 Delegate to Code Review,
     Phase 10 Commit, optional 10.5 System Feedback ...]
```

### `/review` - Code Review

Systematic code review with security checks:

```
/review

Files changed: [src/services/OrderNotificationService.ts, src/jobs/EmailJob.ts]

Phase 0: Preparation
Phase 1: Initial Assessment
- Files classified by layer and risk level

Phase 2: Systematic Review
- Running universal searches...
- Running TypeScript-specific searches...
- Running React-specific searches...
- Found 0 critical issues
- Found 2 medium issues

[... Phase 3 Detailed Review, Phase 4 Issue Classification,
     Phase 5 Generate Report, Phase 6 Verification Contract ...]
```

### `/architect` - Architecture Decisions

Evaluate design decisions with trade-off analysis:

```
/architect

Decision: Should we use event-driven architecture for order notifications?

[AI analyzes trade-offs, provides recommendations with pros/cons]
```

### `@checkpoint` - Save Current State

Creates a compact snapshot of the current work state for pause, handoff, or resume.

```text
@checkpoint before refactor
@checkpoint handoff
```

When filesystem writes are available, the checkpoint is saved under:

`.agent-runway/logs/checkpoints/`


### `@learning` - Save Project Learning

Captures durable lessons in `.agent-runway/memory/` so future agent sessions can reuse them.

```text
@learning we do not use generic repositories in this service
@learning auth changes need a permission matrix check before release
```


### `@safety-check` - Quick Risk Check

Runs a short Go / Go with caution / Stop check before continuing with fast work.

```text
@safety-check before publishing
@safety-check auth changes
```

Use it when a Lite workflow starts touching contracts, data, auth, secrets, deployment, or many files.

### `@council` - Preview Council Review

Validates an idea, hypothesis, or implementation direction from product, engineering, architecture, risk/security, adoption, and contrarian perspectives before turning it into a spec, ticket, ADR, or code change.

```text
@council should we add workspace memory to the Lite preset?
@council hypothesis: users want checkpoints more than full specs
@council validate this implementation approach before I code it
```

By default it does not write files. If you ask it to save the review, it writes under `.agent-runway/logs/council/`.

### Other Commands

- `/spec-creator` - Create or refine an implementation-ready spec
- `/ticket-creator` - Create a ready-to-dev ticket
- `/validate` - Evaluate a ticket for development readiness (ticket-eval)
- `/po-eval` - Evaluate a spec or ticket from a product perspective
- `/refactor` - Guided refactoring workflow
- `/express` - Fast implementation for simple changes
- `/lead` - Full workflow; state you have a plan to activate Fast-Track Mode
- `/autonomous-lead` - Governed autonomous run with mandatory run logs and ADR gates
- `/contrarian` - Adversarial review of a chosen approach
- `/iac` - Infrastructure as Code workflows

### Stack guidance (no slash commands)

Stacks do not have their own commands. After `agent-runway add <stack>`:

| Stack | Rules attach on | Stack skill |
| ----- | --------------- | ----------- |
| dotnet | `*.cs`, `*.csproj` | `@dotnet-core` |
| typescript | `*.ts`, `*.tsx` | `@typescript-core` |
| node | `*.js`, `package.json` | `@node-core` |
| react | `*.tsx`, `*.jsx` | `@react-core` |
| python | `*.py`, `pyproject.toml` | `@python-core` |
| go | `*.go`, `go.mod` | `@go-core` |
| rust | `*.rs`, `Cargo.toml` | `@rust-core` |
| electron | `src/main/`, `src/preload/`, `src/renderer/`, Electron config files | `@electron-core` |

Edit matching files for automatic rule context, or invoke the stack skill directly when installed (`@skill-name` in Cursor, `/<skill-name>` such as `/dotnet-core` in Claude Code).

---

## Project Documentation

Agent Runway uses your project documentation to provide context-aware suggestions.

### Recommended Structure

```
.agent-runway/docs/
├── business/
│   ├── entities.md          # Domain entities, relationships, lifecycles
│   └── flows.md             # User journeys, business processes
├── architecture/
│   ├── architecture.md      # High-level system architecture
│   ├── decisions.md         # ADRs (Architecture Decision Records)
│   └── modules.md           # Module boundaries, responsibilities
├── testing/
│   ├── strategy.md          # Testing approach and standards
│   ├── critical-scenarios.md  # Critical test cases
│   └── integration-test-map.md  # Integration test coverage
└── examples/
    ├── good-tickets.md      # Example tickets for reference
    ├── good-prs.md          # Example PRs
    └── implementation-notes.md  # Implementation patterns
```

### Example: entities.md

```markdown
# Domain Entities

## Order

**Lifecycle**: Draft → Confirmed → Shipped → Delivered

**Properties**:
- id: UUID
- customer_id: UUID (FK to User)
- status: OrderStatus enum
- items: OrderItem[]
- created_at: timestamp
- updated_at: timestamp

**Business Rules**:
- Cannot ship order with status "draft"
- Status transitions are one-way (no going back from shipped to confirmed)
- Orders older than 30 days are automatically archived
```

This context helps Agent Runway:
- Generate accurate tickets with correct entity names
- Suggest implementation patterns that align with existing architecture
- Validate that changes don't violate business rules

---

## Configuration

### agent-runway.json

Created automatically during init at `.agent-runway/agent-runway.json` for every target (global Cursor installs keep it in `~/.cursor/`). A legacy `.cursor/agent-runway.json` from before 1.7 is migrated automatically.

```json
{
  "version": "1.7.0",
  "stacks": ["typescript", "react"],
  "targets": ["cursor", "claude"],
  "installedAt": "2026-03-31T10:30:00.000Z",
  "isGlobal": false,
  "mode": "structured",
  "updatedAt": "2026-03-31T11:00:00.000Z"
}
```

### .agent-runway/config/

Editable workflow configuration. Templates are copied once and never overwritten by `update`:

| File | Used by |
| ---- | ------- |
| `review-config.md` | `code-review`: which systematic search categories run |
| `ticket-creator.config.md` | `ticket-creator`: Jira project, personas, docs, output destination |
| `spec-creator.config.md` | `spec-creator`: output destination and project docs used for context |
| `developer-profiles.md` | `lead`: active developer profile (Guided, Standard, Autonomous) |
| `spec-templates/<stack>/` | `spec-creator`: stack-specific spec templates |

Example `review-config.md` excerpt:

```markdown
| ID | Category | Status | Reason (if disabled) |
|----|----------|--------|----------------------|
| U1 | Hardcoded Secrets | enabled | |
| U7 | TODO / FIXME / HACK Comments | disabled | TODOs are tracked in our backlog |

| Stack: Category | Status | Reason (if disabled) |
|-----------------|--------|----------------------|
| dotnet: Blocking Async Calls | enabled | |
```

---

## Workflow Examples

### Example 0: Multi-tenant End-to-End (Spec -> Ticket -> Lead)

```bash
# 1) Create the spec
spec-creator Implement tenant isolation with tenant_id across API and data access

# 2) Derive a delivery ticket
ticket-creator

# 3) Execute with quality gates
/lead
```

Expected outcome:
- Spec with explicit boundaries and acceptance criteria
- Delivery ticket with implementation-ready scope
- Layered implementation validated by DRY/SOLID/security/test checks
- Artifacts under `.agent-runway/specs/<slug>/` (`spec.md`, `tickets/task-NN-<description>.md`)

### Example 1: Implementing a New Feature

```bash
# 1. Start with a description
/start I need to add user profile picture upload

# 2. Cursor suggests /lead for Standard complexity
/lead

# 3. Follow the gated workflow
# - Pre-Phase 0: Input validation
# - Phase 0: Exploration & alternatives (gate)
# - Phase 1: Requirement analysis (gate)
# - Phase 2: Implementation plan (gate)
# - Phase 3: DRY analysis
# - Phase 4-6: Implementation, testing, self-review
# - Phase 7-8: Summary, automated verification
# - Phase 9: Delegate to code review
# - Phase 10: Commit

# 4. Review runs automatically
# Systematic searches, security checks, SOLID review

# 5. Commit when ready
git add .
git commit -m "feat: add user profile picture upload

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

### Example 2: Reviewing a PR

```bash
# 1. Checkout PR branch
git checkout feature/email-notifications

# 2. Run review
/review

# 3. Address findings
# - Fix critical security issues
# - Refactor high-priority issues
# - Document medium-priority issues for follow-up

# 4. Re-run review
/review

# 5. Approve when clean
# Verdict: APPROVE - no blockers, all findings addressed
```

### Example 3: Architecture Decision

```bash
# Before implementing, validate architecture

/architect

Question: Should we use GraphQL or REST for our new API?

# Cursor analyzes:
# - Current architecture patterns
# - Team expertise
# - Requirements
# - Trade-offs

# Provides recommendation with reasoning
```

---

## Tips & Best Practices

### 1. Keep Documentation Updated

The more context in `.agent-runway/docs/`, the better the AI suggestions:

```bash
# Good: Entity definitions with business rules
# Good: Clear architecture diagrams
# Good: Examples of good tickets and PRs
# Bad: Stale documentation
# Bad: No documentation
```

### 2. Use /start for New Tasks

Always start with `/start` when unsure which command to use. It classifies intent and routes appropriately.

### 3. Review Before Committing

Run `/review` before creating PRs to catch issues early:

```bash
# After implementation
/review

# Address findings
# ...

# Create PR with confidence
gh pr create
```

### 4. Update Stacks as Needed

If you add a new technology to your project:

```bash
# Adding GraphQL
npx agent-runway add typescript  # if not already installed

# Custom rules
# Add your own .mdc files to .cursor/rules/ (updates leave them alone)
```

### 5. Customize Review Config

Disable searches that don't apply to your project:

```bash
# Edit .agent-runway/config/review-config.md
# Disable specific categories that create noise
```

---

## Troubleshooting

### Rules Not Activating (Cursor)

```bash
# 1. Check rules are copied
ls .cursor/rules/

# 2. Reload Cursor window
# Cmd+Shift+P → Developer: Reload Window

# 3. Check glob patterns in .mdc files match your file structure
```

### Testing Claude Code Locally

```bash
# From the package checkout
npm run build
npm pack --dry-run

# In a separate test project
npm install -D /absolute/path/to/adonai-labs-agent-runway-<version>.tgz
npx agent-runway init --yes --target claude --preset node-typescript
```

Then open the test project in Claude Code and verify:

```bash
ls .claude/skills/
ls .claude/commands/
cat CLAUDE.md | head -20
cat AGENTS.md | head -20
```

Expected behavior:

- Skills are installed natively under `.claude/skills/<skill>/SKILL.md` and each is invocable as `/<skill>`.
- Structured installs only the `review` and `validate` aliases under `.claude/commands/`, and agents under `.claude/agents/`.
- `CLAUDE.md` contains an Agent Runway block marked with `<!-- agent-runway:claude:start -->` and `<!-- agent-runway:claude:end -->`.
- If the project already had a `CLAUDE.md`, existing content stays outside that block.
- `AGENTS.md` contains an Agent Runway block marked with `<!-- agent-runway:agents:start -->` and `<!-- agent-runway:agents:end -->`.
- If the project already had an `AGENTS.md`, existing content stays outside that block.

### Commands Not Available (Claude Code)

```bash
# 1. Check skills (and aliases) are installed
ls .claude/skills/ .claude/commands/

# 2. Check CLAUDE.md exists at project root
cat CLAUDE.md | head -5

# 3. Check AGENTS.md exists at project root
cat AGENTS.md | head -5

# 4. Refresh the installation
npx agent-runway update
```

### Instructions Not Loading (VS Code Copilot)

```bash
# 1. Check Copilot instructions file exists
cat .github/copilot-instructions.md | head -5

# 2. Check individual instruction files
ls .github/instructions/agent-runway/

# 3. Refresh the installation
npx agent-runway update
```

### Wrong Stack Installed

```bash
# Remove unwanted stack
npx agent-runway remove dotnet

# Add correct stack
npx agent-runway add typescript
```

### Update Not Working

```bash
# Make sure the CLI itself is current, then refresh
npm install -D @adonai-labs/agent-runway@latest
npx agent-runway update

# Reinstall with explicit options (keeps memory, logs, docs, config and your own files)
npx agent-runway init --yes --target all --stacks node,typescript,react
```

Avoid deleting `.cursor/`, `.claude/`, or `.github/` wholesale: they may hold your own skills, rules, agents, and workflows.

---

## Advanced Usage

### Creating Custom Rules

Add your own `.mdc` files to `.cursor/rules/` (updates replace only the rules listed in `.agent-runway-managed.json`):

```yaml
---
description: Custom company coding standards
globs: "**/*.ts"
alwaysApply: false
---

# Company Coding Standards

- Use kebab-case for file names
- Prefix interfaces with I
- ...
```

### Creating Custom Skills

Add a folder with a `SKILL.md` to `.claude/skills/`, `.cursor/skills/`, or `.github/skills/` (for example `.claude/skills/deploy/SKILL.md`, invocable as `/deploy` in Claude Code). Updates leave your skills alone:

```markdown
---
name: deploy
description: Deployment workflow with safety checks
---

# Deploy Skill

## Phase 1: Pre-deployment checks
- Run tests
- Check environment variables
- ...
```

---

## See Also

- [Main README](README.md) - Quick start and overview
- [Extending Guide](EXTENDING.md) - Adding new stacks
- [src/README.md](src/README.md) - Package internals
