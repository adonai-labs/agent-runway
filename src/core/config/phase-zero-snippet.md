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

**Proceed to Phase 1.**

