---
name: ticket-creator
description: >-
  Creates ready-to-dev tickets from brief descriptions, Jira tickets, or
  markdown files. Combines PO and BA perspectives to generate complete tickets
  with context, scope, acceptance criteria, dependencies, and QA notes. Use
  when creating tickets, writing user stories, preparing backlog items, or
  refining requirements.
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

- Derive an **`implementation-slug`** (kebab-case, ASCII) from the epic title, feature name, or agreed solution name. Use it in every markdown filename — never ship only `spec.md`, `epic.md`, or anonymous `ticket.md`.
- **Epic** file: `.agent-runway/specs/proposed/<implementation-slug>/<implementation-slug>-epic.md`
- **Spec** (when originating from spec flow): same folder, `<implementation-slug>-spec.md` / `<implementation-slug>-summary.md` per `spec-creator` template.
- **Delivery tickets** (markdown): `task-<nn>-<implementation-slug>-<ticket-slice-slug>.md` with zero-padded `nn` (`01`, `02`, …). Place them in the same folder when they belong to that epic/spec bundle; otherwise default to `.agent-runway/docs/tickets/` with the same filename pattern.
- **Type line wording:** use `Feature (epic + N tickets)` — never "child tickets".

## 8-Phase Workflow

### Phase 0: Configuration Loading (Silent — No User Interaction)

**This phase runs silently before any user interaction. Do not report what was found until the Phase 7 summary.**

**Steps:**

1. **Check for project config** — look for `.cursor/config/ticket-creator.config.md`

2. **If config is found:**
   - Read and parse all sections: `project`, `personas`, `docs`, `codebase_scanning`, `output`, `agent_notes_gate`, `completeness`, `complexity`
   - Store as the **active configuration** for this session
   - All subsequent phases use values from active config instead of built-in defaults

3. **If config is not found — activate generic mode:**
   - `codebase_scanning.enabled` → `false`
   - `personas` → `[user, admin]`
   - `doc_paths` → `[]` (no docs to check)
   - `output.default_destination` → `markdown`
   - `output.markdown_path` → `./`
   - `agent_notes_gate.require_named_module` → `true`
   - `agent_notes_gate.require_constraint` → `false`
   - Ask the user before Phase 1 begins:

   ```
   Title: Project Setup

   Question: No project config found. What is your Jira project key?
   (e.g. MYPROJ, PROJ — or press skip to use markdown output only)
   ```

   ```
   Question: What is your Jira board URL?
   (e.g. your-org.atlassian.net — or press skip)
   ```

   Store any answers as the active configuration for this session.

   At Phase 7, append to the summary:
   > No config found — running in generic mode. Consider creating `.cursor/config/ticket-creator.config.md` for richer output and project-specific validation.

**Proceed to Phase 0.5.**

### Phase 0.5: Work Item Mode Gate

Before classification, confirm whether this should be handled as an **Epic** or a **Single Ticket**.

Use `AskQuestion`:

```
Title: Work Item Mode

Question: What do you want to create first?
Options:
  - epic: Create an epic with proposed tickets
  - ticket: Create one delivery ticket
  - auto: Let the agent decide based on complexity
```

Rules:
- **epic**: produce an epic-level artifact (goal, scope, non-goals, success criteria, dependencies) plus a proposed ticket breakdown; then ask whether to generate those markdown tickets now or stop at epic output. Save the epic using **Artefact naming** (`<implementation-slug>-epic.md`).
- **ticket**: proceed with normal ticket flow; if complexity threshold is exceeded, require a split proposal before final approval.
- **auto**: if complexity threshold is exceeded, switch to epic mode; otherwise continue in single-ticket mode.

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

2. **Derive `implementation-slug`** (kebab-case, ASCII) for markdown output per **Artefact naming**. Use the agreed solution or epic title, or reuse the folder slug when working inside `.agent-runway/specs/proposed/<implementation-slug>/`.

3. **Assess input richness**

   Evaluate whether the input contains enough context to generate a meaningful ticket. Do not ask the user about this — decide automatically.

   | Rich enough to generate directly | Too vague — ask first |
   |---|---|
   | Describes a specific user, action, or outcome | One sentence with no actor, outcome, or context |
   | Mentions a specific module, flow, or entity | Abstract description that could mean multiple things |
   | Includes a constraint, trigger, or business reason | No indication of why this is needed now |

   **If rich enough:** proceed directly to step 4 without asking anything.

   **If too vague:** ask a **maximum of 3** targeted questions before generating. Questions must use plain business language — no technical terminology. Use only the questions relevant to the task type:

   - **Feature**: Who is the user this affects? / What specific problem does this solve for them? / Is there any constraint or deadline driving this?
   - **Bug**: Where does the problem happen? (e.g. which screen, step, or process) / What did you expect to happen vs what actually happened?
   - **Task**: What is triggering this work now? / Is there a specific part of the system this affects?

   After receiving answers, proceed without asking anything further — generate with what you have.

4. **Improvement/Issue intake normalization**
   - If source is an issue, incident, or vague improvement request, extract:
     - current pain (symptom)
     - desired behavior/outcome
     - constraints and urgency
   - If solution space is still wide (multiple architecture or technology paths), stop ticket-only flow and propose `spec-creator` first.
   - If scope is already narrow and implementation-ready, continue with ticket generation.

5. **Classify task type**
   - Ask the user if not obvious from input:

   ```
   Title: Task Type

   Question: What type of ticket is this?
   Options:
     - feature: Feature — new functionality or enhancement
     - bug: Bug — defect in existing functionality
     - task: Task — technical or operational work (no new user-facing functionality)
   ```

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

**Generate a complete ticket using the appropriate template.**

