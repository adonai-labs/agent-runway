# Agent Runway — Package Source

This directory contains the source files for the `@adonai-labs/agent-runway` npm package.

The root `README.md` is the user-facing documentation. This file is for contributors.

---

## Directory Structure

```
src/
├── core/                        # Universal framework — always installed
│   ├── agents/                 # One source per agent (architect, contrarian, review)
│   ├── commands/               # One source per command, with `description` frontmatter
│   ├── config/                 # Editable config templates (review, ticket, spec, developer profiles)
│   ├── docs/                   # Scaffold docs and examples
│   ├── memory/                 # Memory file templates
│   ├── rules/                  # Universal engineering rules (.mdc)
│   └── skills/                 # Workflow skills (+ shared/ policies and schemas)
│
├── stacks/                     # Stack-specific extensions (selectively installed)
│   └── <stack>/                # dotnet, typescript, node, react, python, go, rust, electron
│       ├── *.mdc               # Stack rules
│       ├── code-review-searches.md
│       ├── code-review-commands.md
│       ├── skill-<stack>-core/ # Stack skill
│       └── spec-templates/     # All stacks except electron
│
└── cli/                        # CLI implementation (TypeScript)
    ├── index.ts                # Command registration (commander)
    ├── commands/               # init, add, remove, update, upgrade, list, status, metrics, ci-check
    │                           # (+ installation.ts: shared project/global config loading)
    ├── presets/index.ts        # STACKS and PRESETS
    ├── utils/
    │   ├── config.ts           # Config types, targets, load/save of agent-runway.json
    │   ├── markdown.ts         # Frontmatter, marker blocks, {{placeholder}} resolution
    │   ├── paths.ts            # Package root and source paths
    │   ├── update-check.ts     # Once-a-day "newer version available" notice
    │   └── install/
    │       ├── content.ts      # Skills, rules, commands, agents, managed manifests, spec templates
    │       ├── cursor.ts       # Cursor target
    │       ├── claude.ts       # Claude Code target + CLAUDE.md block
    │       ├── vscode.ts       # VS Code target + copilot-instructions.md block
    │       └── index.ts        # installFromConfig, .agent-runway scaffold, AGENTS.md, migrations
    ├── validate.ts             # Content validator (run by `npm run build`)
    ├── smoke.ts                # End-to-end init smoke tests
    ├── content-tests.ts        # Content and integration tests
    └── installed-links.ts      # Installs every target x mode x stack and checks installed links
```

---

## How Installation Works

`init`, `add`, `remove`, `update`, and `upgrade` all go through `installFromConfig` (`utils/install/index.ts`), so they cannot drift apart. It:

1. Migrates pre-1.7 config from `.cursor/config/` to `.agent-runway/config/`
2. Installs each configured target from `src/core/` and the selected `src/stacks/<stack>/`
3. Creates the `.agent-runway/` artifact scaffold (templates are copied only when missing)
4. Writes the `AGENTS.md` marked block and the stack spec templates

### One source, many targets

Each command (`src/core/commands/*.md`) and agent (`src/core/agents/*.md`) has a single source. Sources use the placeholders `{{skills}}`, `{{rules}}`, and `{{config}}`, which are resolved per target at install time; skills link to each other with relative paths. The validator rejects target-specific paths in sources.

| Placeholder | Cursor | Claude Code | VS Code |
|---|---|---|---|
| `{{skills}}` | `.cursor/skills` (`~/.cursor/skills` global) | `.claude/skills` | `.github/skills` |
| `{{rules}}` | `.cursor/rules` (`~/.cursor/rules` global) | `.agent-runway/rules` | `.agent-runway/rules` |
| `{{config}}` | `.agent-runway/config` | `.agent-runway/config` | `.agent-runway/config` |

### Target mapping

