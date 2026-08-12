# Report Templates

---

## Finding Format

Every finding must include all fields. Findings without a file and line number are excluded from the report unless the issue is explicitly about missing coverage, missing configuration, or a repository-wide artifact.

````markdown
### [N]. [[Severity]] [Short title] - [Sources]

**File:** `path/to/File.cs`
**Lines:** 40-48

```csharp
// Short changed-code snippet that proves the issue.
```

**Impact:** [Technical reason and practical consequence.]

**Why fix:** [Why this matters for correctness, security, reliability, architecture, performance, or maintainability.]

**PR comment:** [Paste-ready English comment.]

**Solution A:** [Concrete fix.]
**Solution B (preferred):** [Preferred fix when there is a clear recommendation.]
````

---

## Consolidated Review Report

Use this as the default output for PR review, branch review, and CI-generated review comments.

````markdown
# Consolidated Code Review - `[branch]` vs `[base]`

**Date:** [date]
**Branch:** `[branch]`
**Base:** `[base]`
**Reviews run:** `/code-review` -> `[security lens]` -> `[performance lens]` -> `[contrarian lens if used]`
**Files changed:** [count] ([+added] / [-removed])
**Build:** Pass / Fail / Not run
**Tests:** Pass / Fail / Not run

## Verdict

**[APPROVE | REQUEST CHANGES | NEEDS DISCUSSION]**

[One short paragraph summarising the highest-risk issues and the merge stance.]

## Summary counts (deduplicated)

| Severity | Count |
|----------|-------|
| Blocker | N |
| High | N |
| Medium | N |
| Low | N |
| **Total** | **N** |

## Sources legend

- **CR** - `/code-review`
- **SEC** - security lens
- **PERF** - performance lens
- **ARCH** - architecture checklist
- **CTR** - optional contrarian lens

Omit sources that were not used.

## Systematic Search Results

Include this section when mandatory searches were run. Omit it for diff-only CI reviews where the runner cannot search the checked-out repository.

| Category | Matches | Status |
|----------|---------|--------|
| Blocking async calls | 0 | Pass |
| async void | 0 | Pass |
| Swallowed exceptions | 2 | Findings 1, 3 |
| Raw SQL | 0 | Pass |
| Hardcoded secrets | 0 | Pass |

## Findings

[Finding format blocks - one per deduplicated finding, sorted by severity and impact.]

## Positives

[Specific good implementation patterns observed. Keep this short and do not let positives dilute blockers.]

## Suggested merge gate

Must address before merge:

1. Finding [N] - [short required action].
2. Finding [N] - [short required action].

Strongly recommended in this PR or immediate follow-up: findings [N-N].

# agent-runway:verdict
gate: review
status: [approve | changes | discuss]
blocking: [count of Blocker findings]
date: [YYYY-MM-DD]
artifact: [feature / branch / files reviewed]
```
````

Persist it: save the review, including the verdict block, to `.agent-runway/logs/reviews/YYYY-MM-DD-<branch-or-scope>.md` so `agent-runway metrics` can read it.

---

## CI Comment Variant

For GitHub or Azure DevOps PR comments, use the same report but keep code snippets short and stable. Prefer one consolidated top-level comment over many inline comments for the first automation version. Inline comments can be added later once false positives are measured.

---

## Source Labels

| Label | Meaning |
|-------|---------|
| **CR** | Standard code-review pass |
| **SEC** | Security lens |
| **PERF** | Performance lens |
| **ARCH** | Architecture or layering checklist |
| **CTR** | Optional contrarian lens for high-impact assumptions |

When multiple passes find the same issue, keep one finding and list every source label, for example `CR, SEC, CTR`.

---

## Verdict Definitions

| Verdict | Meaning |
|---------|---------|
| **APPROVE** | No blockers. High findings acknowledged or addressed. Safe to merge. |
| **REQUEST CHANGES** | One or more blockers present, or unresolved high findings. Must be fixed and re-reviewed. |
| **NEEDS DISCUSSION** | Architectural concern that requires team decision before proceeding. Not a blocker on code quality alone. |

---

## Machine-readable verdict

Always end the review output with this block, filled in (schema: [../shared/verdict-block.md](../shared/verdict-block.md)):

```yaml
# agent-runway:verdict
gate: review
status: [approve | changes | discuss]
blocking: [count of Blocker findings]
date: [YYYY-MM-DD]
artifact: [feature / branch / files reviewed]
```
