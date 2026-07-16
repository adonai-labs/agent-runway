# Agent Runway - Usage Guide

Detailed examples and workflows for using Agent Runway.

---

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
? What type of project is this?
  🟨 Node.js + TypeScript
  🌐 Full-stack Web (TypeScript + React)
  ⚡ .NET Backend API
  🖥️ Electron Desktop App
  🦀 Rust Systems Programming
  🐍 Python Backend
  🐹 Go Backend
  🎯 Core Only (universal rules only)
  🔀 Polyglot Backend
  🔧 Custom Selection
  🚪 Exit

✓ Created .cursor/rules/ with 8 rules
✓ Created .cursor/skills/ with 10 skills
✓ Created .cursor/commands/ with 12 commands
✓ Created .agent-runway/docs/ structure

📋 Next steps:
1. Populate .agent-runway/docs/ with your project context
2. Open in Cursor and run: Ctrl+Shift+P → Developer: Reload Window
3. Run /start and describe what you want to do

Installed stacks: node, typescript
```


### Vibe/Lite Preset

Use Lite when you want fast, skill-first workflows without slash command aliases or full governance assets:

```bash
npx agent-runway init --preset vibe-lite --target all
```

Lite installs `@start`, `@express`, `@checkpoint`, `@safety-check`, and a small rule set for engineering principles, security, and testing.

Upgrade to Structured when the work needs specs, tickets, agents, slash commands, or governed delivery:

```bash
npx agent-runway upgrade --to structured
```
### Non-Interactive Setup

```bash
# Specify stacks directly
npx agent-runway init --stacks node,typescript,react

# Use recommended preset
npx agent-runway init --yes
```

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
| `cursor` | `.cursor/` runtime (commands, skills, rules, agents) |
| `claude` | `.claude/` commands and agents, `CLAUDE.md`, `.agent-runway/skills/` and `rules/` |
| `vscode` | `.github/copilot-instructions.md`, `.github/instructions/`, `prompts/`, `agents/`, `skills/` |

---

## Managing Stacks

### Add a Stack

```bash
# Add .NET support to existing project
npx agent-runway add dotnet

✓ Stack "dotnet" added successfully!
Reload Cursor window to activate the new rules.
```

### Remove a Stack

```bash
# Remove Rust stack
npx agent-runway remove rust

✓ Stack "rust" removed successfully!
Note: Manually remove stack-specific files if needed.
```

### List Stacks

```bash
npx agent-runway list

📦 Installed Stacks:

  ● TypeScript (typescript)
  ● Node.js (node)
  ● React (react)

📋 Available Stacks:

  ○ .NET / C# (dotnet)
  ○ Rust (rust)
  ○ Python (python)
  ○ Go (go)
  ○ Electron (electron)

Use `agent-runway add <stack>` to install a stack.
```

### Update Framework

```bash
# Update to latest version
npx agent-runway update

Updating Agent Runway...
✓ Updating core files...
✓ Updating stacks: node, typescript, react...
✓ Agent Runway updated successfully!
Reload Cursor window to apply updates.
```

### Delivery Metrics

```bash
npx agent-runway metrics
```

Aggregates the machine-readable verdict blocks (from `ticket-eval`, `po-eval`, `review`, `contrarian`) and autonomous run headers found under `.agent-runway/` into a scorecard: gate pass rates, blocking findings, acceptance criteria still `pending`, run gate pass rates, retries, time-to-green, and how often each memory entry was applied.

### CI governance (optional)

For teams that want **verifiable** governance — not just prose in skills — run artefact checks in CI:

```bash
# Advisory: warnings only, exit 0 (default)
npx agent-runway ci-check

# Strict: fail the pipeline when artefacts are missing or incomplete
npx agent-runway ci-check --profile strict

# Machine-readable output for CI dashboards
npx agent-runway ci-check --profile strict --json
```

**Strict profile checks:**

| Code | What it catches |
| ---- | ---------------- |
| `GOVERNANCE_GAP` | Specs exist but no verdict blocks anywhere — same blind spot as zero metrics |
| `SPEC_WITHOUT_VERDICT` | A spec folder has no gate verdict under `.agent-runway/specs/<slug>/` |
| `AC_PENDING` | Acceptance criteria still have `Verified by: pending` |
| `RUN_LOG_WITHOUT_HEADER` | Autonomous run logs missing `# agent-runway:run` header |

Example GitHub Actions step (opt-in):

```yaml
- name: Agent Runway governance
  run: npx agent-runway ci-check --profile strict
```

Most teams can skip this entirely; purists and regulated delivery paths should enable it explicitly.

---

## Using Commands

After initialization, you have access to slash commands in Cursor.

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

If a repeated failure pattern is detected during spec work, the system should ask
whether to register it in project memory. If approved, it logs a concise entry in:

`.agent-runway/memory/repeated-errors.md`

Use this to reduce recurring mistakes across future cycles.

### Human Summary from Specs

After `spec-creator` generates a spec, it should ask:

