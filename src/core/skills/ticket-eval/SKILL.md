---
name: ticket-eval
description: Evaluates tickets and user stories for development readiness. Classifies ticket type, checks completeness against defined criteria, detects implementation antipatterns, and produces a structured report with a clear READY TO DEV verdict. Use when the user says "ticket eval", "validate ticket", "is this ready", "check this ticket", "/validate", or provides a Jira ticket number or markdown file to review.
---

# Ticket Evaluation

## Invoke Command

```
/validate [ticket number or path to .md file]
```

Examples:
- `/validate PROJ-501`
- `/validate tasks/order-feature.md`
- `/validate` (will prompt for ticket or file)

> Not sure which skill to use? Start with `/start` — it classifies intent and routes to the right skill.

---

## Workflow — 4 Phases

---

### Phase 1 — Gather ticket information

**If Jira MCP is available:**
Use the MCP to retrieve the full ticket including description, acceptance criteria, attachments, comments, and metadata.

**If Jira is not available or user provides a `.md` file:**
Read the file and extract all available information. Note any missing sections in the report but continue validating what is present.

The ticket must include as much of the following as possible:

- Summary (title)
- Issue type (Story, Bug, Task, Spike, etc.)
- Description and user story (As a… / I want… / So that…)
- Acceptance criteria (or exit criteria for Spikes)
- Scope (includes / excludes)
- Design/UX links or explicit N/A
- Dependencies (APIs, schema, tickets, third parties)
- QA notes / test cases
- Comments, labels, status, links

Do not proceed until a ticket key or file path is provided.

---

### Phase 2 — Classify ticket type

Determine the task type using this priority order:

1. **Jira Issue Type** (if explicit): Bug, Story, Task, Spike
2. **Labels**: check for `tech-debt`, `spike`, `chore`
3. **Content analysis** when type is generic "Task":
   - New functionality → **Feature**
   - Fixing broken behaviour → **Bug**
   - Research/investigation → **Spike**
   - Refactoring/upgrades → **Tech Debt**
   - Maintenance/config → **Chore**

#### Task type profiles

| Criterion | Feature | Bug | Spike | Tech Debt | Chore |
|---|---|---|---|---|---|
| 1. Context / Clear Objective | Required | Required | Required | Required | Required |
| 2. Defined Scope | Required | Required | Required | Recommended | Optional |
| 3. Acceptance Criteria | Required | Required | N/A — use **exit criteria** | Recommended | Optional |
| 4. Design/UX Linked | Required (if UI) | Recommended (if UI) | N/A | N/A | N/A |
| 5. Dependencies | Required | Required | Recommended | Required | Recommended |
| 6. QA Notes / Test Cases | Required | Required | N/A | Recommended | N/A |
| 7. Documentation / Links | Recommended | Required | Required | Recommended | Optional |

**Spike exit criteria** (replaces criterion 3):
- Time-box defined (e.g. "2 days")
- Deliverable explicit (ADR, proof of concept, written recommendation)
- Decision point clear (e.g. "Create feature tickets after spike")

**Validation thresholds:**
- **YES** — all Required criteria pass with specific, verifiable details
- **CONDITIONALLY** — all Required pass, but some Recommended items are missing
- **NO** — any Required criterion fails or lacks specific details

---

### Phase 3 — Validate against criteria

Apply the profile from Phase 2. For each criterion:

**Distinguish mention from specification:**
- Mention: "Saves to Projects table" — identifies location only
- Specification: "Saves to `Projects.selected_attributes` (JSONB) with structure `{attributeId: string, enabled: boolean}`" — provides implementation blueprint

**Validate each criterion:**

**1. Context / Clear Objective**
- What is being built or changed
- Why it provides business value
- User story format present (As a / I want / So that)

**2. Defined Scope**
- Explicit includes and excludes
- Edge cases and boundaries stated
- Rationale for chosen approach if hardcoded values, fixed workflows, or single-solution approaches are present

**3. Verifiable Acceptance Criteria**
- Each criterion is measurable and testable
- Covers main flow and edge cases
- Given/When/Then or checklist format

