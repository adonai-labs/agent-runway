# Example Flow: Issue -> Spec -> Tickets

## 1. Intake Issue

Source:
- Type: incident
- Reference: `INC-447`
- Symptom: duplicate charge emails sent to customers after payment retries
- Desired outcome: exactly one customer email per successful payment
- Constraints: no billing downtime, no breaking API changes

Routing decision:
- Impact: high
- Reversibility: hard-to-reverse (customer trust + support load)
- Uncertainty: medium
- Cost of error: high
- Result: `lead + contrarian` via spec-first path

## 2. Spec Extract (summary)

Spec path:
- `.agent-runway/specs/proposed/payment-email-idempotency/payment-email-idempotency-spec.md`

Key options evaluated:
1. DB unique constraint on notification key
2. Distributed lock around email dispatch
3. Outbox pattern with idempotency key (recommended)

Contrarian review:
- Counter-argument: outbox adds operational complexity and lag
- Alternative kept viable: unique constraint + retry-safe upsert
- Verdict: Go with conditions
- Condition: define replay and backfill strategy before rollout

## 3. Derived Delivery Tickets

Epic path:
- `.agent-runway/specs/proposed/payment-email-idempotency/payment-email-idempotency-epic.md`

Tickets:
1. `.agent-runway/specs/proposed/payment-email-idempotency/task-01-payment-email-idempotency-outbox-schema-and-migration.md`
2. `.agent-runway/specs/proposed/payment-email-idempotency/task-02-payment-email-idempotency-dispatcher-and-idempotency-check.md`
3. `.agent-runway/specs/proposed/payment-email-idempotency/task-03-payment-email-idempotency-observability-and-alerts.md`
4. `.agent-runway/specs/proposed/payment-email-idempotency/task-04-payment-email-idempotency-integration-tests-and-regression.md`

## 4. Memory Updates

Execution memory entry example:
- Pattern type: safeguard
- Where: notification dispatcher
- Trigger: retry storm after transient provider timeout
- Guardrail: enforce idempotency key before side effects

Reasoning memory entry example:
- Initial recommendation: distributed lock
- Main counter-argument: lock contention risk under peak load
- Final choice: outbox + idempotency key
- Rule update: prefer outbox for retry-heavy side effects with customer-visible outcomes
