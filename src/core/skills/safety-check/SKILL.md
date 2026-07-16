---
name: safety-check
description: Lightweight risk check before continuing with a fast change. Use when the developer says "safety check", "risk check", "before I continue", "is this safe", or when a Lite workflow touches contracts, data, auth, secrets, deployment, or many files.
standalone: true
---

# Safety Check

## Invoke Skill

```
@safety-check [optional scope]
```

Examples:
- `@safety-check`
- `@safety-check before publishing`
- `@safety-check auth changes`

---

## What this skill does

Runs a short risk check before continuing. It is not a full review, not a spec, and not an ADR.

Use it to keep fast work fast while catching obvious reasons to slow down.

---

## Workflow

### 1. Inspect observable state

Use the available project context:

- current changed files
- recent git diff, if available
- stated task intent
- files touching public contracts, auth, data, secrets, deployment, or infrastructure
- tests or validation already run

Do not invent validation. If tests were not run, say so.

### 2. Classify risk signals

Flag only signals that are actually present.

| Signal | Examples |
|---|---|
| Contract | API shape, event schema, shared DTO, exported package surface |
| Data | migration, persistence format, irreversible transformation |
| Security | auth, permissions, secrets, input validation, sensitive data |
| Deployment | config, CI/CD, infra, rollout order, runtime compatibility |
| Blast radius | many files, multiple services, cross-layer changes |
| Unknowns | unclear intent, missing acceptance criteria, unverified assumptions |

### 3. Return a verdict

Use exactly one:

- **Go**: low risk, reversible, validation path is clear
- **Go with caution**: risk exists, but a focused check can manage it
- **Stop**: likely to break users/data/security or the task needs design clarity first

### 4. Output format

```md
# Safety Check

Verdict: Go | Go with caution | Stop

## Risk Signals

- <Signal>: <specific evidence>

## Must Check Before Continuing

- <Command, file, scenario, or manual check>

## Suggested Path

<Continue in Lite, run @checkpoint, or upgrade to Structured.>
```

---

## Routing

- If verdict is **Go**, continue with the current fast path.
- If verdict is **Go with caution**, run the listed checks before continuing.
- If verdict is **Stop**, recommend upgrading to Structured and using the relevant skill:
  - `@architect` for design uncertainty
  - `@lead` for multi-layer implementation
  - `@code-review` for completed risky changes

Keep the answer short. This skill should add friction only when the risk is real.
