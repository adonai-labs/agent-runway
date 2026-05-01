# Agent Runway - NPM Package Structure

This directory contains the source files for the Agent Runway npm package.

## Directory Structure

```
src/
├── core/                    # Universal framework components (always installed)
│   ├── commands/           # Slash commands (agnostic)
│   ├── skills/             # Base skills with templates
│   ├── rules/              # Universal engineering rules
│   ├── agents/             # Isolated sub-processes
│   ├── config/             # Framework configuration
│   └── memory/             # Persistent knowledge templates
│
├── stacks/                 # Stack-specific extensions (selectively installed)
│   ├── typescript/
│   │   ├── *.mdc          # TypeScript rules
│   │   ├── code-review-searches.md
│   │   └── code-review-commands.md
│   ├── dotnet/
│   │   ├── *.mdc          # .NET rules
│   │   ├── skill-dotnet-core/
│   │   ├── code-review-searches.md
│   │   └── code-review-commands.md
│   ├── react/
│   ├── rust/
│   └── electron/
│
└── cli/                    # CLI implementation
    ├── commands/
    │   ├── init.ts        # Initialize project
    │   ├── add.ts         # Add a stack
    │   ├── remove.ts      # Remove a stack
    │   └── update.ts      # Update framework
    ├── templates/          # File templates for init
    └── utils/              # CLI utilities
```

## How It Works

### 1. User Runs Init

```bash
npx agent-runway init --stacks node,typescript,react
```

### 2. CLI Process

1. Copies `src/core/*` to `.cursor/` in user's project
2. Copies only selected stack files from `src/stacks/{selected}/` to `.cursor/`
3. Processes templates to remove references to non-selected stacks
4. Creates `.cursor/agent-runway.json` runtime config file
5. Creates `.agent-runway/` product directories (`memory/`, `specs/`, `config/`, `workflows/`)
6. Creates `.agent-runway/docs/` structure when it does not exist

### 3. Result in User's Project

```
user-project/
├── .cursor/
│   ├── agent-runway.json      # { "stacks": ["typescript", "react"], "version": "1.0.0" }
│   ├── commands/              # From src/core/commands
│   ├── skills/
│   │   ├── code-review/
│   │   │   ├── SKILL.md       # Processed template
│   │   │   ├── systematic-searches-base.md
│   │   │   ├── searches-typescript.md    # From src/stacks/typescript
│   │   │   └── commands-typescript.md
│   │   └── ... (other skills)
│   └── rules/
│       ├── engineering-*.mdc  # Universal rules
│       ├── typescript.mdc     # From src/stacks/typescript
│       └── react.mdc          # From src/stacks/react
├── .agent-runway/
│   ├── memory/
│   │   ├── errors.md
│   │   ├── memory.md
│   │   └── repeated-errors.md
│   ├── specs/
│   ├── config/
│   └── workflows/
└── .agent-runway/docs/
    ├── business/
    ├── architecture/
    └── testing/
```

## Template Processing

Skills like `code-review/SKILL.md` contain markers for stack-specific content:

```markdown
### Phase 2a — Build & Test

<!-- @stack-specific:commands -->
See the build commands for your selected stack(s):
{{#if hasTypeScript}}
- TypeScript: [commands-typescript.md](commands-typescript.md)
{{/if}}
{{#if hasDotNet}}
- .NET: [commands-dotnet.md](commands-dotnet.md)
{{/if}}
```

The CLI processes these templates during init to include only the selected stacks.

## Stack Extension Structure

Each stack extension provides:

1. **Rules** (`*.mdc`) - Cursor rules activated by glob patterns
2. **Code Review Searches** (`code-review-searches.md`) - Stack-specific security/quality patterns
3. **Build Commands** (`code-review-commands.md`) - How to build/test this stack
4. **Skills** (optional) - Complete stack-specific skill workflows (like dotnet-core)

## Adding a New Stack

1. Create `src/stacks/{stack-name}/`
2. Add rules (`*.mdc` files)
3. Create `code-review-searches.md` with stack-specific patterns
4. Create `code-review-commands.md` with build/test commands
5. Update CLI to recognize the new stack
6. Update this README

## Philosophy

- **Minimal installation**: Only install what the user needs
- **No runtime overhead**: All processing happens at init time
- **File-based**: Generated files are plain markdown/config, no runtime dependencies
- **Maintainable**: Core and stacks are separated, easy to update individually

