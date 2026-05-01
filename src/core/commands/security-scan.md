# Security Scan

Run the critical security search categories from `.cursor/skills/code-review/systematic-searches.md` (categories 1–11).

Before executing, check whether `.cursor/config/review-config.md` exists. If it does, skip any category marked as `disabled`. If it does not exist, run all 11 critical categories.

For each category, document: pattern searched, match count, and file locations. Perform semantic analysis on every match to determine whether it is a genuine risk or contextually acceptable.

Report findings using the severity classification from Phase 4 of `.cursor/skills/code-review/SKILL.md`.
