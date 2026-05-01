# Spec Creator — Reference

Reference material for `spec-creator`. This is intentionally aligned with `ticket-creator` discovery mechanics, but optimized for spec engineering outputs.

---

## Context Discovery

Use configured doc paths from `docs.*` in `.cursor/config/spec-creator.config.md`.

Suggested sources:
- `.agent-runway/docs/business/entities.md` -> domain entities, lifecycle, constraints
- `.agent-runway/docs/business/flows.md` -> current journeys and behavioural expectations
- `.agent-runway/docs/contracts/schema.md` -> schema impact, migrations, constraints
- `.agent-runway/docs/contracts/api.md` -> contracts and integration points
- `.agent-runway/docs/architecture/modules.md` -> module boundaries and ownership
- `.agent-runway/docs/architecture/decisions.md` -> ADR constraints and rejected approaches
- `.agent-runway/docs/architecture/architecture.md` -> system shape and stack assumptions

### Discovery Process

1. Read only docs relevant to the requested change.
2. Prefer targeted extraction over exhaustive reading.
3. If docs are missing and scanning is enabled, inspect codebase patterns.
4. Record context sources for Phase 7 summary.

---

## Codebase Scanning Fallbacks

Use only when `codebase_scanning.enabled: true`.

Default exploration patterns:
- Types/interfaces: `src/**/types/**/*.ts`, `src/**/interfaces/**/*.ts`
- API/contracts: `src/**/api/**/*.ts`, calls to `fetch(` or `axios`
- Data layer: `src/**/migrations/**/*`, repository/data access files
- UI/flow clues: `src/**/components/**/*.tsx`, `src/**/hooks/**/*.ts`

Extract:
- existing behaviour to preserve
- impacted modules and boundaries
- dependency touchpoints (API/schema/service)
- implementation constraints implied by current architecture

---

## Spec Quality Checks

A spec is considered ready when:

1. **Problem and goal clarity** — it is obvious why this change exists.
2. **Boundary clarity** — non-goals and out-of-scope are explicit.
3. **Design adequacy** — approach is concrete enough to implement, including **Proposed Solution Structure** (folder/file tree).
4. **Plan executability** — checklist can be followed incrementally.
5. **Verification coverage** — quality gates and acceptance criteria are testable.
6. **Risk visibility** — known risks/dependencies are called out.
7. **Behavioral coverage** — at least one `Requirement` with `Scenario` blocks exists.
8. **Delta clarity** — change intent is explicit via `Spec Delta`.

If any of these are weak, refine before final output.

---

## Design Gate Guidance (`architect`)

Invoke `architect` when complexity exceeds straightforward implementation.

Typical triggers:
- public contract changes
- significant schema evolution or migrations
- multi-module or cross-team boundary impact
- meaningful trade-offs with no obvious default

Expected output from `architect`:
- chosen approach and rationale
- rejected alternatives (brief)
- constraints and guardrails for implementation

Persist this into the spec sections:
- `Proposed Design`
- `Design Notes`


