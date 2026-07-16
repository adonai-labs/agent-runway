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

## Now: v1.5

- Multi-environment support for Cursor, Claude Code, and VS Code.
- Stack skills for .NET, TypeScript, Node.js, React, Python, Go, and Rust.
- Project-scoped `.agent-runway/` memory, docs, specs, workflows, and logs.
- Artifact writing contract with canonical paths for checkpoints, reviews, autonomous run logs, ADRs, specs, and tickets.
- CI governance checks through `agent-runway ci-check`.
- Delivery scorecards through `agent-runway metrics`.
- `@checkpoint` skill for saving current state during rapid prototyping, pauses, and handoffs.
- Vibe/Lite preset for fast, skill-first usage with minimal installed context, including `@code-review`.
- `@safety-check` skill for quick Go / Go with caution / Stop risk review.
- Upgrade path from Lite to Structured through `agent-runway upgrade --to structured`.
- Release validation with build, content validation, smoke tests, content tests, and package dry-run.
- Content guardrails for broken links, command/agent parity, stack completeness, and mojibake detection.

## Next: v1.6

- Modularize the CLI internals into smaller focused modules.
- Add more artifact-level regression tests for generated logs, reviews, ADRs, and memory updates.
- Add more targeted install/update regression tests.
- Reduce large utility surfaces and make path/config/copy/generation behavior easier to review.
- Improve documentation around local package testing and release operations.

## Later: v1.7

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

## Not Goals

- Replacing a team's architecture or engineering judgment.
- Making every small task use heavyweight governance.
- Turning Agent Runway into a project management system.
- Optimizing for throwaway prototypes at the expense of serious delivery workflows.
