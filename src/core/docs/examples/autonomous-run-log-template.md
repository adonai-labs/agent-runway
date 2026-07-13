# Autonomous Run Log Template

Use this template for:

`.agent-runway/logs/autonomous-runs/<run-id>.md`

---

## 0) Run Header (machine-readable)

Fill in and keep at the top — `agent-runway metrics` reads this block. Schema: `shared/run-log-schema.md` in your agent's skills directory (`.cursor/skills`, `.agent-runway/skills`, or `.github/skills`).

```yaml
# agent-runway:run
run_id: <run-id>
date: <YYYY-MM-DD>
task: <one-line task>
classification: trivial | standard | complex
build: pass | fail | skipped
test: pass | fail | skipped
lint: pass | fail | skipped
retries: 0
time_to_green_min: 0
deviations: 0
memory_refs:
```

---

## 1) Objective and Boundaries

- Objective:
- In scope:
- Out of scope:
- Assumptions:

## 2) Classification and Rationale

- Classification: Trivial | Standard | Complex
- Rationale:

## 3) Planned Implementation

- Files to create:
- Files to modify:
- Decomposition plan:
- Risks and dependencies:

## 4) Decision Log

| UTC Timestamp | Context | Decision | Alternatives | Risk | Impacted Files | Evidence | Rollback |
|---|---|---|---|---|---|---|---|
| 2026-01-01T12:00:00Z | ... | ... | ... | low | ... | ... | ... |

## 5) Files Changed

- `path/to/file`

## 6) Validation Evidence

- Build:
- Tests:
- Lint/static analysis:
- Security checks:

## 7) Security and Contract Impact

- API/event/schema impact:
- Auth/authz/secrets impact:

## 8) Residual Risks

- Risk:
- Mitigation:

## 9) Rollback Notes

- Rollback steps:
- Preconditions:

## 10) Follow-up Actions

- Follow-up 1:
- Follow-up 2:
