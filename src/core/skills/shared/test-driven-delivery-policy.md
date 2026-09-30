# Test-Driven Delivery Policy

Use this policy when planning, implementing, reviewing, or validating behavior changes.

## Purpose

Test-driven delivery means understanding the problem before implementation and using executable evidence to guide the change.

It is broader than strict TDD. Prefer a test-first loop when expected behavior is clear, but always require a clear evidence plan before implementation starts.

## Core Loop

For behavior changes, follow this loop:

1. **Understand**: restate the problem, user impact, expected behavior, and out-of-scope boundaries.
2. **Specify evidence**: define how the behavior will be proven before writing production code.
3. **Red**: add or identify a failing test, missing eval, failing contract check, or reproducible bug signal.
4. **Green**: make the smallest implementation change that satisfies the evidence.
5. **Refactor**: improve structure without changing behavior.
6. **Record**: capture validation evidence and any remaining risk.

If a strict red phase is not practical, record the reason and use the smallest credible alternative evidence: characterization test, contract test, smoke test, manual reproduction, lint/type/build gate, or review checklist.

## When Test-First Is Expected

Prefer test-first for:

- new business behavior
- bug fixes with a reproducible symptom
- validation rules
- domain logic
- calculations and algorithms
- API contracts and schema transformations
- authorization or security-sensitive behavior
- regression fixes

## When It Can Be Relaxed

Strict test-first can be relaxed for:

- exploratory spikes
- trivial wiring or generated code
- documentation-only changes
- mechanical refactors with strong existing test coverage
- UI polish where visual/manual evidence is more appropriate
- urgent production mitigation, provided follow-up tests are recorded

Relaxing test-first does not remove the need for evidence.

## Evidence Plan

Before implementation, identify:

- expected behavior
- acceptance criteria or scenario
- test level: unit, integration, E2E, contract, security, performance, smoke, or manual
- command or artifact that will prove success
- known gaps or fallback evidence

## Bug Fixes

For bugs:

1. reproduce the failure or capture the observed signal
2. add a regression test when feasible
3. verify the test fails before the fix when practical
4. implement the smallest fix
5. verify the regression test and relevant suite pass

If the bug cannot be reproduced locally, document the missing signal and use the best available evidence.

## Reviews

During review, missing tests are findings when the PR changes behavior and no credible validation evidence is present.

Do not require new tests for every line change. Judge the risk:

- behavior change without tests or evidence: finding
- bug fix without regression coverage: finding unless explicitly justified
- refactor with no behavior change and existing coverage: acceptable
- high-risk security/contract/data change without executable evidence: high severity

## Relationship to Narrative Delivery

Narrative delivery explains the story. Test-driven delivery proves it.

Use both together:

- Context and intent define the behavior to prove.
- Evidence plan defines the test loop.
- Validation records what actually passed.
- Remaining work records known test gaps.

## Constraints

- Do not write brittle tests that lock implementation details.
- Do not add low-value tests only to satisfy process.
- Do not skip problem understanding because code generation is fast.
- Do not claim TDD when tests were added only after implementation; say "tests added after implementation" and record the reason if relevant.
