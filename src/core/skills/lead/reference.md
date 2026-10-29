# Reference — Stack Detection, Search Commands & Key Paths

Read when: detecting the stack in Phase 4, searching for prior art in Phase 0/3, or picking the build/test commands in Phase 8.

---

## Stack Detection

Resolve the stack per file, by proximity — not from project-level markers alone.

1. **The file being written** — its extension and parent directory are the strongest signal (a `.py` file under `services/api/` is Python even if the repo root has a `package.json`).
2. **Walk up to the nearest manifest:**

   | Manifest | Stack skill (if installed) |
   |----------|----------------------------|
   | `tsconfig.json` | `typescript-core` |
   | `package.json` (server code: Express, Fastify, Nest, etc.) | `node-core` (plus `typescript-core` when `tsconfig.json` is present) |
   | `package.json` with `react` dependency and component code | `react-core` |
   | `*.csproj` / `*.sln` | `dotnet-core` |
   | `pyproject.toml` / `requirements.txt` / `setup.py` | `python-core` |
   | `go.mod` | `go-core` |
   | `Cargo.toml` | `rust-core` |
   | `*.bicep`, `*.tf`, CloudFormation/Pulumi project files | `iac` skill |

3. **Monorepos:** each file belongs to the stack of its nearest manifest. Never apply one stack's conventions to another stack's files.
4. **Ambiguous:** state the ambiguity and ask the developer.

## Loading Stack References

When the stack skill folder exists (`../<stack>-core/SKILL.md`), load only the file that matches the current step:

| Step | File |
|------|------|
| Layer boundaries, module layout (Phase 2, Phase 4) | `../<stack>-core/architecture.md` |
| Implementation patterns (Phase 4) | `../<stack>-core/patterns.md` |
| Tests (Phase 5) | `../<stack>-core/testing.md` |
| Security self-review (Phase 6) | `../<stack>-core/security.md` |
| Observability self-review (Phase 6) | `../<stack>-core/observability.md` |
| Stack-specific delivery checks, when the stack provides them | `../<stack>-core/delivery-checks.md` |

A stack skill may name its files differently (for example `dotnet-core` splits patterns into application, infrastructure, and API files); follow its `SKILL.md` index. If no stack skill is installed, apply the universal engineering principles and the project's existing conventions.

## Build, Test, Lint Commands

Never assume a toolchain. In order of preference:

1. The commands file injected into the code-review skill for the stack: `../code-review/commands-<stack>.md`.
2. The project's own scripts: `package.json` scripts, `Makefile`/`justfile`, `pyproject.toml` tool config, the CI workflow, or the README.
3. If neither exists, ask the developer which commands define "green".

---

## Codebase Search Patterns

Use language-appropriate file filters (`--type ts`, `--type py`, `--type go`, `--type rust`, `--type cs`, or `--glob`).

```bash
# Similar features / handlers / services
rg -l "<FeatureNoun>|<VerbNoun>" src/

# Existing validators or schemas
rg -l "validator|schema|validate" -i src/

# Repository / data-access abstractions
rg "interface .*Repository|class .*Repository|Repository\b" src/

# Domain events / messages
rg -l "Event\b|event_type|topic" src/

# Shared helpers and utilities
rg -l "utils|helpers|common|shared" src/
```

Anti-pattern scans for Phase 4b are in [incremental-checks.md](incremental-checks.md).

---

## Key Conventions (defaults when the project has none)

| Concern | Convention |
|---------|------------|
| Use-case naming | Verb + noun: `cancelOrder`, `CancelOrderCommand`, `cancel_order` |
| Query naming | `getX` / `listX` |
| Domain event | Past tense: `OrderCancelled` |
| Repository | Interface/port in the application/core layer, implementation in infrastructure |
| Migration naming | Timestamp + descriptive name, using the project's migration tool |
| API route | `api/v{version}/<resource>` — plural nouns, kebab-case |
| Folder layout | Feature-first (`features/<feature>/...`) over type-first when the project allows |

Project conventions always win over these defaults.