| Target | Destination |
|---|---|
| `cursor` | `.cursor/commands/`, `.cursor/agents/`, `.cursor/skills/`, `.cursor/rules/` (global: `~/.cursor/`) |
| `claude` | `.claude/skills/` (native skills, `/<skill>`), `.claude/commands/` (only aliases that don't collide with a skill: `review`, `validate`), `.claude/agents/`, `.agent-runway/rules/`, `CLAUDE.md` marked block |
| `vscode` | `.github/skills/`, `.github/prompts/` (from commands), `.github/agents/`, `.github/instructions/agent-runway/`, `.github/copilot-instructions.md` marked block, `.agent-runway/rules/` |

In Claude Code the `contrarian` skill gets `context: fork` and `agent: contrarian` so it runs in an isolated subagent. Lite mode installs only the Lite skills and three rules: no commands, prompts, or agents.

### Managed manifests

Every folder Agent Runway writes (skills, rules, commands, agents, prompts) gets a `.agent-runway-managed.json` listing the entries it wrote. Updates remove and rewrite only those entries, so user-authored skills, rules, commands, and agents are preserved. Folders without a manifest (installs before 1.7) fall back to removing only names Agent Runway ships or used to ship.

### Artifact scaffold (always created)

```
.agent-runway/
├── specs/
├── docs/
├── memory/
├── config/            # editable templates, never overwritten by update
├── workflows/
├── logs/
└── agent-runway.json  # project config for every target
```

Global Cursor installs keep their config in `~/.cursor/agent-runway.json`. A legacy `.cursor/agent-runway.json` is migrated on the next save.

---

## Stack Extension Structure

Each stack in `src/stacks/{stack}/` provides:

| File | Purpose |
|---|---|
| `*.mdc` | Rules activated by glob patterns |
| `code-review-searches.md` | ripgrep commands, installed as `code-review/searches-<stack>.md` |
| `code-review-commands.md` | Build/lint/test commands, installed as `code-review/commands-<stack>.md` |
| `skill-<stack>-core/` | Stack skill (`SKILL.md` + architecture, patterns, testing, security, observability, reference) |
| `spec-templates/` | Spec templates, installed to `.agent-runway/config/spec-templates/<stack>/` (optional) |

---

## Adding a New Stack

1. Create `src/stacks/{stack-name}/`
2. Add `.mdc` rules, `code-review-searches.md`, `code-review-commands.md`, and `skill-{stack-name}-core/`
3. Register the stack in `src/cli/presets/index.ts`
4. Run `npm test`

See `EXTENDING.md` at the repo root for the full guide.

---

## Adding a New Core Skill

1. Create `src/core/skills/{skill-name}/SKILL.md` with `name` and `description` frontmatter
2. For command-backed skills, add `src/core/commands/{name}.md` with `description` frontmatter that points to `{{skills}}/{skill-name}/SKILL.md` (the command name may differ from the skill, e.g. `validate` → `ticket-eval`). In Claude Code a command whose name matches a skill is not installed, because the skill is already `/<skill>`. For skill-only workflows, add `standalone: true` to the skill frontmatter instead.
3. If the skill needs an isolated context (review / critique / adversarial roles), add an agent in `src/core/agents/{name}.md`
4. To include it in Lite, add it to `LITE_CORE_SKILLS` in `utils/install/content.ts`
5. Run `npm test` — the validator enforces command descriptions, that every core skill is reachable from a command/agent or marked `standalone: true`, and that sources use placeholders instead of target paths

Stack skills (`src/stacks/*/skill-*`) are installed via `agent-runway add` — they do **not** have command sources; rules attach by glob and the skill is invoked directly.

---

## Build and Release

```bash
npm run build          # Compile TypeScript to dist/ and run the content validator
npm test               # Build + validate + smoke + content tests + installed-links check
npm run content-test   # Content and integration tests only (faster iteration)
npm run smoke          # Smoke tests only
```

CI runs on push and PR via `.github/workflows/ci.yml` across Node.js 22.12, 22, and 24.

The repo root `action.yml` is a GitHub Action that runs `agent-runway ci-check` (inputs `profile`, `version`, `working-directory`).

The package publishes `dist/`, `src/core`, `src/stacks`, `USAGE.md`, `EXTENDING.md`, and `action.yml`. See `files` in `package.json` for the exact list.