Use the **Feature**, **Bug**, or **Task** template from [reference.md](reference.md#ticket-templates).

**Steps:**

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

   Narrative sections (context, user story, QA notes) may use free prose — they are for human readability only and are not parsed by downstream agents.

**Proceed to Phase 4.**

### Phase 4: Present & Refine

**Show the full ticket and iterate.**

**Steps:**

1. **Present the complete ticket** in markdown format with this framing message:

   > Here's your ticket. It's written for developers, so some sections may be more technical — focus on whether it captures what you need. Let me know if anything is missing or wrong.

2. **Ask the user to review:**

   ```
   Title: Ticket Review

   Question: How does this ticket look?
   Options:
     - approved: Looks good — proceed to validation
     - changes: I have changes — I'll describe them below
     - regenerate: Start over with different context
   ```

3. **If "changes"** — apply the user's feedback and re-present the updated ticket. Repeat until the user approves.

4. **If "regenerate"** — return to Phase 1 with the user's updated input.

**Proceed to Phase 5 when approved.**

### Phase 5: Completeness Check

**Check the ticket for completeness. Flag anything that would prevent a developer from starting work.**

Internally, apply the criteria from the `ticket-eval` skill — but never reference internal rule names, criteria numbers, or thresholds in user-facing output.

**Steps:**

1. **Run the completeness check silently** against the generated ticket

   Apply the gate defined in `agent_notes_gate.*` from active config. Only fields set to true are required for this project.
   - For technical work, **Proposed Solution Structure** must be present and consistent with scope; if missing, infer a minimal tree from scope and mark inferred content if config allows.

2. **If the ticket is complete:**

   Present to the user:
   > Your ticket is ready for development.

3. **If there are gaps — run the auto-fix loop:**
   - If the gap is unambiguous (e.g. missing QA notes that can be inferred from acceptance criteria) → fix it automatically
   - If the gap requires user input → ask **one focused question** (not a list)
   - Re-check after the fix
   - Maximum iterations defined by `completeness.auto_fix_max_iterations` in active config (default: 2)
   - If `completeness.mark_inferred_content: true` in active config, append ⚠️ _inferred — confirm with QA_ to any auto-generated content

4. **If still incomplete after 2 iterations:**

   Present the remaining gaps in plain language:
   > A few things to clarify before this is dev-ready:
   > - [plain language description of gap 1]
   > - [plain language description of gap 2]
   >
   > Want me to fill these in, or would you like to provide the details?

   Apply the user's response, then proceed without further iteration.

**Proceed to Phase 6.**

### Phase 5.5: Memory Sync (Automatic on Repeated Patterns)

After completeness check, detect repeated patterns from this ticket content and context.

Detection signals:
- same failure mode appears in multiple recent tickets (validation miss, integration mismatch, recurring bug class)
- same design doubt repeats across tickets/specs (alternative repeatedly rejected, assumption repeatedly failing)

When detected, write concise entries automatically:

1. Execution memory:
- append to `.agent-runway/memory/execution-memory.md`
- include: pattern type, where, trigger, consequence, next guardrail, linked artifact

2. Reasoning memory:
- append to `.agent-runway/memory/reasoning-memory.md`
- include: initial recommendation, counter-argument, alternatives, final choice, rule update

Rules:
- do not block ticket creation for memory writes
- avoid duplicates; if near-identical entry exists, update it instead of appending
- keep entries non-sensitive and implementation-relevant
- limit writes to max 1 execution-memory entry and max 1 reasoning-memory entry per ticket run

**Proceed to Phase 6.**

### Phase 6: Output

**Deliver the ticket to the user's preferred destination.**

**Steps:**

1. **Ask where to create the ticket:**

   ```
   Title: Ticket Output

   Question: Where should this ticket be created?
   Options:
     - jira: Create directly in Jira
     - markdown: Save as a markdown file
     - both: Create in Jira and save a local copy
   ```

2. **If Jira selected:**

   a. **Check Atlassian MCP availability.** If not connected, inform the user and fall back to markdown automatically.

   b. **Determine the Jira project key:**
      - Use `project.jira_project_key` from active config
      - If not set, ask the user as described in the Phase 0 generic mode fallback

   c. **Optional — epic link:** If the user mentioned an epic during the conversation (e.g. "this belongs under the onboarding epic"), offer to link it:

      ```
      Question: You mentioned the [epic name] epic. Want me to link this ticket to it?
      Options:
        - yes: Yes, link it
        - no: No, I'll do it manually
      ```

   d. **Create the issue** — set only: summary, description, issue type, and acceptance criteria. Do not attempt to set sprint, story points, or other fields automatically.

   e. Return the Jira ticket URL to the user.

3. **If markdown:**
   - Ask the user for the file path, or default to `.agent-runway/docs/tickets/task-<nn>-<implementation-slug>-<ticket-slice-slug>.md` (or under `.agent-runway/specs/proposed/<implementation-slug>/` when part of that bundle)
   - Save the ticket as a well-formatted markdown file

4. **Confirm output** — show the user where the ticket was created (Jira URL or file path)

**Proceed to Phase 7.**

### Phase 7: Summary

**Present a brief summary of what was created.**

```markdown
## Ticket Created

- **Type**: [Feature / Bug / Task]
- **Summary**: [ticket title]
- **Output**: [Jira URL / file path]
- **Status**: [Ready for development / Has open items]
- **Context sources**: [which docs were used, or "codebase scanned"]
- **Refinement rounds**: [number of iterations]
```

**Offer follow-up:**

> Would you like to create another ticket, or refine this one further?

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

The following conditions require a pause and a user decision before proceeding.

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

