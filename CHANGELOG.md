# Changelog

All notable changes to Agent Runway are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions follow [Semantic Versioning](https://semver.org/).

---

## [1.7.0] - Unreleased

### Breaking changes

- Node.js 22.12 or newer is required (the CLI loads ES-module-only dependencies through `require()`).
- Removed commands `/dry-check`, `/self-review`, `/security-scan`, `/fast-lead`, `/dotnet`, and the deprecated `/spec` and `/ticket` wrappers (announced as removed in 1.5.0 but still shipped). Use `/lead`, `/review`, `/spec-creator`, `/ticket-creator`, and the `dotnet-core` skill.
- Claude Code skills now install natively to `.claude/skills/` instead of `.agent-runway/skills/`. Every workflow is invocable as `/<skill>`; `.claude/commands/` keeps only the `/review` and `/validate` aliases. `agent-runway update` migrates existing projects.
- The project config file always lives at `.agent-runway/agent-runway.json`, and editable workflow config at `.agent-runway/config/` for every target (previously `.cursor/config/`, and missing for Claude Code and VS Code). `update` migrates both and keeps edited files.

### Added

- Installed-output link check (`dist/installed-links.js`, part of `npm test` and CI): installs every target x mode x stack combination, plus global Cursor, and fails on broken links, missing referenced paths, or unresolved placeholders.
- Managed-entry manifests (`.agent-runway-managed.json`) so updates replace only what Agent Runway installed. User-authored skills, rules, commands, and agents are no longer deleted.
- `agent-runway metrics` reads verdicts from `.agent-runway/logs/` (reviews, council) as well as specs, shows monthly pass-rate trends, and supports `--json`. New gates: `council` and `safety-check`.
- `agent-runway ci-check --format markdown`, automatic GitHub step summary, and a reusable GitHub Action (`action.yml`).
- Electron stack skill (`electron-core`); spec templates for Go, Python, Node.js, and TypeScript; `developer-profiles.md` and `spec-creator.config.md` config templates.

### Changed

- Commands and agents have a single source with `{{skills}}`, `{{rules}}`, and `{{config}}` placeholders resolved per target, fixing global Cursor installs whose commands pointed at project paths.
- The core is stack-agnostic: .NET-only review searches and checks moved to the dotnet stack; `lead`, `refactor`, `start`, `express`, and `iac` are language- and cloud-neutral.
- Lite skills detect Lite mode and route only to installed workflows, suggesting `agent-runway upgrade` when a Structured workflow is needed. Lite also installs the shared policies its skills link to.
- Context diet: always-on rules shrink from ~530 to ~145 lines; `lead/SKILL.md` from 590 to 271 lines; every core skill is at most 300 lines.
- Rules updated to OWASP Top 10:2025 and the OWASP Top 10 for LLM Applications 2025 (no longer always-on); security rules deduplicated.
- Stack guidance updated: React 19, .NET 10, Express 5, ESLint flat config, Vitest, Python with ruff and uv, Rust 2024 with axum 0.8, Go 1.25, Electron security defaults.
- `.github/copilot-instructions.md` keeps user content outside an Agent Runway marked block.
- CLI internals split into focused modules; `init`, `update`, `add`, `remove`, and `upgrade` share one installer.
- `update-notifier` replaced with a small built-in check (clears 4 moderate npm advisories). `package-lock.json` is committed and CI uses `npm ci`.

### Fixed

- `update` and `upgrade` record the running CLI version, so `status` no longer reports drift right after updating; `update` restores stack spec templates.
- `init` rejects unknown `--stacks` and `--target` values, and `--yes` never prompts.
- TypeScript and React review searches used `--type tsx`, which ripgrep rejects, so all of them failed.
- `code-convention.mdc` (ESLint) moved from the .NET stack to TypeScript; `advanced-patterns.mdc` (Electron) moved from TypeScript to Electron.
- Code review verdicts saved under `logs/reviews/` are now counted by `metrics`.
- Many broken cross-references in skills (config paths, `ticket-eval`, `repeated-errors.md`, phase numbers, spec layout).
- The changelog intro now sits above the release entries.

---

## [1.6.1] - 2026-10-01

### Fixed

- Replaced remote README badge images with plain links so the npm package page renders the header cleanly.

---

## [1.6.0] - 2026-08-27

### Changed

- `code-review` now defaults to a consolidated PR review report: verdict-first summary, deduplicated severity counts, source labels, paste-ready English PR comments, positives, and a suggested merge gate.
- Added explicit `compact` and `isolated` review modes so developers can choose between one context-efficient pass and focused high-risk passes.
- Added an optional `CTR` contrarian lens inside code review for high-impact architecture, audit/compliance, consistency, security-boundary, and public-contract assumptions.
- Documented `agent-runway ci-check` as a preview, opt-in CI governance feature.
- Replaced README text links with rendered badges for npm version, license, stars, downloads, and roadmap.
- Added guidance for atomic commits and reviewable PR shape.
- Added optional graph/brain-context provider policy across review, lead, architecture, contrarian, autonomous, checkpoint, and learning workflows.
- Added Narrative Delivery guidance so tickets, commits, PRs, checkpoints, run logs, and memory entries preserve context, intent, change, evidence, and remaining work.
- Added Test-Driven Delivery guidance so workflows understand the problem, define evidence, prefer test-first loops when feasible, and record validation gaps.
- Added generated `AGENTS.md` support as a neutral agent entrypoint while preserving user-authored content outside the Agent Runway marked block.
- Tightened engineering principles with function-size heuristics for focused, reviewable code.

## [1.5.0] — 2026-06-26

### Added

- **Stack skills for TypeScript, Node.js, React, Python, Go, and Rust** — each skill covers architecture, patterns, testing, security, observability, and reference. Installed via `agent-runway add <stack>`.
  - `typescript-core` — primary scope: TypeScript with Vitest, Zod, and Pino
  - `node-core` — primary scope: Express / Fastify backend services
  - `react-core` — primary scope: React 18+ Vite SPA with React Testing Library and React Query
  - `python-core` — primary scope: FastAPI with pytest and structlog
  - `go-core` — primary scope: net/http / chi services with slog and OpenTelemetry
  - `rust-core` — primary scope: Axum services with tracing and sqlx
- **`agent-runway ci-check`** — optional CLI command for CI-based governance enforcement. Profiles: `light` (advisory, default) and `strict` (fail on violations). `--json` flag for machine-readable output.
- **`agent-runway metrics`** — delivery scorecard aggregated from `# agent-runway:verdict` blocks and `# agent-runway:run` headers.
- **`agent-runway status`** — version-drift warnings and update notifications.
- **Machine-readable gate verdicts** — `# agent-runway:verdict` YAML block appended to gate outputs; aggregated by `metrics`.
- **Run log header schema** — `# agent-runway:run` header for autonomous run logs; tracked by `metrics`.
- **New TypeScript rules** — `typescript-security.mdc`, `typescript-testing.mdc`
- **New Node.js rules** — `node-security.mdc`, `node-testing.mdc`, `node-architecture.mdc`
- **`CHANGELOG.md`** — dedicated version history file (this file).

### Changed

- All stack skills enforce consistent principles: simplicity first, SOLID and DRY as guides, Clean Architecture at the right scale, no over-engineering.
- `release.md` retained as a commit plan reference; changelog moved here.

### Removed

- `/dry-check` command — replaced by `/lead` quality gates.
- `/self-review` command — replaced by `/review`.
- `/security-scan` command — replaced by `/review` (security lens).
- `/fast-lead` command — Fast-Track Mode is now a mode within `/lead`.
- `/dotnet` command — stack guidance comes from auto-attaching rules and `@dotnet-core`.

No stack has its own slash command. Stack rules attach automatically via file globs; stack skills are invoked by name (`@skill-name`).

### Fixed

- Version sourced from `package.json` at runtime; no hardcoded literals in CLI.

---

## [1.4.1] — prior release

### Added

- Memory hygiene policy — deduplication, capping, archive-not-delete across all memory files.
- Multi-pass code review lenses — Engineering, Security, and Performance passes with severity and confidence fields.
- Content tests — skill injection, scaffold integrity, agent parity, verdict markers, version comparison.
- Python and Go basic stacks — rules and review integration (full skills added in 1.5.0).
- CI pipeline — build and test on Node.js 18 and 20 via GitHub Actions.

### Changed

- Commands renamed: `spec` → `spec-creator`, `ticket` → `ticket-creator`.
- Isolated review agents — `contrarian` runs in clean context to avoid cognitive bias.
- `update` prunes stale files from fully-managed directories before copying.
- `update` recreates the project scaffold (memory, specs, logs) the same way `init` does.
- Removed .NET bias from core skills (`start`, `express`, `refactor`, `code-review`).

---

## [1.3.x] — prior releases

### Added

- Stack-agnostic core — `start`, `express`, `refactor`, `code-review` skills work across all languages.
- `agent-runway update` — pruning and scaffold recreation on update.
- Isolated `contrarian` agent for adversarial review in clean context.

### Changed

- Version sourced from `package.json`; removed hardcoded literals.
