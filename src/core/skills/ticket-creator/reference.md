# Ticket Creator — Reference

Detailed reference material for the ticket-creator skill. Read sections as needed during each phase.

---

## Context Discovery

### Doc Discovery Table

Doc paths are defined in `docs.*` from the active configuration loaded in Phase 0. The table below shows the default paths and what to extract from each. If a path is not present in active config, skip that row silently.

| Config key | Default path | What to extract | Used for |
|---|---|---|---|
| `docs.entities` | `.agent-runway/docs/business/entities.md` | Entity names, attributes, relationships, lifecycles, statuses | Correct domain terminology in ticket content |
| `docs.flows` | `.agent-runway/docs/business/flows.md` | User journeys, steps, triggers, end states, edge cases | Writing acceptance criteria aligned with existing patterns |
| `docs.schema` | `.agent-runway/docs/contracts/schema.md` | Table names, column names, data types, constraints, foreign keys | Accurate dependency section (schema details, migrations) |
| `docs.types` | `.agent-runway/docs/contracts/types.md` | TypeScript interfaces, shared types, enums | Correct type references in technical details |
| `docs.api` | `.agent-runway/docs/contracts/api.md` | API endpoints, request/response structures | Dependency section (API contracts) |
| `docs.modules` | `.agent-runway/docs/architecture/modules.md` | Module names, process boundaries, ownership | Identifying affected modules and cross-cutting concerns |
| `docs.decisions` | `.agent-runway/docs/architecture/decisions.md` | ADRs with rationale and rejected alternatives | Flagging approaches that contradict architectural decisions |
| `docs.architecture` | `.agent-runway/docs/architecture/architecture.md` | Tech stack, process model, high-level structure | Grounding technical details in the correct technologies |

### Discovery Process

1. Read `docs.*` from active config to get the paths to check
2. For each path defined in config, check if the file exists using `Glob`
3. Read only the docs relevant to the ticket's domain area — do not read everything
4. Prioritise by ticket type:
   - Feature affecting the database → `docs.schema`, `docs.entities`, `docs.modules`
   - Bug in the UI → `docs.flows`, `docs.modules`, `docs.architecture`
5. If a config key is not defined, skip it — do not fall back to the default path automatically
6. Note which docs were read — report in Phase 7 summary

---

## Codebase Scanning Fallbacks

When project docs are missing or incomplete, scan the codebase to gather equivalent context.

Codebase scanning is only available when `codebase_scanning.enabled: true` in active config. If disabled, skip this section entirely and proceed to Phase 3 with whatever context was gathered from docs.

When enabled, use `codebase_scanning.source_root` as the base path for all patterns below (default: `src` if not set in config), and `codebase_scanning.stack` to determine which patterns are most relevant. The patterns listed in each subsection are defaults — adapt them to the stack defined in config.

### Entity and Type Discovery

Adapt paths to `codebase_scanning.source_root` and `codebase_scanning.type_paths` from active config. Default patterns:

```
Glob: {source_root}/**/types/**/*.ts
Glob: {source_root}/**/interfaces/**/*.ts
Glob: {source_root}/common/types/**/*.ts
Grep: "export interface" or "export type" in {source_root}/
```

Extract: entity names, field names, relationships from type definitions.

### Database Schema Discovery

```
Glob: {source_root}/**/migrations/**/*.ts
Glob: {source_root}/**/migrations/**/*.sql
Glob: {source_root}/**/repositories/**/*.ts
Grep: "CREATE TABLE" or "ALTER TABLE" in {source_root}/
Grep: "db.prepare" or "database" in {source_root}/
```

Extract: table names, column names, data types from migration files or repository queries.

### Module and Architecture Discovery

```
Read: package.json (dependencies, scripts → tech stack)
Read: tsconfig.json (paths → module aliases)
Glob: {source_root}/**/ (top-level module structure)
```

For stack-specific process boundaries (e.g. main/renderer in Electron), check `codebase_scanning.stack` in active config and apply the relevant pattern. Do not assume Electron process separation unless the stack is explicitly set to `electron-*`.

### Flow and Journey Discovery

```
Glob: {source_root}/**/components/**/*.tsx
Glob: {source_root}/**/hooks/**/*.ts
```

