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

A "stack" in Agent Runway consists of:

1. **Rules** (`.mdc` files) - Coding standards, best practices
2. **Code Review Searches** - Security and quality patterns to detect
3. **Build Commands** - How to build and test the stack
4. **Optional: Skills** - Complete workflow modules (like `dotnet-core`)

### Step-by-Step: Adding Python Support

> **Note**: Python and Go now ship as built-in stacks (`src/stacks/python/`, `src/stacks/go/`). This walkthrough is kept as a worked template — follow the same steps for a new stack, and read the shipped Python/Go stacks as reference implementations.

#### 1. Create Stack Directory

```bash
mkdir -p src/stacks/python
```

#### 2. Create Rules File

Create `src/stacks/python/python.mdc`:

```yaml
---
description: Python best practices — PEP 8, type hints, error handling, async patterns, testing
globs: "**/*.py"
alwaysApply: false
---

# Python Best Practices

## Code Style

- Follow PEP 8 style guide
- Use 4 spaces for indentation (never tabs)
- Maximum line length: 88 characters (Black formatter default)
- Use snake_case for functions and variables
- Use PascalCase for class names

## Type Hints

- Use type hints for function signatures
- Use `from __future__ import annotations` for forward references
- Use `Optional[T]` for values that can be None
- Use Protocol for structural subtyping

## Error Handling

- Use specific exception types, not bare `except:`
- Create custom exception classes for domain errors
- Use context managers (`with` statement) for resource management
- Log exceptions with context

## Async Patterns

- Use `async`/`await` for I/O-bound operations
- Never use blocking operations in async functions
- Use `asyncio.gather()` for concurrent operations
- Prefer `asyncio.create_task()` over `ensure_future()`

## Testing

- Use pytest for testing
- Name test files `test_*.py` or `*_test.py`
- Use fixtures for setup/teardown
- Mock external dependencies
- Aim for >80% code coverage

## Common Anti-patterns

| Anti-pattern | Do instead |
|--------------|------------|
| Bare `except:` | Use specific exception types |
| Mutable default arguments | Use `None` and create inside function |
| Using `global` | Pass as parameters or use class attributes |
| Import * | Import specific names |
| Concatenating strings in loop | Use `''.join()` or list comprehension |
```

#### 3. Create Code Review Searches

Create `src/stacks/python/code-review-searches.md`:

```markdown
# Python-Specific Code Review Searches

## Category: Bare Except

\`\`\`bash
rg "except:" --type py
\`\`\`

Critical. Bare except catches all exceptions including SystemExit and KeyboardInterrupt. Use specific exception types.

## Category: Mutable Default Arguments

\`\`\`bash
rg "def.*=\s*\[|def.*=\s*\{" --type py
\`\`\`

High. Mutable default arguments are shared across function calls. Use None and create inside function.

## Category: Print Statements

\`\`\`bash
rg "print\(" --type py
\`\`\`

Medium. Use logging instead of print for production code.

## Category: Type Hint Missing

\`\`\`bash
rg "def \w+\([^:]+\):" --type py
\`\`\`

Medium. Public functions should have type hints for parameters and return values.

## Category: SQL Injection Risk

\`\`\`bash
rg "execute\(.*%|execute\(.*\+|execute\(.*f\"" --type py
\`\`\`

Critical. String formatting in SQL queries enables SQL injection. Use parameterized queries.
```

#### 4. Create Build Commands

Create `src/stacks/python/code-review-commands.md`:

```markdown
# Python Build & Test Commands

## Run Tests

\`\`\`bash
pytest
# or with coverage
pytest --cov=src --cov-report=html
\`\`\`

## Type Checking

\`\`\`bash
mypy src/
\`\`\`

## Linting

\`\`\`bash
# Pylint
pylint src/

# Flake8
flake8 src/

# Ruff (fast)
ruff check src/
\`\`\`

## Formatting

\`\`\`bash
# Black
black --check src/

# isort (import sorting)
isort --check-only src/
\`\`\`

## Security Audit

\`\`\`bash
# Safety (dependency vulnerabilities)
safety check

# Bandit (security issues)
bandit -r src/
\`\`\`
```

