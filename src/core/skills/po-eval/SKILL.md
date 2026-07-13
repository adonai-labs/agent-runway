---
name: po-eval
description: Evaluates product quality of specs and tickets before implementation. Focuses on business value, clarity, scope, success metrics, risks, dependencies, and readiness from a Product Owner perspective. Use when the user says "/po-eval", "evaluate this spec", "evaluate this ticket from PO view", or "is this product-ready".
---

# PO Evaluation

## Invoke Command

```
/po-eval [Jira key or path to .md]
```

Examples:
- `/po-eval PROJ-501`
- `/po-eval .agent-runway/specs/order-flow/spec.md`
- `/po-eval .agent-runway/specs/order-flow/tickets/task-03-email-notifications.md`

---

## Goal

Evaluate whether a spec or ticket is product-ready before delivery work starts.

This skill does not do technical code review. It evaluates product quality and delivery readiness.

---

## Workflow - 4 Phases

### Phase 1 - Load artefact and context

1. Read the provided spec/ticket content completely.
2. Extract explicit business objective, target user/persona, scope, constraints, and acceptance expectations.
3. If business context exists in `.agent-runway/docs/business/*`, use it to validate alignment.
4. If key sections are missing, continue evaluation and mark gaps clearly.

### Phase 2 - Score product readiness

Evaluate the artefact against these criteria:

1. Problem clarity:
- Is the user/business problem explicit and non-ambiguous?

2. Outcome and value:
- Is the expected business/user outcome explicit?
- Is value described (impact, risk reduction, revenue, time saved, etc.)?

3. Scope quality:
- Are in-scope and out-of-scope boundaries explicit?
- Are assumptions and constraints listed?

4. Success metrics:
- Are measurable success indicators defined?
- Are acceptance outcomes testable at product level?

5. Dependency and risk coverage:
- Are product dependencies identified (teams, upstream/downstream flows, legal/compliance, external services)?
- Are major product risks and mitigations listed?

6. Release and adoption readiness:
- Are rollout expectations, communication needs, and operational readiness considered when relevant?

### Phase 3 - Verdict

Set one verdict:

- `PRODUCT READY - YES`
- `PRODUCT READY - CONDITIONAL`
- `PRODUCT READY - NO`

Rules:
- `YES`: all critical product criteria are covered with concrete detail.
- `CONDITIONAL`: core criteria pass, but non-blocking gaps remain.
- `NO`: one or more critical criteria are missing or too vague.

### Phase 4 - Output report

Return a concise report in this structure:

```markdown
# PO Evaluation - [Artefact]

## PRODUCT READY: YES / CONDITIONAL / NO

## Summary
[One short paragraph with the product-readiness assessment.]

## Scorecard
| Criterion | Status | Gap |
|---|---|---|
| Problem clarity | PASS/FAIL | [Gap or -] |
| Outcome and value | PASS/FAIL | [Gap or -] |
| Scope quality | PASS/FAIL | [Gap or -] |
| Success metrics | PASS/FAIL | [Gap or -] |
| Dependency and risk coverage | PASS/FAIL | [Gap or -] |
| Release and adoption readiness | PASS/FAIL/N/A | [Gap or -] |

## Must Fix Before Build
1. [Only blocking product gaps]

## Recommended Improvements
1. [Non-blocking quality improvements]

## Questions for PO/BO
1. [Questions that remove ambiguity]
```

## Machine-readable verdict

Always end the output with this block, filled in (schema: [../shared/verdict-block.md](../shared/verdict-block.md)):

```yaml
# agent-runway:verdict
gate: po-eval
status: [yes | conditional | no]
blocking: [count of "Must Fix Before Build" items]
date: [YYYY-MM-DD]
artifact: [spec or ticket path evaluated]
```

Persist it: append this block to the evaluated spec/ticket under `.agent-runway/specs/` so `agent-runway metrics` can read it.
