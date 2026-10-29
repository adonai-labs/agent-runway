# Changelog

All notable changes to Agent Runway are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions follow [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Fixed

- `agent-runway update` and `upgrade` now record the running CLI version in the project config, so `status` no longer reports version drift right after an update.
- `agent-runway update` restores stack spec templates under `.agent-runway/config/spec-templates/`.
- `agent-runway init` rejects unknown `--stacks` and `--target` values instead of saving typos or silently falling back to Cursor.
- TypeScript and React code-review searches used `--type tsx`, which ripgrep does not recognize, so every one of them failed. They now use `--type ts`, which already covers `.tsx`.
- `code-convention.mdc` (ESLint/JS/TS conventions) moved from the .NET stack to the TypeScript stack, and `advanced-patterns.mdc` (Electron patterns) moved from the TypeScript stack to the Electron stack, so each preset installs rules for its own language.

### Changed

- Minimum Node.js version is now 22.12, the first 22.x release that loads the CLI's ES module dependencies without a flag. CI tests 22.12 explicitly.

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
