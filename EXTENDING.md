# Extending Agent Runway

Guide for adding new stacks, customizing the framework, and contributing extensions.

---

## Table of Contents

1. [Adding a New Stack](#adding-a-new-stack)
2. [Extending the Delivery Narrative](#extending-the-delivery-narrative)
3. [Creating Custom Rules](#creating-custom-rules)
4. [Creating Custom Skills](#creating-custom-skills)
5. [Contributing Back](#contributing-back)

---

## Adding a New Stack

This section explains how to add support for a new programming language or framework.

### Overview

A "stack" in Agent Runway lives in `src/stacks/<stack>/` and consists of:

1. **Rules** (`.mdc` files) - Coding standards, attached by file globs
2. **Code Review Searches** (`code-review-searches.md`) - ripgrep commands for security and quality patterns
3. **Build Commands** (`code-review-commands.md`) - How to build, lint, and test the stack
4. **Stack Skill** (`skill-<stack>-core/`) - Implementation guidance, invoked as `@<stack>-core` (or `/<stack>-core` in Claude Code)
5. **Optional: Spec Templates** (`spec-templates/`) - Stack-specific spec scaffold

Sources are shared by every target (Cursor, Claude Code, VS Code), so they never contain a target's install path. Use the placeholders `{{skills}}`, `{{rules}}`, and `{{config}}`, which are resolved per target at install time, or relative links between skill files (e.g. `../code-review/SKILL.md`). The validator rejects paths such as `.cursor/skills/` or `.claude/skills/` in sources.

### Step-by-Step: Adding Python Support

> **Note**: Python ships as a built-in stack (`src/stacks/python/`). This walkthrough is kept as a worked template: follow the same steps for a new stack, and read the shipped stacks as reference implementations.

#### 1. Create Stack Directory

```bash
mkdir -p src/stacks/python
```

#### 2. Create Rules File

Create `src/stacks/python/python.mdc`:

```yaml
---
description: Python best practices — PEP 8, type hints, error handling, async patterns, testing
globs: "**/*.py,**/pyproject.toml"
alwaysApply: false
---

# Python Best Practices

## Code Style

- Follow PEP 8; enforce it with `ruff check` and `ruff format`
- Use 4 spaces for indentation (never tabs)
- Maximum line length: 88 characters (ruff format default)
- Use snake_case for functions and variables
- Use PascalCase for class names

## Type Hints

- Use type hints for function signatures
- Use `T | None` for values that can be None
- Use Protocol for structural subtyping

## Error Handling

- Use specific exception types, not bare `except:`
- Create custom exception classes for domain errors
- Use context managers (`with` statement) for resource management
- Log exceptions with context

## Testing

- Use pytest; name test files `test_*.py`
- Use fixtures for setup/teardown
- Mock external dependencies only at the boundary
```

Frontmatter conventions:

- `description` - one line; it is shown in `CLAUDE.md` and used as the Copilot instruction description.
- `globs` - double-quoted, comma-separated, every pattern starting with `**/`. No brace expansion: write `"**/*.ts,**/*.tsx"`, not `"**/*.{ts,tsx}"`.
- `alwaysApply` - `true` or `false`. Stack rules should be `false` so they attach only to matching files.

#### 3. Create Code Review Searches

Create `src/stacks/python/code-review-searches.md`. Every search is a valid `rg` command that can be pasted into a shell. Use ripgrep's built-in file types (`--type py`, `--type go`, `--type rust`, `--type cs`); `--type ts` already covers `.tsx` (there is no `tsx` type).

```markdown
# Python-Specific Code Review Searches

These searches complement the universal searches in `code-review/systematic-searches-base.md`.

---

## Category: Bare Except

\`\`\`bash
rg "except\s*:" --type py
\`\`\`

Critical. A bare `except:` catches everything including `SystemExit` and `KeyboardInterrupt`. Catch specific exception types.

---

## Category: Mutable Default Arguments

\`\`\`bash
rg "def \w+\([^)]*=\s*(\[\]|\{\})" --type py
\`\`\`

High. Mutable default arguments are shared across calls. Default to `None` and create the value inside the function.

---

## Category: Shell Injection Risk

\`\`\`bash
rg "subprocess\.(run|call|Popen)\(.*shell\s*=\s*True" --type py
\`\`\`

Critical. `shell=True` with interpolated input enables command injection. Pass an argument list.
```

The category titles are what teams reference in `.agent-runway/config/review-config.md` to disable a search (e.g. `python: Bare Except`).

#### 4. Create Build Commands

Create `src/stacks/python/code-review-commands.md`:

```markdown
# Python Build & Test Commands

## Test

\`\`\`bash
pytest
\`\`\`

## Type Checking

\`\`\`bash
mypy src
\`\`\`

## Linting

\`\`\`bash
ruff check .
\`\`\`

## Format Check

\`\`\`bash
ruff format --check .
\`\`\`

## Security Audit

\`\`\`bash
pip-audit
bandit -r src
\`\`\`
```

On install, both files are copied next to the `code-review` skill as `searches-python.md` and `commands-python.md`, and the skill's stack list is updated to link them.

#### 5. Create the Stack Skill

Create `src/stacks/python/skill-python-core/` with a `SKILL.md` and the six standard files every stack skill ships:

```
skill-python-core/
├── SKILL.md           # Entry point: frontmatter + when to read each file
├── architecture.md    # Project structure, layering
├── patterns.md        # Idiomatic implementation patterns
├── testing.md         # Test strategy and tooling
├── security.md        # Stack-specific security guidance
├── observability.md   # Logging, metrics, tracing
└── reference.md       # Commands, libraries, links
```

`SKILL.md` needs `name` and `description` frontmatter; `name` is the installed skill name (the folder name without `skill-`):

```markdown
---
name: python-core
description: Python implementation guidance — project structure, testing with pytest, security, and observability. Use when the user asks about Python-specific patterns. Invoke via @python-core after `agent-runway add python`.
---
```

Link the standard files with relative links (`[testing.md](testing.md)`), and other skills with `../<skill>/SKILL.md`. `lead` loads `../<stack>-core/security.md` and `../<stack>-core/observability.md` during self-review, so keep those file names.

Optionally add `spec-templates/spec-template.md`; it is installed into `.agent-runway/config/spec-templates/python/`.

#### 6. Register Stack in CLI

Update `src/cli/presets/index.ts` — add an entry to the `STACKS` array (and to a preset in `PRESETS` if it belongs in one):

```typescript
export const STACKS: Stack[] = [
  // ... existing stacks ...
  {
    id: 'python',
    name: 'Python',
    description: 'PEP 8, type hints, async patterns, pytest, packaging',
  },
];
```

`init` rejects stacks that are not registered here.

#### 7. Test Your Stack

```bash
npm test
```

`npm test` compiles TypeScript, runs the content validator (frontmatter, links, target-neutral paths, stack completeness), the smoke tests, the content tests, and the installed-links checker, which installs every target × mode × stack combination into a temp project and checks that every link and referenced path in the installed output resolves and that no `{{placeholder}}` survives.

To inspect a real install:

```bash
npm link
cd /path/to/test-project
npx agent-runway init --yes --target all --stacks python

ls .cursor/rules/python.mdc .cursor/skills/python-core/
ls .claude/skills/python-core/ .claude/skills/code-review/searches-python.md
ls .github/skills/python-core/ .github/instructions/agent-runway/
ls .agent-runway/rules/python.mdc
```

#### 8. Update Documentation

Add the stack to the "Stack Depth Policy" table in `README.md` and the "Stack guidance" table in `USAGE.md`.

---

## Extending the Delivery Narrative

Agent Runway supports both spec-first and ticket-first execution paths:

```text
spec-creator -> (optional) ticket-creator -> lead -> review
ticket-creator (from chat) -> lead -> review
```

`architect` acts as a design gate for high-complexity or high-impact changes.

`ticket-creator` includes a Work Item Mode Gate (`epic`, `ticket`, `auto`) to decide whether to create an epic breakdown first or produce a single delivery ticket.

### When to Extend Which Skill

- Extend `spec-creator` when you need richer business requirements, scenarios, or spec delta formats.
- Extend `spec-creator` when you want to evolve the human summary output (`summary.md`) or stakeholder-facing structure.
- Extend `ticket-creator` when backlog delivery shape changes (fields, Jira mapping, QA format, epic/ticket splitting behaviour, or markdown artefact naming under `.agent-runway/specs/<implementation-slug>/`, such as `epic.md` and `tickets/task-NN-<description>.md`).
- Extend `lead` when implementation phases or quality gates need adaptation.
- Extend `architect` when decision frameworks, trade-off criteria, or ADR patterns evolve.

### Compatibility Guidance

- Keep `ticket-creator` independent from `spec-creator` input (it must still accept direct chat starts).
- Keep outputs parseable for downstream skills (`lead`, `review`, `ticket-eval`).
- Prefer additive changes to templates to avoid breaking existing projects.

---

## Creating Custom Rules

You can add custom rules to your project without modifying the framework.

### Local Custom Rules

Create `.cursor/rules/company-standards.mdc` in your project:

```yaml
---
description: Company-specific coding standards
globs: "**/*.ts,**/*.tsx"
alwaysApply: false
---

# Company Coding Standards

## File Naming

- Use kebab-case for file names: `user-service.ts`
- Use PascalCase for component files: `UserProfile.tsx`

## Import Order

1. External dependencies (react, lodash)
2. Internal absolute imports (@/components)
3. Relative imports (./utils)

## Documentation

- All public APIs must have JSDoc comments
- Include @param, @returns, @throws tags
- Include code examples for complex functions
```

This rule will be picked up by Cursor automatically. `agent-runway update` replaces only the rules listed in `.cursor/rules/.agent-runway-managed.json`, so your own rules are preserved.

### Contributing Rules to Framework

If you create a rule that would benefit others:

1. Place it in `src/stacks/{stack}/` (or `src/core/rules/` for a universal rule)
2. Run `npm test`
3. Submit a PR (see [Contributing Back](#contributing-back))

---

## Creating Custom Skills

Skills are multi-phase workflows with quality gates.

### Structure of a Skill

```
skills/
└── my-skill/
    ├── SKILL.md           # Main workflow definition
    ├── reference.md       # Supporting reference material
    └── templates.md       # Output templates
```

### Where to Put Your Own Skills

Add a skill folder in the skills directory of your environment:

| Environment | Location | Invocation |
| ----------- | -------- | ---------- |
| Cursor | `.cursor/skills/<skill>/SKILL.md` | `@<skill>` |
| Claude Code | `.claude/skills/<skill>/SKILL.md` | `/<skill>` |
| VS Code Copilot | `.github/skills/<skill>/SKILL.md` | discovered by the agent |

`agent-runway update` replaces only the entries listed in each folder's `.agent-runway-managed.json`, so your skills (and your own commands and agents) are preserved. Avoid reusing the name of an Agent Runway skill.

### Example: Database Migration Skill

Create `.cursor/skills/db-migration/SKILL.md` (or `.claude/skills/db-migration/SKILL.md`):

```markdown
---
name: db-migration
description: Safe database migration workflow with rollback plan
---

# Database Migration

## Phase 1 — Review Current Schema

1. Examine current database schema
2. Identify affected tables and relationships
3. Check for dependent foreign keys

## Phase 2 — Design Migration

1. Draft migration script (up and down)
2. Ensure backward compatibility
3. Plan for zero-downtime deployment

## Phase 3 — Test Migration

1. Run migration on local database
2. Verify data integrity
3. Test rollback script

## Phase 4 — Generate Migration

1. Create migration file with timestamp
2. Add migration to version control
3. Update schema documentation

## Phase 5 — Deployment Plan

1. Document deployment steps
2. Identify rollback triggers
3. Schedule maintenance window if needed
```

Optionally add a Cursor command for it in `.cursor/commands/db-migrate.md` (Claude Code already exposes the skill as `/db-migration`):

```markdown
# Database Migration

Read and follow the skill at `.cursor/skills/db-migration/SKILL.md`.

Guides you through safe database schema changes with rollback planning.
```

---

## Best Practices for Extensions

### Rules

1. **Be specific**: "Use async/await for I/O operations" not "write good code"
2. **Provide examples**: Show good and bad patterns
3. **Keep under 500 lines**: Long rules are hard to parse for AI
4. **Use tables**: Easier to scan than paragraphs
5. **Include rationale**: Explain *why*, not just *what*

### Code Review Searches

1. **One pattern per category**: Don't combine unrelated patterns
2. **Include severity**: Critical, High, Medium, Low
3. **Provide context**: Explain why this pattern is problematic
4. **Test patterns**: Run each `rg` command against a sample project and verify it matches what you expect
5. **Balance false positives**: Too many matches = noise

### Skills

1. **Clear phases**: Each phase should have a specific goal
2. **Quality gates**: Add checkpoints before proceeding
3. **Reference external docs**: Link to architecture, standards
4. **Keep focused**: One skill per workflow
5. **Document prerequisites**: What needs to exist first

---

## Stack Extension Checklist

When adding a new stack, ensure you have:

- [ ] Created `src/stacks/{stack}/` directory
- [ ] Written `.mdc` rules (<500 lines each) with `description`, double-quoted `**/` globs (no brace expansion), and `alwaysApply`
- [ ] Created `code-review-searches.md` with valid `rg` commands
- [ ] Created `code-review-commands.md` with build/lint/test commands
- [ ] Created `skill-{stack}-core/` with `SKILL.md` (`name`, `description`) and the six standard files
- [ ] Used `{{skills}}`, `{{rules}}`, `{{config}}` or relative links, never a target's install path
- [ ] Added `spec-templates/spec-template.md` (optional)
- [ ] Registered stack in `src/cli/presets/index.ts` (add entry to the `STACKS` array)
- [ ] Ran `npm test` (validator, smoke, content tests, installed-links checker across every target × mode × stack)
- [ ] Added stack to `README.md` and `USAGE.md` stack tables
- [ ] Verified rules activate with correct glob patterns in a sample project
- [ ] Tested code review searches find expected patterns
- [ ] Build commands work in sample project

---

## Contributing Back

We welcome contributions! Here's how:

### 1. Fork & Branch

```bash
git clone https://github.com/yourusername/agent-runway
cd agent-runway
git checkout -b feature/add-python-stack
```

### 2. Make Changes

Follow the guides above to add your extension.

### 3. Test Locally

```bash
# Build, validate, and run all tests
npm test

# Link locally
npm link

# Test in a sample project
cd /path/to/test-project
npx agent-runway init --stacks python

# Verify it works
code .
```

### 4. Submit PR

```bash
git add src/stacks/python/
git commit -m "feat(stacks): add Python support

- Add Python rules (PEP 8, type hints, async patterns)
- Add code review searches for common anti-patterns
- Add pytest/mypy/ruff build commands
- Add python-core stack skill"

git push origin feature/add-python-stack
```

Then open a PR on GitHub.

### PR Guidelines

- **Clear description**: Explain what the extension does and why it's useful
- **Tests**: Include example of CLI usage
- **Documentation**: Update README, USAGE, and EXTENDING docs
- **Keep focused**: One stack/feature per PR
- **Follow existing patterns**: Match the structure of existing stacks

---

## Advanced: Stack Skill Depth

Every shipped stack has a `skill-<stack>-core/` folder (see step 5). Complex stacks can add more files: `.NET` ships `dotnet-core` with extra `api-design.md`, `application-patterns.md`, `infrastructure.md`, and `delivery-checks.md` alongside the standard ones.

```
src/stacks/python/
├── python.mdc
├── code-review-searches.md
├── code-review-commands.md
├── spec-templates/
│   └── spec-template.md
└── skill-python-core/
    ├── SKILL.md
    ├── architecture.md
    ├── patterns.md
    ├── testing.md
    ├── security.md
    ├── observability.md
    └── reference.md
```

The skill is installed as `python-core` in each target's skills folder (`.cursor/skills/`, `.claude/skills/`, `.github/skills/`). Stack skills have no slash command source of their own; rules attach by glob, and the skill is invoked directly.

Add extra files when the stack has deep architectural guidance or many best practices that do not fit in rules. Keep `SKILL.md` short and point to each file with a "read when" note.

---

## Questions?

- Open an issue on GitHub
- Check the [Usage Guide](USAGE.md) for examples
- See [src/README.md](src/README.md) for package internals