**4. Design/UX Linked** (if applicable)
- Figma link attached
- States (loading, error, empty, success) defined
- N/A explicitly stated if no UI changes

**5. Identified Dependencies**
- Database schema specifics (columns, types, relationships, migrations)
- API endpoint structure (method, path, payload, response, status codes)
- Feature flags, permissions, external services
- Blocking tickets identified

**6. QA Notes / Minimum Test Cases**
- Key flows documented
- Error states, validation, and edge cases covered
- Browser/device compatibility stated if applicable

**7. Documentation / Reference Links**
- Architecture decisions, API specs, similar implementations
- Error logs, monitoring dashboards
- Related PRs, Slack discussions

#### Detect implementation antipatterns (raise as questions, not blockers)

Flag these patterns and include alternatives in the report:

- **Hardcoded values** — IDs, status lists, approval workflows
- **Single approach with no alternatives** — no trade-offs considered
- **Fixed data structures** — tables with no extensibility path
- **Manual processes** — config file edits, developer-only changes
- **Role/permission assumptions** — hardcoded approval chains
- **Environment-specific logic** — hardcoded prod/dev behaviour

---

### Phase 4 — Generate validation report

**Formatting principles:**
- Verdict first — the READY TO DEV decision must be the first visible element
- Concise — one line per criterion in the scorecard
- Actionable — every failed criterion gets a concrete fix, not a description of what's wrong
- Scannable — developer or PO understands status in under 30 seconds
- Keep report under 80 lines of markdown (excluding Implementation Alternatives section)

Use this structure:

```markdown
# [TICKET-NUMBER]: [Summary]

## READY TO DEV: NO / CONDITIONALLY / YES

> **Task Type**: [Type] (Jira: [IssueType]) | **Required**: [X/Y] passed | **Recommended**: [X/Y] passed

**Task Classification**
Classified as **[Type]** because [brief reason]. Jira issue type: [IssueType].

**Quick Summary**
[One sentence on current state. When NO, state what needs refinement. When YES/CONDITIONALLY, summarise readiness.]

## Scorecard

| # | Criterion | Required? | Status | Gap |
|---|---|---|---|---|
| 1 | Context / Clear Objective | Required | PASS/FAIL | [One-line gap or —] |
| 2 | Defined Scope | Required | PASS/FAIL | [One-line gap or —] |
| 3 | Acceptance Criteria | Required | PASS/FAIL | [One-line gap or —] |
| 4 | Design/UX Linked | Required/N/A | PASS/FAIL/N/A | [One-line gap or —] |
| 5 | Dependencies | Required | PASS/FAIL | [One-line gap or —] |
| 6 | QA Notes / Test Cases | Required | PASS/FAIL | [One-line gap or —] |
| 7 | Documentation / Links | Recommended | PASS/FAIL | [One-line gap or —] |

## Before You Start (Must Address)
[Only when verdict is NO. Concrete technical actions per failed criterion.]

1. **#[N] Criterion name** — [Specific action]

## Warnings
[Only when Recommended gaps exist.]

1. [Criterion #] — [What's missing]

## Flags
[Only when notable risks exist outside the 7 criteria: no assignee, flagged comments, deadline pressure.]

## Next Steps
[Only when verdict is NO. Checklist of specific technical actions.]

- [ ] [Specific action]

## Questions to Ask
[Only when verdict is NO or CONDITIONALLY. Specific questions for BO/PO and developer.]

**For the BO/PO to consider:**
- [Question]

**For the developer to ask:**
- [Question]

## Implementation Alternatives to Consider
[Only when antipatterns detected in Phase 3.]

**Current approach**: [Summary]

**Alternative approaches:**

1. **[Name]**: [Description]
   - **Pros**: [Benefits]
   - **Cons**: [Drawbacks]
   - **When to use**: [Scenarios]

**Questions to guide the decision:**
- [Question]
```

---

## Australian English

All validation reports, comments, and questions must use Australian English spelling and vocabulary.
