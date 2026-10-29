---
name: ticket-creator
description: Creates ready-to-dev tickets from brief descriptions, Jira tickets, or markdown files. Combines PO and BA perspectives to generate complete tickets with context, scope, acceptance criteria, dependencies, and QA notes. Use when creating tickets, writing user stories, preparing backlog items, or refining requirements.
---

# Ticket Creator

Creates development-ready tickets by combining Product Owner and Business Analyst perspectives. Takes a brief input and produces a structured, validated ticket.

## When to Use

- Creating a new ticket from a brief description
- Refining an existing Jira ticket or markdown requirement
- Preparing backlog items for development
- User says "create ticket", "write user story", "prepare requirement", "refine ticket"

## Supported Task Types

| Type | Description |
|---|---|
| **Feature** | New functionality or enhancement to existing behaviour |
| **Bug** | Defect in existing functionality |
| **Task** | Technical or operational work with no direct user-facing outcome (e.g. configuration change, dependency upgrade, refactor, infrastructure change) |

## Core Principles

Apply shared policy: [../shared/caveman-skill-engineering.md](../shared/caveman-skill-engineering.md)

1. **Start with a complete draft, refine from there** — no lengthy upfront questions
2. **Uses your project documentation automatically** — when available, docs enrich the ticket silently
3. **Covers the business case and the developer details** — both the "why" and the "how" in one ticket
4. **Checks the ticket is dev-ready before asking you to approve** — gaps are flagged early
5. **Works on any project** — adapts to your docs and codebase automatically
6. **Simple to use, technical when needed** — conversation stays in plain language; the ticket output is as detailed and technical as a developer needs
7. **Clarity over exhaustiveness** — a ticket that is easy to read and act on is better than one that is complete but overwhelming; leave out detail that does not help a developer start work
8. **A ticket is not a spec** — if a section is expanding into a design document, stop; capture the essential requirement and move the detail elsewhere
9. **Extensive detail belongs in subtasks or separate tickets** — if implementation steps, edge cases, or technical notes become lengthy, extract them into linked follow-up tickets rather than bloating the parent
10. **Suggest a split when complexity is high** — if the ticket spans multiple independent user-facing outcomes, requires work across more than two distinct system layers with no shared delivery milestone, or produces acceptance criteria that would reasonably take more than one sprint to verify, flag it and offer to split it before proceeding
11. **Prefer atomic implementation units** — ticket guidance should push decomposition into small single-purpose functions/modules, not one large multi-responsibility function

## Artefact naming (mandatory)

- Derive an **`implementation-slug`** (kebab-case, ASCII) from the epic title, feature name, or agreed solution name. The slug is the folder name; files inside use the canonical names from [../shared/artifact-writing-contract.md](../shared/artifact-writing-contract.md).
- **Epic**: `.agent-runway/specs/<implementation-slug>/epic.md`
- **Spec / summary** (spec flow): same folder, `spec.md` / `summary.md` per the `spec-creator` template.
- **Delivery tickets**: `.agent-runway/specs/<implementation-slug>/tickets/task-<nn>-<ticket-slice-slug>.md`, zero-padded `nn` (`01`, `02`, …). Always in the slug's `tickets/` subfolder — never next to spec files, in a separate `docs/tickets/` location, or as a bare `ticket.md`.
- **Type line wording:** use `Feature (epic + N tickets)` — never "child tickets".

## Asking Questions

"Ask" means a single-select question using the environment's question tool, or plain text with numbered options if none. Exact prompts are in [reference.md](reference.md#question-prompts).

## Workflow — Phases 0–7 (with 0.5 and 5.5)

### Phase 0: Configuration Loading (Silent — No User Interaction)

Runs silently; report findings only in the Phase 7 summary.

