# Agent Runway — Package Source

This directory contains the source files for the `@adonai-labs/agent-runway` npm package.

The root `README.md` is the user-facing documentation. This file is for contributors.

---

## Directory Structure

```
src/
├── core/                        # Universal framework — always installed
│   ├── commands/               # Cursor slash commands
│   ├── claude-commands/        # Claude Code slash commands
│   ├── claude-agents/          # Claude Code subagents (isolated context)
│   ├── agents/                 # Cursor agents
│   ├── skills/                 # Skills (Cursor + Claude Code + VS Code)
│   ├── rules/                  # Universal engineering rules (.mdc)
│   ├── config/                 # Framework config templates
│   ├── docs/                   # Scaffold docs and examples
│   └── memory/                 # Memory file templates
│
├── stacks/                     # Stack-specific extensions (selectively installed)
│   ├── dotnet/
│   ├── typescript/
│   ├── react/
│   ├── node/
│   ├── rust/
│   ├── python/
│   ├── go/
│   └── electron/
│
└── cli/                        # CLI implementation (TypeScript)
    ├── commands/
    │   ├── init.ts             # npx agent-runway init
    │   ├── add.ts              # agent-runway add <stack>
    │   ├── remove.ts           # agent-runway remove <stack>
    │   ├── update.ts           # agent-runway update
    │   ├── list.ts             # agent-runway list
    │   ├── status.ts           # agent-runway status
    │   └── metrics.ts          # agent-runway metrics
    ├── presets/                # Preset definitions (web-fullstack-ts, core-only, etc.)
    └── utils/                  # Copy helpers, config I/O, path resolution
```

---

## How Installation Works

`agent-runway init` asks the user for a target environment and a stack preset, then:

1. Copies `src/core/` files to the appropriate target directories
2. Copies selected stack files from `src/stacks/{stack}/`
3. Creates the `.agent-runway/` artifact scaffold in the project root

### Target mapping

| Target | Destination |
|---|---|
| `cursor` | `.cursor/commands/`, `.cursor/skills/`, `.cursor/rules/`, `.cursor/agents/` |
| `claude` | `.claude/commands/`, `.claude/agents/`, `.agent-runway/skills/`, `.agent-runway/rules/`, `CLAUDE.md` |
| `vscode` | `.github/copilot-instructions.md`, `.github/instructions/`, `.github/prompts/`, `.github/agents/`, `.github/skills/` |

### Artifact scaffold (always created)

```
.agent-runway/
├── specs/
├── docs/
├── memory/
├── config/
├── workflows/
└── logs/
```

### Config file location

- Cursor install: `.cursor/agent-runway.json`
- Claude-only install: `.agent-runway/agent-runway.json`

---

## Stack Extension Structure

Each stack in `src/stacks/{stack}/` can provide:

| File | Purpose |
|---|---|
| `*.mdc` | Cursor rules activated by glob patterns |
| `code-review-searches.md` | Stack-specific search patterns for code review |
| `code-review-commands.md` | Build and test commands for this stack |
| `skill-{name}/` | Complete stack-specific skill (copied alongside core skills) |
| `spec-templates/` | Spec scaffold templates for this stack |

---

## Adding a New Stack

1. Create `src/stacks/{stack-name}/`
2. Add at minimum `code-review-searches.md` and `code-review-commands.md`
3. Add `.mdc` rule files for stack-specific standards
4. Register the stack in `src/cli/presets/index.ts`
5. Test with `npx agent-runway init --stacks {stack-name}`

See `EXTENDING.md` at the repo root for the full guide.

---

## Adding a New Core Skill

1. Create `src/core/skills/{skill-name}/SKILL.md`
2. For command-backed skills, add a slash command in **both** `src/core/commands/{name}.md` and `src/core/claude-commands/{name}.md` (the command file references the skill, so its name may differ from the skill — e.g. `validate` → `ticket-eval`). For skill-only workflows, add `standalone: true` to the skill frontmatter instead.
3. If the skill needs an isolated context (review / critique / adversarial roles), add an agent in **both** `src/core/agents/{name}.md` and `src/core/claude-agents/{name}.md`
4. Run `npm run build` — the validator enforces command/agent parity across Cursor and Claude, and that every **core** skill is reachable from at least one command/agent or marked `standalone: true`
5. The skill is automatically copied to all target environments on install

Stack skills (`src/stacks/*/skill-*`) are installed via `agent-runway add` — they do **not** have slash commands; use rules (globs) and `@skill-name` invocation.

---

## Build and Release

```bash
npm run build          # Compile TypeScript to dist/ and validate all skill frontmatter
npm run lint           # Run ESLint
npm test               # Build + smoke tests + content tests
npm run content-test   # Content and integration tests only (faster iteration)
```

CI runs on push and PR via `.github/workflows/ci.yml` across Node.js 18 and 20.

The package publishes `dist/` and `src/` (skills, rules, stacks). See `files` in `package.json` for the exact list.
