# Verdict Block

Machine-readable verdict appended to the end of every gate output. The human-readable verdict still comes first; this block exists so the CLI can aggregate gate outcomes (pass rates, blocking counts) for the dashboard.

## Format

Append this exact fenced block as the **last** element of the gate output:

```yaml
# agent-runway:verdict
gate: ticket-eval
status: conditional
blocking: 2
date: 2026-06-26
artifact: .agent-runway/specs/<slug>/tickets/task-01.md
```

## Fields

| Field | Required | Meaning |
|-------|----------|---------|
| `gate` | yes | Which gate produced this: `ticket-eval` \| `po-eval` \| `review` \| `contrarian` |
| `status` | yes | Normalised outcome token (see per-gate values below) |
| `blocking` | yes | Count of blocking findings/criteria (integer; `0` means nothing blocks) |
| `date` | yes | ISO date `YYYY-MM-DD` |
| `artifact` | yes | Path or key of the thing evaluated |

## Status tokens per gate

| Gate | Tokens |
|------|--------|
| `ticket-eval` | `yes` \| `conditional` \| `no` |
| `po-eval` | `yes` \| `conditional` \| `no` |
| `review` | `approve` \| `changes` \| `discuss` |
| `contrarian` | `go` \| `go-conditional` \| `stop` |

## Rules

- The first line is always the marker comment `# agent-runway:verdict` — do not change it; the parser keys on it.
- Use lowercase tokens exactly as listed.
- `blocking` must reflect the human report (e.g. count of `no`/`changes`/`stop` drivers). When `status` is the passing token, `blocking` is `0`.
- Do not remove or reorder fields.
