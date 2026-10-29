# Developer Profiles

Controls how the `lead` skill presents its approval gates. Profiles never remove checks — they only change whether a passing check interrupts the developer.

Set the active profile on the line below (`guided`, `standard`, or `autonomous`). If this file or the line is missing, `guided` is used.

active: guided

---

## Profiles

| Profile | Who it is for | Gate behaviour |
|---------|---------------|----------------|
| **guided** (default) | New team members, unfamiliar codebases, high-risk areas | Every gate (Phase 0 approach, Phase 1 scope, Phase 2 plan) blocks until the developer answers. Fast-track only when the developer asks for it. |
| **standard** | Developers who know the codebase | Phase 0 and Phase 2 block; Phase 1 proceeds automatically unless ambiguity is detected. Fast-track is the default for Standard tasks. |
| **autonomous** | Senior developers on well-understood work | Phases 0–2 validate silently and interrupt only on a risk signal, antipattern, or ambiguity. Fast-track is the default for Standard tasks. |

In every profile:

- The Phase 10 commit message always requires confirmation.
- Complex tasks always run the full workflow with Phase 0 architect delegation.
- A contrarian `Stop` verdict always halts the workflow.

For unattended execution with run logs, use the `autonomous-lead` skill instead of the `autonomous` profile.
