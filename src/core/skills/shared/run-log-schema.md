# Run Log Header

Machine-readable header at the top of every autonomous run log (`.agent-runway/logs/autonomous-runs/<run-id>.md`). It exists so the CLI (`agent-runway metrics`) can measure execution quality over time: gate pass rates, retries, time-to-green, and which memory guardrails were actually applied.

## Format

Place this fenced block at the **top** of the run log, filled in:

```yaml
# agent-runway:run
run_id: 20260626T031500Z-add-metrics
date: 2026-06-26
task: Add the metrics command
classification: standard
build: pass
test: pass
lint: pass
retries: 0
time_to_green_min: 12
deviations: 0
memory_refs:
```

## Fields

| Field | Required | Meaning |
|-------|----------|---------|
| `run_id` | yes | Matches the run log filename |
| `date` | yes | ISO date `YYYY-MM-DD` |
| `task` | yes | One-line description of the run |
| `classification` | yes | `trivial` \| `standard` \| `complex` |
| `build` | yes | `pass` \| `fail` \| `skipped` |
| `test` | yes | `pass` \| `fail` \| `skipped` |
| `lint` | yes | `pass` \| `fail` \| `skipped` |
| `retries` | yes | Times a gate had to be re-run before passing (integer) |
| `time_to_green_min` | yes | Minutes from first gate run to all gates green (integer) |
| `deviations` | yes | Number of deviations from the planned implementation (integer) |
| `memory_refs` | yes | Comma-separated titles of memory entries applied during this run; leave empty if none |

## Rules

- The first line is always the marker comment `# agent-runway:run` — do not change it; the parser keys on it.
- Keep the header flat (no nested keys) so it parses without a YAML dependency.
- `memory_refs` closes the loop on memory usefulness (an entry referenced across runs earns its place; one never referenced is an archive candidate per [memory-policy.md](memory-policy.md)).
