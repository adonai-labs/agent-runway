# Lead — Workflow Reference

Rarely-needed detail for the `lead` skill. Read only the section the trigger points to.

---

## Fast-Track Mode

Read when: the developer asks for fast-track, says they already have a plan, or the active developer profile makes fast-track the default.

An accelerated path for **Standard** tasks. Not available for **Complex** tasks (always full workflow with Phase 0 architect delegation) or **Trivial** tasks (already skip to Phase 4).

Phases 0–2 collapse into a single **Fast-Track Validation** step:

1. The developer presents their plan (what to build, which layers, key decisions).
2. Validate the plan against [antipatterns.md](antipatterns.md) and [standards.md](standards.md).
3. Search the codebase briefly for conflicting patterns or overlapping implementations.
4. Evaluate risk signals:
   - Security surface modified (auth, secrets, input validation)
   - Contract change (API shape, event schema, database migration)
   - New abstraction introduced (interface, base class, shared component)

**No risk signal:** proceed to Phase 3 (DRY Analysis) with a one-line note:

```
Fast-track approved — Standard task, no risk signals detected.
```

**Any risk signal:** halt fast-track, name the signal, and restart at Phase 0:

```
Fast-track denied — [signal detected, e.g. "security surface modified: new authorisation policy"].
Reverting to full workflow at Phase 0.
```

Phases 3–10 run unchanged regardless of fast-track. Under the Autonomous profile, fast-track validation is silent and interrupts only when a risk signal is found.

---

## Developer Profiles

Read when: `{{config}}/developer-profiles.md` sets an `active:` profile other than `guided`.

| Gate | Guided (default) | Standard | Autonomous |
|------|-------------------|----------|------------|
| Phase 0 — Approach selection | Ask — blocks | Ask — blocks | Silent validation — interrupts only on a risk signal |
| Phase 1 — Scope confirmation | Ask — blocks | Present output, proceed unless ambiguity detected | Silent — proceed unless ambiguity detected |
| Phase 2 — Plan approval | Ask — blocks | Ask — blocks | Silent validation — interrupts only on an antipattern or risk signal |
| Fast-Track (Standard tasks) | Developer must request it | Default | Default |
| Phase 10 — Commit prefix | Ask — always | Ask — always | Ask — always (commit message always needs confirmation) |

"Silent validation" means the same checks run but are not presented interactively. If all pass, proceed. If any fails (risk signal, antipattern, ambiguity), interrupt with the specific finding and wait for developer input.

---

## Commit and PR Format

Read when: Phase 10 has multiple independent changes, or the project has no established commit convention.

Prefer atomic commits grouped by functional intent:

- Keep refactors separate from behaviour changes where practical.
- Keep tests/docs/config-only changes easy to identify.
- Keep dependency or generated changes separate from product logic.
- If one commit intentionally mixes concerns, explain why in the body or PR description.
- Each commit is one coherent step of the story: context, intent, change, and evidence are understandable from the message and PR.

```
<prefix>(<scope>): <short description>

<body — what changed and why, not how>
```

Example:

```
feat(orders): add order cancellation endpoint

Implements POST /api/orders/{id}/cancel with idempotency check.
Raises OrderCancelled event for downstream notification handling.
```

PR description: Problem, Approach, What changed, Validation, Risks / follow-ups.

---

## System Feedback

Read when: Phase 10.5 found something worth capturing.

Multi-select question:

```
Did this cycle reveal anything that should be captured for system improvement?
- A new pattern worth documenting in standards.md
- An antipattern not yet in antipatterns.md
- An architectural decision that merits an ADR in .agent-runway/docs/architecture/decisions/
- A recurring friction point in the workflow
- None — nothing to capture
```

**None:** close the session.

**Anything else:** append an entry to `.agent-runway/logs/system-improvements.md` (create it if missing):

```markdown
### YYYY-MM-DD — [Short description]

- **Type**: Pattern / Antipattern / ADR / Workflow friction
- **Detail**: [One paragraph]
- **Suggested target file**: [e.g. `antipatterns.md`, `standards.md`, `.agent-runway/docs/architecture/decisions/`]
- **Source**: [Feature or ticket that surfaced this]
```

Do not modify installed Agent Runway skills or rules directly — they are overwritten on upgrade. Only log the improvement for the tech lead to review. If the lesson is a durable project rule rather than framework feedback, suggest the `learning` skill instead.
