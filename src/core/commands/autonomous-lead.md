# Autonomous Lead

Read and follow the skill at `.cursor/skills/autonomous-lead/SKILL.md`.

Execute autonomously without interactive approval gates, but always persist decision logs in `.agent-runway/logs/autonomous-runs/` and create ADRs when architectural impact exists.
Apply internal risk scoring and enforce a mandatory contrarian gate for high-impact/high-uncertainty work before implementation starts. When the contrarian gate triggers, delegate to the `.cursor/skills/contrarian/SKILL.md` skill with a completed `/contrarian Handoff` — do not perform the contrarian review in the same context as implementation.