#### 5. Register Stack in CLI

Update `src/cli/presets/index.ts` — add an entry to the `STACKS` array:

```typescript
export const STACKS: Stack[] = [
  // ... existing stacks ...
  {
    id: 'python',
    name: 'Python',
    description: 'PEP 8, type hints, pytest, async patterns',
  },
];
```

#### 6. Test Your Stack

```bash
# Build and validate content (both run together)
npm run build

# Test init with new stack
npx agent-runway init --stacks python

# Verify Cursor files are copied
ls .cursor/rules/python.mdc
ls .cursor/skills/code-review/searches-python.md
ls .cursor/skills/code-review/commands-python.md

# Verify Claude Code files (if --target claude or all)
ls .agent-runway/skills/code-review/searches-python.md

# Verify VS Code files (if --target vscode or all)
ls .github/instructions/agent-runway/
```

#### 7. Update Documentation

Add the stack to `USAGE.md` — both the preset selection list and the "Available Stacks" list:

```text
  ○ Python (python)
```

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
- Extend `ticket-creator` when backlog delivery shape changes (fields, Jira mapping, QA format, epic/ticket splitting behaviour, or markdown artefact naming under `.agent-runway/specs/proposed/<implementation-slug>/`).
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

This rule will be picked up by Cursor automatically.

### Contributing Rules to Framework

If you create a rule that would benefit others:

1. Place it in `src/stacks/{stack}/`
2. Test it locally
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

### Example: Database Migration Skill

Create `.cursor/skills/db-migration/SKILL.md`:

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

Register the skill in `.cursor/commands/db-migrate.md`:

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
4. **Test patterns**: Verify regex matches what you expect
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
- [ ] Written `{stack}.mdc` rules file (<500 lines)
- [ ] Created `code-review-searches.md` with security patterns
- [ ] Created `code-review-commands.md` with build/test commands
- [ ] Added `spec-templates/spec-template.md` with stack-specific clean architecture guidance (optional)
- [ ] Registered stack in `src/cli/presets/index.ts` (add entry to the `STACKS` array)
- [ ] Ran `npm run build` — this compiles TypeScript **and** validates all content (frontmatter, internal references, stack completeness)
- [ ] Added stack to `USAGE.md` (preset selection list and "Available Stacks" list)
- [ ] Tested `npx agent-runway init --stacks {stack}` (Cursor)
- [ ] Tested `npx agent-runway init --target all --stacks {stack}` (all targets)
- [ ] Verified rules activate with correct glob patterns
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
# Build
npm run build

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
- Add pytest/mypy/ruff build commands"

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

## Advanced: Stack with Custom Skill

For complex stacks (like .NET has `dotnet-core` skill), create a full skill module.

### Structure

```
src/stacks/python/
├── python.mdc
├── code-review-searches.md
├── code-review-commands.md
└── skill-python-core/
    ├── SKILL.md
    ├── testing.md
    ├── async-patterns.md
    ├── type-hints.md
    └── reference.md
```

The skill will be copied to `.cursor/skills/python-core/` during init.

### When to Create a Stack Skill

Create a dedicated skill when:
- Stack has complex, multi-phase workflows
- Stack requires specialized architectural guidance
- Stack has many best practices that don't fit in rules
- You want to provide deep, contextual help

Examples:
- `.NET` has `dotnet-core` skill with CQRS, EF Core, testing patterns
- Python could have `python-core` with FastAPI, SQLAlchemy, pytest patterns
- Go could have `go-core` with concurrency, interfaces, testing patterns

---

## Questions?

- Open an issue on GitHub
- Check the [Usage Guide](USAGE.md) for examples
- See [src/README.md](src/README.md) for package internals
