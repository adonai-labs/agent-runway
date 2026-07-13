# Report Templates

---

## Issue Format

Every issue must include all fields. Issues without a line number are excluded from the report.

```markdown
### [SEVERITY] [CATEGORY] — [Short Title]

**File**: `path/to/File.cs:42`

**Problem**:
[What the code does and why it's wrong]

```csharp
// Current code (with line number context)
var result = GetOrderAsync(id).Result; // line 42 — BLOCKS thread
```

**Impact**: [Technical reason] → [Practical consequence]
Example: Synchronous blocking on an async method in ASP.NET Core causes thread pool starvation → application becomes unresponsive under load.

**Confidence**: [High | Medium | Low] — how certain this is a real issue vs. a possible false positive
**Lens**: [Engineering | Security | Performance] *(only when a multi-pass review was run)*

**Fix**:
```csharp
var result = await GetOrderAsync(id);
```

**Pros of fix**: [Why this is better]
**Cons / trade-offs**: [Any downsides or effort required]

**Reference**: [antipatterns.md — Async / Await] or [OWASP A03: Injection]
```

---

## Full Review Report

```markdown
# Code Review — [Feature / Branch Name]

**Date**: [date]
**Reviewer**: AI Code Review (lead skill Phase 9 handoff / manual invocation)
**Files Reviewed**: [count]
**Lenses applied**: [Engineering, Security, Performance] / [single lens name]
**Build**: ✅ Pass / ❌ Fail
**Tests**: ✅ Pass / ❌ Fail / ⚠️ Not run

---

## Summary Table

| Severity | Count |
|----------|-------|
| 🔴 Blocker | N |
| 🟡 High | N |
| 🔵 Medium | N |
| ⚪ Low / Nitpick | N |
| **Total** | **N** |

---

## Systematic Search Results

| Category | Matches | Status |
|----------|---------|--------|
| Blocking async calls | 0 | ✅ |
| async void | 0 | ✅ |
| Swallowed exceptions | 2 | ❌ |
| Raw SQL | 0 | ✅ |
| Hardcoded secrets | 0 | ✅ |
| ... | ... | ... |

---

## Findings

### Blockers

[Issue format blocks — one per finding]

### High

[Issue format blocks]

### Medium

[Issue format blocks]

### Low / Nitpicks

[Issue format blocks]

---

## Positives

[Acknowledge good patterns, clean abstractions, thorough tests]

---

## Verdict

> **[APPROVE / REQUEST CHANGES / NEEDS DISCUSSION]**

[One paragraph summary — key concerns and what must be addressed before merge]
```

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

Persist it: save the review (including this block) to `.agent-runway/logs/reviews/<date>.md` so `agent-runway metrics` can read it.

---

## Verdict Definitions

| Verdict | Meaning |
|---------|---------|
| **APPROVE** | No blockers. High findings acknowledged or addressed. Safe to merge. |
| **REQUEST CHANGES** | One or more blockers present, or unresolved high findings. Must be fixed and re-reviewed. |
| **NEEDS DISCUSSION** | Architectural concern that requires team decision before proceeding. Not a blocker on code quality alone. |