`Generate human summary?` (requires explicit confirmation)

If accepted, it creates:

`.agent-runway/specs/proposed/<implementation-slug>/<implementation-slug>-summary.md`

Use this summary for PM/stakeholder quick review while keeping `<implementation-slug>-spec.md` as the full implementation artefact (never a bare `spec.md` name).

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
Recommended: /lead (full workflow with quality gates)
Alternatives: /lead (Fast-Track Mode if you already have a plan), /express (if simple single-layer change)
```

### `/lead` - Full Implementation Workflow

10-phase implementation with quality gates:

```
/lead

Phase 0: Task Understanding
- Reading task description...
- Classifying complexity: Standard
- Loading relevant context from .agent-runway/docs/

Phase 1: DRY Check
- Searching for existing email notification patterns...
- Found: UserRegistration email sender
- Recommendation: Reuse EmailService pattern

[... continues through 10 phases ...]
```

### `/review` - Code Review

Systematic code review with security checks:

```
/review

Files changed: [src/services/OrderNotificationService.ts, src/jobs/EmailJob.ts]

Phase 1: Initial Assessment
- Files classified by layer and risk level

Phase 2: Systematic Review
- Running universal searches...
- Running TypeScript-specific searches...
- Running React-specific searches...
- Found 0 critical issues
- Found 2 medium issues

[... detailed findings report ...]
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


### `@safety-check` - Quick Risk Check

Runs a short Go / Go with caution / Stop check before continuing with fast work.

```text
@safety-check before publishing
@safety-check auth changes
```

Use it when a Lite workflow starts touching contracts, data, auth, secrets, deployment, or many files.
### Other Commands

- `/spec-creator` - Create or refine an implementation-ready spec
- `/ticket-creator` - Create a ready-to-dev ticket
- `/validate` - Evaluate a ticket for development readiness (ticket-eval)
- `/po-eval` - Evaluate a spec or ticket from a product perspective
- `/refactor` - Guided refactoring workflow
- `/express` - Fast implementation for simple changes
- `/lead` - Full workflow; state you have a plan to activate Fast-Track Mode
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

Edit matching files for automatic rule context, or invoke the stack skill directly when installed (`@skill-name` in Cursor, or reference the skill file in Claude Code).

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

Created automatically during init. Location depends on targets:
- Cursor or multi-target: `.cursor/agent-runway.json`
- Claude-only: `.agent-runway/agent-runway.json`

```json
{
  "version": "1.0.0",
  "stacks": ["typescript", "react"],
  "targets": ["cursor", "claude"],
  "installedAt": "2026-03-31T10:30:00.000Z",
  "updatedAt": "2026-03-31T11:00:00.000Z"
}
```

### .cursor/config/review-config.md

Customize which code review searches run:

```markdown
# Code Review Configuration

## Search Categories

Enable or disable systematic search categories:

- hardcoded-secrets: enabled
- sensitive-data-logs: enabled
- missing-authorization: enabled
- todo-comments: disabled (allow TODOs in our codebase)
- typescript-any-usage: enabled
- react-inline-functions: disabled (performance not critical for us)
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

### Example 1: Implementing a New Feature

```bash
# 1. Start with a description
/start I need to add user profile picture upload

# 2. Cursor suggests /lead for Standard complexity
/lead

# 3. Follow the 10-phase workflow
# - Phase 0: Understand requirements
# - Phase 1: Check for existing patterns (DRY)
# - Phase 2: Architecture review
# - Phase 3: Implementation planning
# - Phase 4: Implementation
# - ...
# - Phase 9: Code review
# - Phase 10: Final delivery

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
# Add your own .mdc files to .cursor/rules/
```

### 5. Customize Review Config

Disable searches that don't apply to your project:

```bash
# Edit .cursor/config/review-config.md
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

### Commands Not Available (Claude Code)

```bash
# 1. Check commands are installed
ls .claude/commands/

# 2. Check CLAUDE.md exists at project root
cat CLAUDE.md | head -5

# 3. Reinstall Claude target
npx agent-runway init --target claude --stacks typescript
```

### Instructions Not Loading (VS Code Copilot)

```bash
# 1. Check Copilot instructions file exists
cat .github/copilot-instructions.md | head -5

# 2. Check individual instruction files
ls .github/instructions/agent-runway/

# 3. Reinstall VS Code target
npx agent-runway init --target vscode --stacks typescript
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
# Clear and reinstall (Cursor)
rm -rf .cursor/
npx agent-runway init --stacks node,typescript,react

# Clear and reinstall (all targets)
rm -rf .cursor/ .claude/ .github/
npx agent-runway init --target all --stacks node,typescript,react
```

---

## Advanced Usage

### Creating Custom Rules

Add your own `.mdc` files to `.cursor/rules/`:

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

Add workflows to `.cursor/skills/`:

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
- [Contributing Guide](CONTRIBUTING.md) - How to contribute
- [Extending Guide](EXTENDING.md) - Adding new stacks
- [src/README.md](src/README.md) - Package internals



