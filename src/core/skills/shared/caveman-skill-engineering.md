# Caveman Skill Engineering Policy

Use this policy when creating specs, tickets, and implementation plans.

## Goal

Reduce token usage and context noise while preserving quality, safety, and delivery clarity.

## Core Rules

1. **Outcome-first**
   - Start with the smallest observable outcome.
   - Reject work that does not change an observable behavior or deliverable.

2. **Minimum context**
   - Pull only context that changes a decision.
   - Prefer focused reads over broad exploration.
   - Stop context gathering once implementation can proceed safely.

3. **Atomic decomposition**
   - Do not allow monolithic "do everything" functions.
   - Split work into small, single-purpose functions or modules.
   - Separate orchestration, validation, domain logic, and I/O responsibilities.

4. **Simplicity before abstraction**
   - Prefer direct composition of simple units.
   - Add interfaces/layers only when there is proven variation or instability.

5. **SOLID and DRY by default**
   - SRP: one reason to change per unit.
   - OCP/DIP/ISP/LSP: apply when needed, not ceremonially.
   - DRY: avoid duplicating business logic, decision rules, and acceptance logic.

## Operational Checks

- **Context Budget Check:** "Did we read more context than needed to decide safely?"
- **Complexity Check:** "Can we remove a layer/abstraction and keep correctness?"
- **Decomposition Check:** "Is any unit doing multiple responsibilities?"
- **Duplication Check:** "Did we copy a rule that should be centralized?"

If any answer is "yes", refactor before finalizing output.
