---
name: express
description: Minimal-friction implementation path for well-scoped tasks. Assumes the developer has full context, knows the codebase, and does not need planning ceremony. Use when the developer says "/express", wants to move fast on a well-understood single-layer change, or explicitly opts out of the full workflow.
---

# Express

## Invoke Command

```
/express <description of what you want to build or fix>
```

Examples:
- `/express add null guard to OrderService.GetById`
- `/express fix missing ConfigureAwait on async database call in PaymentHandler`
- `/express add X-Correlation-Id header to outbound HTTP requests`

> Not sure if `/express` is right for this task? Run `/start` first — it will tell you whether the task fits `/express` or needs more ceremony.

---

## What this skill does

Five phases. No approval gates except one: escalation signal confirmation if signals are detected in Phase 0.

The developer owns all design decisions. This skill enforces critical safety checks and a lightweight self-review — nothing more.

`/express` is not `/lead` Fast-Track Mode with fewer phases. It is a different skill designed from the ground up for minimal friction. It assumes the developer has full context, knows the codebase, and does not need a planning step.

---

## Escalation signals

Checked in Phase 0. Also surface inline during Phase 2 if unexpected complexity emerges.

Signals are **non-blocking** — the developer always sees them and always decides. They are never a hard stop.

Simplicity policy:
- `/express` is only for low-risk, reversible, low-uncertainty changes.
- If risk profile does not match this, recommend `/lead` and stop instead of stretching `/express`.

### Detection criteria

| Signal | Condition |
|--------|-----------|
| Contract change | The change modifies a public API, shared interface, or data contract consumed by other components or services |
| Cross-boundary | The change touches more than one bounded context, service, or application layer in a non-trivial way |
| Security surface | The change involves authentication, authorisation, input validation, secrets, or data exposure |
| Data migration | The change requires a schema change or data transformation that cannot be easily rolled back |
| Multi-service coordination | The change requires coordinated deployment or configuration across more than one service |
| Unknown territory | The developer's description suggests unfamiliarity with the part of the codebase being changed |

### Presentation format

When one or more signals are detected, present them before proceeding:

```
⚠️ Escalation signals detected:
   - [signal name]: [one-line explanation specific to this task]
   - [signal name]: [one-line explanation specific to this task]

   These suggest this task may be more complex than /express assumes.
   Recommended path: /lead (Fast-Track Mode if you already have a plan)

   Continue with /express anyway? [y/N]
```

If the developer confirms, note the accepted signals and proceed to Phase 1.
If the developer says no, recommend the appropriate alternative command and stop.

---

## Workflow — 5 Phases

---

### Phase 0 — Intent check `[non-skippable]`

Ask the developer one single question:

> "What are you building or fixing? One sentence."

From the answer, run escalation signal detection (see above). If signals are found, surface them immediately using the presentation format above. Do not proceed to Phase 1 until the developer has seen the signals and confirmed they want to continue with `/express`.

Also classify:
- impact
- reversibility
- uncertainty
- cost of error

If risk profile is not low + reversible + low uncertainty, recommend `/lead` and stop.

If no signals are found, proceed to Phase 1 without asking anything else. No gates, no approval requests.

---

### Phase 1 — Critical searches `[non-skippable]`

Run the following searches automatically, without asking permission:

1. **DRY — search 1**: Does anything similar already exist in the codebase? Target the most likely location based on the task description.
2. **DRY — search 2**: Is there a shared abstraction, base class, or utility that already does part of this? Target a different angle from search 1.
3. **Security**: Are there existing security patterns relevant to this change? (e.g. how the codebase currently handles validation, authorisation, or secrets in this area)

These three searches are the minimum and the maximum. Do not add more — that is what `/lead` is for.

Report findings inline. If a DRY hit is found, flag it and ask the developer how they want to proceed before continuing. If no hits are found on either DRY search, state that plainly and move to Phase 2 immediately.

---

### Phase 2 — Implement

Implement the change. No planning phase. No approval gate on the implementation approach. The developer owns the design decisions.

Apply all relevant rules for the detected stack (engineering principles, security, and any stack-specific rules) as they are applied in any other skill — injected automatically and non-negotiable.

If during implementation a significant unexpected complexity emerges (e.g. the change touches more boundaries than initially described), surface an escalation signal inline using the format above and continue. Do not stop. The developer can decide to finish with `/express` or switch to `/lead` for the remaining work.

---

### Phase 3 — Self-review checklist `[non-skippable]`

Run the self-review checklist inline. Do not delegate to the review subagent.

| Check | Question |
|-------|----------|
| Intent match | Does the implementation match the intent stated in Phase 0? |
| Hardcoded values | Are there hardcoded values, secrets, or magic strings? |
| Error handling | Is error handling present where the code can fail? |
| Async correctness | Are there async/await issues (fire-and-forget, missing ConfigureAwait where relevant)? |
| Test coverage | Is the change covered by at least one test, or is there a documented reason why it isn't? |
| Injection and validation | Are there any obvious injection or validation gaps? |
| Accepted signals | If escalation signals were accepted in Phase 0, have those areas been handled carefully? |

Present the checklist results as a brief summary: issues found and how they were resolved. If a blocking issue is found, fix it before proceeding. Do not skip to Phase 4 with unresolved checklist items.

---

### Phase 4 — Commit

Produce a conventional commit message following the pattern established in the codebase (e.g. `fix(payments): add null guard to OrderService.GetById`). Done.

No Phase 10.5 in `/express`. The overhead of improvement logging is not appropriate here.