1. Read `{{config}}/ticket-creator.config.md`.
2. **If it has settings:** parse `project`, `personas`, `docs`, `codebase_scanning`, `output`, `agent_notes_gate`, `completeness`, `complexity` and use them as the **active configuration** instead of built-in defaults.
3. **If it is missing or empty:** activate generic mode with the defaults and the two optional setup questions in [reference.md](reference.md#generic-mode-setup-phase-0).

**Proceed to Phase 0.5.**

### Phase 0.5: Work Item Mode Gate

Ask whether to create an **epic**, a single **ticket**, or let the agent decide (**auto**):

- **epic**: produce an epic artifact (goal, scope, non-goals, success criteria, dependencies) plus a proposed ticket breakdown; then ask whether to generate those tickets now or stop at the epic. Save the epic per **Artefact naming**.
- **ticket**: normal ticket flow; if the complexity threshold is exceeded, require a split proposal before final approval.
- **auto**: switch to epic mode when the complexity threshold is exceeded; otherwise single-ticket mode.

**Proceed to Phase 1.**

### Phase 1: Input & Classification

Prerequisite: Phase 0 must have completed. Active configuration is available for this session.

**Accept one of three input types:**

| Input | How to handle |
|---|---|
| Sentence / brief description | Use as the seed for generation |
| Jira ticket key (e.g. `PROJ-123`) | Fetch via Atlassian MCP; use as seed |
| Markdown file path | Read the file; use contents as seed |

**Steps:**

1. **Determine input type and tag the origin**
   - If the user provides a Jira key and Atlassian MCP is available → fetch ticket details → tag as **existing**
   - If the user provides a file path → read the markdown file → tag as **existing**
   - Otherwise → treat the user's message as a brief description → tag as **new**

   The origin tag drives complexity detection behaviour in Phase 2 and Phase 3.

2. **Derive `implementation-slug`** (kebab-case, ASCII) for markdown output per **Artefact naming**. Use the agreed solution or epic title, or reuse the folder slug when working inside `.agent-runway/specs/<implementation-slug>/`.

3. **Assess input richness**

   Evaluate whether the input contains enough context to generate a meaningful ticket. Do not ask the user about this — decide automatically.

   | Rich enough to generate directly | Too vague — ask first |
   |---|---|
   | Describes a specific user, action, or outcome | One sentence with no actor, outcome, or context |
   | Mentions a specific module, flow, or entity | Abstract description that could mean multiple things |
   | Includes a constraint, trigger, or business reason | No indication of why this is needed now |

   **If rich enough:** proceed directly to step 4 without asking anything.

   **If too vague:** ask at most **3** targeted questions in plain business language, using the per-type questions in [reference.md](reference.md#question-prompts). Then generate with what you have.

4. **Improvement/Issue intake normalization**
   - If source is an issue, incident, or vague improvement request, extract:
     - current pain (symptom)
     - desired behavior/outcome
     - constraints and urgency
   - If solution space is still wide (multiple architecture or technology paths), stop ticket-only flow and propose `spec-creator` first.
   - If scope is already narrow and implementation-ready, continue with ticket generation.

5. **Classify task type** (Feature / Bug / Task) — ask only if not obvious from the input.

6. **For Bugs — gather error context**
   - Ask the user to describe the error or what they believe is failing
   - Reproduction steps are **optional** — offer to capture them if the user wants to reproduce in real time, but do not require them

**Proceed to Phase 2.**

### Phase 2: Context Gathering (Silent — No User Interaction)

**This entire phase runs silently. Do not ask the user any questions. Do not show the user what was found. Context sources are reported only in the Phase 7 summary.**

Apply the **Minimum context** rule from shared policy; gather only evidence needed to produce a reliable ticket.

See [reference.md](reference.md#context-discovery) for the full discovery table and codebase scanning patterns.

**Steps:**

1. **Check for project docs** — use the doc paths defined in `docs.*` from the active configuration loaded in Phase 0. If a path is not defined in config, skip it silently.

2. **Read docs that exist** — extract relevant context for the ticket's domain area

3. **If docs are missing** — if codebase scanning is enabled (`codebase_scanning.enabled: true` in active config), use the paths and stack defined in `codebase_scanning.*`. If scanning is disabled or config is not loaded, skip this step and proceed with whatever context was gathered from docs.

4. **If context cannot be found** through docs or codebase, proceed to Phase 3 with whatever was gathered. Use best judgement to fill gaps. Missing context results in a less specific ticket, which the user can refine in Phase 4.

5. **Complexity pre-check — existing tickets only** (origin tag = **existing**)

   After reading the full ticket content, evaluate scope before generating anything:

   Thresholds are defined in `complexity.*` from the active configuration. Use those values; the table below shows the defaults.

   | Signal | Threshold |
   |---|---|
   | Multiple independent user-facing outcomes | 2 or more |
   | Acceptance criteria sets with no shared delivery milestone | 2 or more |
   | Distinct system layers touched with separate owners | More than 2 |
   | Estimated size implied by content | More than one sprint |

   - **If any threshold is met:** raise the concern immediately, before Phase 3. Present a proposed split with a one-line description of each ticket. Ask the user whether to proceed as one ticket or split. Do not generate a draft until the user decides.
   - **If no threshold is met:** proceed to Phase 3 silently.

   For **new** tickets, skip this step — complexity is assessed after generation in Phase 3, Step 5.

**Proceed to Phase 3.**

### Phase 3: Ticket Generation

Generate a complete ticket with the **Feature**, **Bug**, or **Task** template ([template.md](template.md)).

1. **Apply the PO/BA hybrid lens:**

   | Perspective | Focus |
   |---|---|
   | PO | Business value, user impact, priority rationale, "why this matters" |
   | BA | Detailed requirements, acceptance criteria, edge cases, dependencies, data specifics |

2. **Generate each section:**

   | Section | Feature | Bug | Task |
   |---|---|---|---|
   | Summary (title) | Yes | Yes | Yes |
   | Context / objective (what & why) | Yes | Yes | Yes |
   | User story (As a / I want / So that) | Yes | No | No |
   | Error description (what's failing) | No | Yes | No |
   | Expected vs actual behaviour | No | Yes | No |
   | Defined scope (includes / excludes) | Yes | Yes | Yes |
   | Proposed Solution Structure (folder/file tree) | Yes | Yes | Yes |
   | Acceptance criteria | Yes (Given/When/Then) | Yes (Given/When/Then) | Yes ("done when" criteria) |
   | Design/UX links | If UI | If UI | No |
   | Dependencies (APIs, schema, migrations) | Yes | Yes | Yes |
   | QA notes / test cases | Yes | Yes | Minimal — regression risk |
   | Documentation / links | Recommended | Recommended | If config/infra changes |

3. **Enrich with domain context** from Phase 2:
   - Reference correct entity names, relationships, lifecycles from `entities.md`
   - Align acceptance criteria with existing user flows from `flows.md`
   - Include accurate schema details from `schema.md` (column names, types, constraints)
   - Note affected modules from `modules.md`
   - Flag any relevant ADRs from `decisions.md`

4. **For Bugs — include environment context if available:**
   - Where the error occurs (module, process, UI component)
   - Error messages or log output the user provided
   - Reproduction steps only if the user supplied them

5. **Apply the clarity and scope rules:**
   - Keep each section to what a developer needs to start work — cut anything decorative or speculative
   - Apply [../shared/narrative-delivery-policy.md](../shared/narrative-delivery-policy.md): every new ticket should have a short Context → Intent → Expected behavior → Evidence plan → Remaining work narrative.
   - Apply [../shared/test-driven-delivery-policy.md](../shared/test-driven-delivery-policy.md): clarify the expected behaviour and evidence plan before implementation details.
   - If any section (especially acceptance criteria or QA notes) is growing into a design document, trim it and note "further detail to be captured in subtasks"
   - **New tickets only:** after drafting, apply the complexity thresholds from Phase 2, Step 5.
     - If work-item mode is `ticket` and threshold is exceeded, require split options before final approval.
     - If work-item mode is `epic`, convert this output into ticket candidates and ask which ticket file(s) to generate next (use **Artefact naming**).
     - If work-item mode is `auto`, switch to epic behavior when threshold is exceeded.
   - **Existing tickets:** complexity was already evaluated in Phase 2. If the user chose to proceed as one, do not raise it again here.

6. **Enforce agent-readable structure:**

   The following sections must always use a consistent, parseable format regardless of ticket type. These are consumed downstream by the `lead` and `ticket-eval` skills:

   | Section | Required format |
   |---|---|
   | Acceptance criteria | `Given / When / Then` — one scenario per block, no free prose |
   | Scope (includes / excludes) | Flat bullet lists — no paragraphs |
   | Dependencies | Named items with type: `API:`, `Schema:`, `Service:`, `Migration:` |
   | Done criteria (Tasks) | Flat checklist — `- [ ] item` format |

   Narrative sections (source intake, narrative, user story, QA notes) may use free prose — they are for human readability only and are not parsed by downstream agents.

**Proceed to Phase 4.**

### Phase 4: Present & Refine

Present the complete ticket with: "Here's your ticket. It's written for developers, so some sections may be more technical — focus on whether it captures what you need." Then ask for review (approved / changes / regenerate). On **changes**, apply feedback and re-present until approved; on **regenerate**, return to Phase 1 with the updated input.

**Proceed to Phase 5 when approved.**

### Phase 5: Completeness Check

Flag anything that would stop a developer from starting work. Silently apply the `ticket-eval` criteria ([reference.md](reference.md#validation-integration)) — never expose internal rule names, criteria numbers, or thresholds to the user.

1. Apply the gate in `agent_notes_gate.*` from active config (only fields set to true are required). For technical work, **Proposed Solution Structure** must be present and consistent with scope; if missing, infer a minimal tree and mark it inferred when config allows.
2. Complete → "Your ticket is ready for development."
3. Gaps → auto-fix loop: fix unambiguous gaps automatically (e.g. QA notes inferable from acceptance criteria); for gaps needing input ask **one focused question**; re-check. Max iterations: `completeness.auto_fix_max_iterations` (default 2). If `completeness.mark_inferred_content: true`, append ⚠️ _inferred — confirm with QA_ to auto-generated content.
4. Still incomplete after the max → list remaining gaps in plain language and ask whether to fill them in or have the user provide details; apply the answer and move on.

### Phase 5.5: Memory Sync (Repeated Patterns Only)

Apply the automatic-sync rule in [../shared/memory-policy.md](../shared/memory-policy.md): write only when the same signal appears in this ticket **and** in earlier tickets/specs or memory; at most two entries per run, one lesson per file; never block ticket creation.

- Repeated failure mode (validation miss, integration mismatch, recurring bug class) → one entry in `.agent-runway/memory/execution-memory.md`: pattern, where, trigger, consequence, next guardrail, linked artifact.
- Repeated design doubt (alternative repeatedly rejected, assumption repeatedly failing) → one entry in `.agent-runway/memory/reasoning-memory.md`: initial recommendation, counter-argument, alternatives, final choice, rule update.

Report memory writes in the Phase 7 summary.

### Phase 6: Output

Ask where to create the ticket (jira / markdown / both), then follow the output steps in [reference.md](reference.md#output-steps-phase-6): Jira via Atlassian MCP with markdown fallback, or markdown at `.agent-runway/specs/<implementation-slug>/tickets/task-<nn>-<ticket-slice-slug>.md`. Confirm where it was created.

### Phase 7: Summary

Present the summary template from [reference.md](reference.md#summary-template-phase-7) and offer to create another ticket or refine this one.

## Integration with Other Skills

```
ticket-creator (create & validate ticket)
      ↓ (ticket ready for dev)
        lead (build the feature)
      ↓ (code written)
   code-review (validate the code)
```

- `ticket-creator` produces the input that `lead` consumes
- `ticket-eval` is the shared quality gate between ticket creation and development

## Red Flags

These conditions require a pause and a user decision before proceeding.

| Condition | When to raise | Action |
|---|---|---|
| Requirement is too vague to produce meaningful content | Phase 1, before anything | Ask up to 3 targeted questions |
| Input contradicts an existing architectural decision (`decisions.md`) | Phase 2, after context gathering | Stop; surface the conflict with the ADR reference; ask how to proceed |
| Scope spans multiple tickets — **existing ticket** | Phase 2, Step 5 (complexity pre-check) | Stop before generating; present proposed split; wait for user decision |
| Scope spans multiple tickets — **new ticket** | Phase 3, after drafting | Present draft with split suggestion appended; let user decide without stopping |
| Feature duplicates existing functionality (`flows.md` or codebase) | Phase 2 or Phase 3 | Surface the duplicate; ask whether to proceed as a new ticket, extend the existing one, or cancel |

**For conditions that require stopping:** do not proceed to the next phase until the user responds.

## Additional Resources

- For context discovery details, templates, and codebase scanning patterns, see [reference.md](reference.md)
- Narrative delivery policy: [../shared/narrative-delivery-policy.md](../shared/narrative-delivery-policy.md)
- Test-driven delivery policy: [../shared/test-driven-delivery-policy.md](../shared/test-driven-delivery-policy.md)