For Electron stacks (`codebase_scanning.stack: electron-*`), also apply:

```
Grep: "ipcRenderer.invoke" in {source_root}/ (IPC calls → features)
Grep: "ipcMain.handle" in {source_root}/ (IPC handlers → capabilities)
```

Extract: existing features, user-facing components, IPC channels.

### API and Contract Discovery

```
Glob: {source_root}/**/api/**/*.ts
Grep: "fetch\\(" or "axios" in {source_root}/
Grep: "endpoint" or "baseUrl" in {source_root}/
```

Extract: API endpoints, request patterns, external integrations.

---

## Ticket Templates

See [`template.md`](template.md) for the full template definitions (Feature, Bug, Task) and a worked example using PROJ-201 (Email Notifications for Order Status Changes).

---

## Section Writing Guidelines

### Context / Objective
- **PO lens**: Why does this matter to the business? What value does it deliver?
- **BA lens**: What exactly needs to change? What problem is being solved?
- Avoid vague statements like "improve the system" — be specific about the change and its impact

### User Story
- Use the standard format: As a / I want / So that
- The role should be a real persona from the project (e.g. "geologist", "project manager"), not "user"
- The benefit should describe business value, not restate the feature

### Defined Scope
- **Includes**: List specific, concrete items — not vague categories
- **Excludes**: Explicitly name related items being deferred — this prevents scope creep during implementation
- **Approach rationale**: Explain why this approach over alternatives, especially for hardcoded values or fixed workflows

### Acceptance Criteria
- Use Given/When/Then format for each criterion
- Cover: happy path, validation errors, error states, edge cases
- Each criterion must be independently verifiable — QA should be able to write a test from it
- Reference existing flows from `flows.md` where the new behaviour intersects

### Dependencies
- **Be specific**: "Projects.selected_attributes (JSONB) with structure `{attributeId: string, enabled: boolean}`" not "saves to Projects table"
- **Include migrations**: If schema changes, note the migration needed
- **Include IPC channels**: If main/renderer communication changes, note the channel and payload
- Reference schema details from `schema.md` when available

### QA Notes
- Provide concrete test scenarios, not "test that it works"
- Include steps and expected results
- Cover at least: happy path, one validation error, one error state, one edge case

---

## Validation Integration

After generating the ticket, the skill runs the `ticket-eval` rule (`.cursor/rules/ticket-eval.mdc`) as a self-check.

### How to Trigger Validation

1. Save the ticket content as markdown (either the output file or a temporary buffer)
2. Validate against the 7 criteria from the rule:
   - Context / Clear Objective
   - Defined Scope
   - Acceptance Criteria
   - Design/UX Linked
   - Dependencies
   - QA Notes / Test Cases
   - Documentation / Links
3. Apply task type profiles (Feature, Bug, or Task) to determine which criteria are Required vs Recommended
4. Generate the validation verdict: Ready / Conditionally ready / Needs refinement

### If Validation Fails

- Identify specific gaps from the scorecard
- Offer to fix automatically (using context from Phase 2) or ask the user for missing details
- Re-validate after fixes
- Do not proceed to output until at least "Conditionally ready"

---

## Jira Output via MCP

When creating tickets in Jira via the Atlassian MCP:

### Field Mapping

| Ticket section | Jira field |
|---|---|
| Summary | Summary |
| Type | Issue Type (Story, Bug, or Task) |
| Context + User Story + Scope + AC + Dependencies + QA Notes | Description (formatted as markdown) |
| Acceptance criteria | Can also be set in a custom field if the project uses one |
| Affected modules | Labels or Components (project-dependent) |

### MCP Tools to Use

- `jira_create_issue` — create the ticket
- `jira_get_issue` — fetch existing ticket details (Phase 1 input)

### Fallback

If the Atlassian MCP is not connected or the create call fails, fall back to markdown output and inform the user.

---

## Markdown artefact naming

Follow **Artefact naming** in `SKILL.md`: every saved markdown ticket or epic uses `implementation-slug` and the `task-<nn>-...` pattern — never a bare `ticket.md` or `[summary-slug].md` without the solution name.


