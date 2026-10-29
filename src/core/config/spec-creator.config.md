# Spec Creator — Project Configuration

Optional settings for the `spec-creator` skill. When this file is absent or a key is empty, the skill runs in generic mode with the defaults shown.
Keep values as `key: value` lines so the skill can read them without a YAML parser.

---

## output

default_destination: markdown
markdown_path: .agent-runway/specs

## docs

Paths to project documentation used for silent context gathering (Phase 2). Remove a line to skip that source.

docs.entities: .agent-runway/docs/business/entities.md
docs.flows: .agent-runway/docs/business/flows.md
docs.schema: .agent-runway/docs/contracts/schema.md
docs.types: .agent-runway/docs/contracts/types.md
docs.api: .agent-runway/docs/contracts/api.md
docs.modules: .agent-runway/docs/architecture/modules.md
docs.decisions: .agent-runway/docs/architecture/decisions.md
docs.architecture: .agent-runway/docs/architecture/architecture.md

## codebase_scanning

codebase_scanning.enabled: false
codebase_scanning.source_root: src
codebase_scanning.stack:

## spec_templates

Stack scaffold templates are read from `.agent-runway/config/spec-templates/<stack>/spec-template.md` when present.

