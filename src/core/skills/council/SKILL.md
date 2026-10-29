---
name: council
description: Preview skill for council review of an idea, hypothesis, or implementation direction from multiple perspectives before turning it into a spec, ticket, ADR, or code change. Use when the developer says "council", "idea review", "validate this idea", "review this hypothesis", "should we build this", "implementation validation", or asks for product, engineering, architecture, risk, adoption, and contrarian perspectives.
standalone: true
---

# Council

## Invoke Skill

```text
@council <idea, hypothesis, or implementation direction>
```

Examples:
- `@council should we add workspace memory to the Lite preset?`
- `@council hypothesis: users want checkpoints more than full specs`
- `@council validate this implementation approach before I code it`

This skill is preview. Keep the output useful and compact; expect the exact format to evolve as real usage exposes better lenses.

---

## What this skill does

Runs a lightweight multi-perspective review before the work becomes a spec, ticket, ADR, or implementation.

Use it to decide whether to pursue, refine, pause, or reject an idea. Do not use it as a replacement for the `code-review`, `architect`, `spec-creator`, or `lead` skills.

---

## Workflow

### 1. Capture the proposition

Restate the idea in one sentence.

If the proposition is too vague to evaluate, ask at most one clarifying question. Otherwise, state assumptions and continue.

Classify the input as one of:

| Type | Meaning |
|---|---|
| Idea | A possible feature, workflow, product change, or user-facing capability |
| Hypothesis | A belief that needs evidence before investment |
| Implementation | A proposed technical path or design direction |

### 2. Review through six lenses

Evaluate only what can be inferred from the provided context and observable project state.

| Lens | Question |
|---|---|
| Product | Does this solve a real user problem or sharpen positioning? |
| Engineering | Is the complexity proportional to the expected value? |
| Architecture | Does it fit the system shape without locking in a bad abstraction? |
| Risk/Security | What could break, leak, confuse, or create unsafe behavior? |
| Adoption | Will target users understand when and how to use it? |
| Contrarian | What is the strongest reason not to do it? |

### 3. Return a verdict

Use exactly one:

- **Pursue**: valuable, clear enough, and low enough risk to proceed
- **Refine**: promising, but scope or behavior must be sharpened first
- **Pause**: not enough evidence yet; run an experiment or gather signal
- **Reject**: likely not worth building or actively harmful to the product

Set confidence as **Low**, **Medium**, or **High**. Do not invent numeric precision.

### 4. Define the smallest useful experiment

Recommend the smallest test that can validate or falsify the idea:

- a preview skill
- a README example
- a manual workflow
- a single test case
- a prototype behind explicit preview language
- a user interview or usage observation

Prefer reversible experiments over permanent architecture.

### 5. Persist only when asked

By default, do not write files.

If the developer asks to save, persist, document, or log the council review, write it to:

`.agent-runway/logs/council/YYYY-MM-DD-<slug>.md`

Use the artifact contract in [../shared/artifact-writing-contract.md](../shared/artifact-writing-contract.md). The saved file must end with the verdict block below.

Do not write to memory automatically ([../shared/memory-policy.md](../shared/memory-policy.md)). If the review produced a durable lesson, suggest the `learning` skill.

---

## Output Format

```md
# Council Review: <short title>

Status: Preview
Type: Idea | Hypothesis | Implementation
Verdict: Pursue | Refine | Pause | Reject
Confidence: Low | Medium | High

## Proposition

<One-sentence restatement.>

## Assumptions

- <Assumption, or "None">

## Lens Review

| Lens | Assessment |
|---|---|
| Product | <signal> |
| Engineering | <signal> |
| Architecture | <signal> |
| Risk/Security | <signal> |
| Adoption | <signal> |
| Contrarian | <signal> |

## Decision

<Direct recommendation and why.>

## Smallest Useful Experiment

- <Concrete experiment>

## Before You Build

- <Check, user signal, test, or artifact needed before implementation>
```

Always end the output with this block, filled in (schema: [../shared/verdict-block.md](../shared/verdict-block.md)):

```yaml
# agent-runway:verdict
gate: council
status: [pursue | refine | pause | reject]
blocking: [0 when pursue; otherwise the number of "Before You Build" items that must resolve first, minimum 1]
date: [YYYY-MM-DD]
artifact: [idea slug, or the spec/ticket path the idea relates to]
```

---

## Routing

Invoke skills as `/<skill>` (Claude Code, slash commands) or `@<skill>` (Cursor / VS Code skill mentions).

**Mode check:** `spec-creator`, `lead`, and `architect` exist only in Structured mode. Before routing to one, check whether its folder is installed next to this skill (`../<skill>/SKILL.md`). If it is not, the project is in Lite mode — use the Lite route, or suggest `npx agent-runway upgrade --to structured`.

| Situation | Structured route | Lite route |
|---|---|---|
| **Pursue**, small change | `express` | `express` |
| **Pursue**, multi-step change | `spec-creator`, then `lead` | `express` in small slices with `safety-check` before risky steps, or upgrade |
| Core issue is a design trade-off | `architect` | Run `council` again with the competing options as the proposition, or upgrade |
| Durable project knowledge | `learning` (ask first) | `learning` (ask first) |
| Work already implemented | `code-review` | `code-review` |

Keep the review direct. The council should improve judgment, not create ceremony.
