# Release - Commit Plan for v1.5.0

Suggested commit sequence for staging the `agent-runway-main/` tree from scratch (no prior commits). Each commit is independently reviewable. Version history lives in `CHANGELOG.md`.

Conventional Commits format: `type(scope): subject`.


## Release validation

Before publishing v1.5.0, run:

```bash
npm run release:check
```

This runs the full build, content validation, smoke tests, content tests, and `npm pack --dry-run` so the published package contents are reviewed before release.

---
## 0. chore: initial project scaffolding and toolchain

Project files, TypeScript config, CI pipeline, and static assets.

Files:
- `.gitignore`
- `tsconfig.json`
- `package.json`
- `LICENSE`
- `EXTENDING.md`
- `USAGE.md`
- `assets/` (all files)
- `examples/` (all files)
- `.github/workflows/ci.yml`

---

## 1. feat(cli): core CLI - init, add, remove, update, list, status, metrics

Full CLI implementation including presets, utilities, smoke tests, validator, and content tests.

Files:
- `src/cli/commands/init.ts`
- `src/cli/commands/add.ts`
- `src/cli/commands/remove.ts`
- `src/cli/commands/update.ts`
- `src/cli/commands/list.ts`
- `src/cli/commands/status.ts`
- `src/cli/commands/metrics.ts`
- `src/cli/index.ts`
- `src/cli/presets/index.ts`
- `src/cli/utils/index.ts`
- `src/cli/validate.ts`
- `src/cli/smoke.ts`
- `src/cli/content-tests.ts`

---

## 2. feat(core): skills, commands, agents, rules, memory, and docs scaffold

All universal framework files - always installed regardless of stack.

Files:
- `src/core/commands/` (all `.md` files)
- `src/core/claude-commands/` (all `.md` files)
- `src/core/agents/` (all `.md` files)
- `src/core/claude-agents/` (all `.md` files)
- `src/core/skills/architect/` (all files)
- `src/core/skills/autonomous-lead/` (all files)
- `src/core/skills/code-review/` (all files)
- `src/core/skills/contrarian/SKILL.md`
- `src/core/skills/express/SKILL.md`
- `src/core/skills/iac/` (all files)
- `src/core/skills/lead/` (all files)
- `src/core/skills/po-eval/SKILL.md`
- `src/core/skills/refactor/` (all files)
- `src/core/skills/shared/caveman-skill-engineering.md`
- `src/core/skills/shared/memory-policy.md`
- `src/core/skills/shared/run-log-schema.md`
- `src/core/skills/shared/verdict-block.md`
- `src/core/skills/spec-creator/` (all files)
- `src/core/skills/start/SKILL.md`
- `src/core/skills/ticket-creator/` (all files)
- `src/core/skills/ticket-eval/SKILL.md`
- `src/core/rules/` (all `.mdc` files)
- `src/core/config/` (all files)
- `src/core/docs/` (all files)
- `src/core/memory/` (all files)
- `src/README.md`

---

## 3. feat(stacks): dotnet and electron stacks

Pre-existing stacks - rules, review integration, and dotnet-core skill.

Files:
- `src/stacks/dotnet/` (all files including `skill-dotnet-core/`)
- `src/stacks/electron/` (all files)

---

## 4. feat(stacks): baseline rules and review integration for ts, node, react, python, go, rust

Pre-existing stack rules and review files (skills added in later commits).

Files:
- `src/stacks/typescript/typescript.mdc`
- `src/stacks/typescript/advanced-patterns.mdc`
- `src/stacks/typescript/api-design-typescript.mdc`
- `src/stacks/typescript/dependency-check.mdc`
- `src/stacks/typescript/code-review-searches.md`
- `src/stacks/typescript/code-review-commands.md`
- `src/stacks/node/node.mdc`
- `src/stacks/node/code-review-searches.md`
- `src/stacks/node/code-review-commands.md`
- `src/stacks/react/react.mdc`
- `src/stacks/react/testing-react.mdc`
- `src/stacks/react/code-review-searches.md`
- `src/stacks/react/code-review-commands.md`
- `src/stacks/react/spec-templates/spec-template.md`
- `src/stacks/python/python.mdc`
- `src/stacks/python/code-review-searches.md`
- `src/stacks/python/code-review-commands.md`
- `src/stacks/go/go.mdc`
- `src/stacks/go/code-review-searches.md`
- `src/stacks/go/code-review-commands.md`
- `src/stacks/rust/rust-development.mdc`
- `src/stacks/rust/code-review-searches.md`
- `src/stacks/rust/code-review-commands.md`
- `src/stacks/rust/spec-templates/spec-template.md`

---

## 5. feat(cli): add ci-check command

New `agent-runway ci-check` command for optional CI governance enforcement. Supports `light` (advisory) and `strict` (fail on violations) profiles. Machine-readable JSON output.

Files:
- `src/cli/commands/ci-check.ts` (new)
- `src/cli/index.ts` (updated)
- `src/cli/content-tests.ts` (updated)

---

## 6. feat(stacks): add typescript-core and node-core skills

New full implementation skills - architecture, patterns, testing, security, observability, reference. New rules for security, testing, and architecture.

Files:
- `src/stacks/typescript/skill-typescript-core/` (7 files)
- `src/stacks/typescript/typescript-security.mdc`
- `src/stacks/typescript/typescript-testing.mdc`
- `src/stacks/node/skill-node-core/` (7 files)
- `src/stacks/node/node-security.mdc`
- `src/stacks/node/node-testing.mdc`
- `src/stacks/node/node-architecture.mdc`

---

## 7. feat(stacks): add python-core, go-core, and rust-core skills

New full implementation skills for Python, Go, and Rust.

Files:
- `src/stacks/python/skill-python-core/` (7 files)
- `src/stacks/go/skill-go-core/` (7 files)
- `src/stacks/rust/skill-rust-core/` (7 files)

---

## 8. feat(stacks): add react-core skill

New full implementation skill for React - component patterns, state management, RTL testing, security (XSS, CSP), error boundaries, Web Vitals.

Files:
- `src/stacks/react/skill-react-core/` (7 files)

---

## 9. chore(release): version 1.5.0 and docs

Bump to 1.5.0. Create `CHANGELOG.md`. Update `README.md` (remove `---` separators, fix scope claim, update stack table). Trim `release.md` to commit plan only.

Files:
- `package.json`
- `CHANGELOG.md` (new)
- `README.md`
- `release.md`

