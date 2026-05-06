# Fast Lead

Read and follow the skill at `.cursor/skills/lead/SKILL.md`.

Before activating Fast-Track Mode, run escalation signal detection against the task description. Check for any of the following:

| Signal | Condition |
|--------|-----------|
| Contract change | The change modifies a public API, shared interface, or data contract consumed by other components or services |
| Cross-boundary | The change touches more than one bounded context, service, or application layer in a non-trivial way |
| Security surface | The change involves authentication, authorisation, input validation, secrets, or data exposure |
| Data migration | The change requires a schema change or data transformation that cannot be easily rolled back |
| Multi-service coordination | The change requires coordinated deployment or configuration across more than one service |
| Unknown territory | The task description suggests unfamiliarity with the part of the codebase being changed |

If signals are detected, surface them before proceeding:

```
⚠️ Escalation signals detected:
   - [signal name]: [one-line explanation specific to this task]
   - [signal name]: [one-line explanation specific to this task]

   These suggest this task may be more complex than /fast-lead assumes.
   Recommended path: /lead (full workflow)

   Continue with /fast-lead anyway? [y/N]
```

The developer can still proceed — signals are informational, not blocking. If the developer confirms, activate Fast-Track Mode as defined in the skill.

Decision-governance override:
- If risk profile is high impact + hard-to-reverse/irreversible, or uncertainty is high, do not continue in `/fast-lead`.
- Route to `/lead` with contrarian gate.

---

Activate **Fast-Track Mode** as defined in the skill. Collapse Phases 0–2 into a single Fast-Track Validation step. If any risk signal is detected, fall back to the full workflow.

Do not use this for Complex tasks — they always require the full workflow with Phase 0 architect delegation.
