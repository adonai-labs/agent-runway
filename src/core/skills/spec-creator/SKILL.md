---
name: spec-creator
description: Creates implementation-ready specs from brief descriptions, existing markdown requirements, or prior specs. Adapts the ticket-creator workflow to spec-engineering with structured lifecycle states, execution planning, and quality gates. Use when creating or refining specs under .agent-runway/specs.
---

# Spec Creator

Creates development-ready specs using a structured, iterative workflow. This skill is a direct evolution of `ticket-creator` for teams that want spec-first execution while keeping `ticket-creator` available for ticket-first workflows.

## When to Use

- Creating a new spec from a brief description
- Refining an existing markdown requirement into spec format
- Converting a ticket-style requirement into a spec-ready artifact
- User says "create spec", "define spec", "refine requirement", "prepare implementation spec"

## Supported Spec Types

| Type | Description |
|---|---|
| **Feature** | New functionality or enhancement with user-facing impact |
| **Fix** | Corrective change for existing behaviour |
| **Change** | Behavioural or process change with moderate scope |
| **Refactor** | Internal technical improvement with no intended external behaviour change |

## Core Principles

Apply shared policy: [../shared/caveman-skill-engineering.md](../shared/caveman-skill-engineering.md)

1. **Start with a complete draft, refine with user feedback**
2. **Use project docs and code context silently where possible**
3. **Balance intent and execution** — capture both "why" and "how"
4. **Produce parseable structure for downstream agents**
5. **Prefer filesystem-native output first** — npm install flow first, marketplaces later
6. **Spec-first without forcing teams** — `ticket-creator` remains valid for ticket-first teams
7. **Clarity over volume** — include what implementation needs, avoid design bloat
8. **Suggest split when scope is too broad**
9. **Support dual entry** — tickets may start from spec artifacts or directly from chat
10. **Escalate design intentionally** — use `architect` when complexity warrants it
11. **Decompose implementation intentionally** — avoid "single giant function" plans; define atomic responsibilities

## 8-Phase Workflow

### Phase 0: Configuration Loading (Silent)

1. Check for `.cursor/config/spec-creator.config.md`
2. If found, use it as active configuration
3. If not found, run generic mode:
   - `codebase_scanning.enabled: false`
   - `output.default_destination: markdown`
   - `output.markdown_path: .agent-runway/specs`
   - Continue without blocking questions

### Phase 1: Input & Classification

Accept one of:
- brief description
- markdown file path
- existing spec path

Determine:
- origin: `new` or `existing`
- spec type: Feature / Fix / Change / Refactor
- `implementation-slug` — kebab-case, ASCII, derived from the solution title (used for all output filenames; see [template.md](template.md))

If too vague, ask up to 3 focused questions.

### Phase 2: Context Gathering (Silent)

Apply the **Minimum context** rule from shared policy; stop gathering once drafting decisions are unblocked.

Use docs and optional codebase scanning (same strategy as `ticket-creator`, adapted for specs). Collect domain terms, affected modules, API/schema impact, and ADR constraints.

Before drafting, check stack template availability at:
- `.agent-runway/config/spec-templates/<stack>/spec-template.md`

If found, reuse its scaffold proposal and architectural conventions in `Proposed Design`, **Proposed Solution Structure**, and implementation planning.
If multiple stacks are installed, pick the primary stack relevant to the requested capability.

### Phase 2.5: Design Triage (Architect Gate)

Decide whether this spec needs explicit design review before approval.

Use `architect` when one or more apply:
- touches more than 2 distinct modules with independent ownership
- introduces/changes public API or cross-boundary contracts
- includes data model or migration complexity
- has non-trivial trade-offs (performance, reliability, security, operability)

If design review is required, produce a concise "design decision note" and merge outcomes into `Proposed Design` and `Design Notes`.

### Phase 2.6: Critical Reasoning Gate (Contrarian)

Run a mandatory contrarian pass when any of these thresholds are true:
- high impact and hard-to-reverse outcome
- domain behavior change with uncertain outcomes
- public interface or contract change
- architecture decision with multiple viable alternatives

When triggered:
- challenge the recommended path with the strongest counter-argument
- generate at least one credible alternative
- document key uncertainty and failure signals
- produce a verdict: `Go`, `Go with conditions`, or `Stop`

When not triggered:
- keep normal execution path, no forced contrarian overhead

### Phase 3: Spec Generation

Generate a complete spec using the template in [template.md](template.md).

Required sections:
- Title
- Status
- Type
- Purpose
- Problem
- Goals / Non-Goals
- Requirements (Requirement + Scenario blocks)
- Proposed Design
- Solution Options (required)
- Contrarian Review (required when threshold applies)
- Proposed Solution Structure (folder/file tree; mandatory)
- Design Notes
- Trade-offs
- Affected Areas
- Implementation Plan (checklist)
- Quality Gates (checklist)
- Risks
- Open Questions
- Spec to Ticket Derivation
- Known Pitfalls
- Learnings (optional)
- Spec Delta
- Acceptance Criteria (checklist)
- Agent Guidance

Enforce parseable structure in checklists and dependency markers.
In `Implementation Plan`, require steps that map to atomic units (small functions/modules) rather than one broad "implement all" step.

### Phase 4: Present & Refine

Present full spec, ask for:
- approved
- changes
- regenerate

Iterate until approved.

### Phase 5: Completeness Check

Validate that spec is executable by implementation agents:
- objective is clear
- scope boundaries are explicit
- **Proposed Solution Structure** is present and maps to real paths/modules
- acceptance criteria are verifiable
- implementation steps are actionable
- risks/dependencies are identified

Auto-fix obvious gaps, ask focused questions for ambiguous gaps.

### Phase 5.5: Repeated Error Detection (Learning Gate)

If the agent detects a repeated failure pattern while drafting or refining the spec
(for example: recurring validation misses, repeated integration failures, repeated
ambiguity from the same area), ask whether to register it for team memory.

Use `AskQuestion` with a single-select prompt:
- `yes` — register repeated error
- `no` — skip registration

If `yes`:
- append an entry to `.agent-runway/memory/repeated-errors.md` (create file if missing)
- include:
  - date
  - error pattern
  - where it appears
  - likely root cause
  - prevention hint
  - linked spec path (e.g. `.agent-runway/specs/<implementation-slug>/spec.md`)

Keep entries concise and non-sensitive. Apply the memory hygiene policy: [../shared/memory-policy.md](../shared/memory-policy.md) (consolidate duplicates, cap active entries, archive instead of delete).

### Phase 6: Output

Naming is mandatory — see [template.md](template.md#output-path-convention). Never write only `spec.md`, `epic.md`, or anonymous `ticket.md`.

Default output (replace `<implementation-slug>` with the agreed slug):

- `.agent-runway/specs/<implementation-slug>/spec.md`

Optional output:
- markdown mirror path requested by user
- ticket summary artifact if user wants ticket-sync later

### Phase 6.5: Human Summary Gate

After generating the spec, ask whether to generate a human-readable summary.

Use `AskQuestion`:

```
Title: Human Summary

Question: Generate human summary?
Options:
  - yes: Yes (recommended)
  - no: No
```

This gate requires explicit user confirmation. Do not auto-select an option.
If no explicit answer is provided, do not create the summary.

If `yes`:
- create `.agent-runway/specs/<implementation-slug>/summary.md`
- include: Why now, What changes, Out of scope, Risks, Delivery slices.

### Phase 7: Summary

Return:
- type
- title
- output path
- readiness status
- context sources
- refinement rounds
- architect gate: invoked or not invoked
- repeated error: detected and registered / detected and skipped / not detected

## Integration with Other Skills

```text
spec-creator (create & validate spec)
      ↓ (spec approved)
   ticket-creator (optional: convert spec to ticket)
      ↓ (or ticket starts directly from chat)
        lead (implement from spec or ticket)
      ↓ (code written)
   code-review (validate code changes)
```

- `spec-creator` is spec-first entrypoint
- `ticket-creator` supports both starts: from approved spec or direct conversation
- `architect` is the design gate for complex or high-impact changes
- both spec-first and ticket-first flows can feed `lead`, depending on team workflow

## Red Flags

- Requirement too vague after 3 questions
- Contradiction with architectural decisions
- Scope spans multiple independent deliverables
- Missing acceptance criteria for critical behaviour

Stop and request user decision when red flags block reliable spec generation.

## Additional Resources

- Context and scanning reference: [reference.md](reference.md)
- Spec template: [template.md](template.md)
