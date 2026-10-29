# Roadmap

Agent Runway focuses on making AI-assisted delivery repeatable, auditable, and easier to resume.

This roadmap is directional, not a date-based commitment. Items may move as real usage shows what is useful, too heavy, or missing.

## Product Principles

- Keep the repository as the source of durable context.
- Add structure only when it improves delivery.
- Make lightweight work lightweight.
- Make serious work traceable.
- Prefer workflows agents can actually follow.
- Keep escape hatches for teams that do not need full governance.

## Now: v1.7

- One source for commands, agents and skills, installed for Cursor (project or global), Claude Code and VS Code Copilot with per-target path resolution.
- Native Claude Code skills in `.claude/skills/` (every workflow invocable as `/<skill>`, including Lite), with the contrarian review forked into its own subagent.
- Safe updates: managed-entry manifests so user-authored skills, rules, commands and agents are never deleted; `copilot-instructions.md`, `CLAUDE.md` and `AGENTS.md` keep user content outside marked blocks.
- Project config and editable workflow config in `.agent-runway/` for every target, with automatic migration from pre-1.7 layouts.
- Stack-agnostic core: .NET-specific searches and checks live in the dotnet stack; Lite skills route only to installed workflows.
- Context diet: always-on rules cut from ~530 to ~145 lines; large skills split into on-demand reference files.
- Current guidance: OWASP Top 10:2025 and LLM Top 10 2025, React 19, .NET 10, Express 5, Rust 2024, Python with ruff/uv, Go 1.25; Electron stack skill.
- Governance: verdicts from specs and logs (reviews, council, safety-check), monthly trends, `ci-check --format markdown`, GitHub step summary and a reusable GitHub Action.
- Release safety: installed-output link check across every target, mode and stack; lockfile and `npm ci` in CI; no known dependency advisories.

## Shipped in v1.6

- Vibe/Lite preset, `@checkpoint`, `@learning`, `@safety-check`, `@council` preview, and Lite to Structured upgrade.
- Consolidated PR review output with compact/isolated modes, source labels, optional contrarian lens, and technical debt separation.
- Narrative Delivery and Test-Driven Delivery guidance; optional context-provider policy; generated `AGENTS.md`.
- CI governance checks through `agent-runway ci-check` and delivery scorecards through `agent-runway metrics`.

## Next: v1.8

- Stabilize `@council` based on real idea, hypothesis, and implementation validation examples.
- Stabilize the `ci-check` JSON contract and add PR comment publishing to the GitHub Action.
- Recurring-finding analysis in `metrics` (which review findings and memory entries repeat across PRs).
- Add more artifact-level regression tests for generated logs, reviews, ADRs, and memory updates.
- Evaluate migrating the CLI to native ES modules.

## Later

- Experiment with a Shared Workspace model for complex work:
  - Intent
  - Hypothesis
  - Context
  - Constraints
  - Confidence
  - Plan
- Validate whether Shared Workspace improves handoff, resume quality, and agent discipline.
- Add explicit rules for keeping workspace state short and useful.
- Test the model across real multi-session tasks before making it a default workflow primitive.

## Exploring

- Better examples that show issue -> spec -> tickets -> implementation -> review.
- A future diagram skill for architecture, sequence, flow, and system maps, with generated diagrams grounded in repository artifacts rather than unsourced descriptions.

## Not Goals

- Replacing a team's architecture or engineering judgment.
- Making every small task use heavyweight governance.
- Turning Agent Runway into a project management system.
- Optimizing for throwaway prototypes at the expense of serious delivery workflows.
