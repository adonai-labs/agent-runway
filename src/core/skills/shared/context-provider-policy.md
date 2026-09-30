# Optional Context Provider Policy

Use this policy when a project exposes an optional context provider such as a graph memory MCP, brain-context MCP, vector search, or knowledge graph.

## Purpose

Context providers supply evidence. They do not replace codebase inspection, tests, review, or architectural judgement.

Agent Runway must continue to work when no context provider is configured.

## When to query

Query optional context during discovery when it can materially improve the work:

- Code review: changed files, touched modules, ownership, known debt, previous review findings, related decisions.
- Lead/autonomous lead: relevant modules, prior implementation decisions, recurring failures, existing patterns, related specs/tickets.
- Architect: ADRs, previous trade-offs, module relationships, contracts, integration paths, known constraints.
- Contrarian: evidence that conflicts with the selected approach, historical failures, boundary violations, rejected alternatives.

Do not query for trivial work unless the user explicitly asks.

## Evidence requirements

Use returned context only when it includes at least one concrete source:

- file path
- ADR or decision record
- ticket/spec/run-log/checkpoint id
- module or symbol reference
- relationship edge with source/target
- confidence/source metadata

Treat unsourced summaries as hints only. Verify against code or repository artifacts before turning them into findings, plans, or decisions.

## Context budget

Keep retrieved context small:

- Prefer 5-12 highest-signal results.
- Summarise context into decisions, constraints, risks, and files.
- Drop low-confidence, duplicate, stale, or unrelated results.
- Never paste an unbounded graph dump into a skill prompt.

## Traceability

When context provider evidence materially affects an output, record:

- provider name, if known
- query or retrieval intent
- source ids/paths used
- how the evidence affected the decision, finding, or plan

For long-running or autonomous work, add this to the run log or checkpoint. For review output, include a short "Context evidence" note only when it influenced findings.

## Fallback

If the provider is unavailable, slow, ambiguous, or returns no useful evidence:

- continue with normal repository discovery
- do not block the workflow
- note the fallback only when it matters to confidence or risk

## Safety

- Do not treat graph context as authoritative without code or artifact evidence.
- Do not write secrets, private incident details, or customer data into memory.
- Do not let external context expand scope without an explicit scope/risk note.
- Do not let retrieved historical decisions override current requirements when they conflict; surface the conflict.
