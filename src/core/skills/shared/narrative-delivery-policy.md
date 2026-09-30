# Narrative Delivery Policy

Use this policy when creating tickets, planning implementation, writing commits, preparing pull requests, checkpointing work, or saving project memory.

## Purpose

Delivery artifacts should tell a short technical story:

1. why the work exists
2. what changed
3. what evidence proves it is safe
4. what remains open

This is not decorative writing. The story must make future review, resume, audit, and graph-context retrieval easier.

## Narrative Arc

Use this arc for medium or large work:

- **Context**: the problem signal, user need, incident, request, or prior decision that triggered the work
- **Intent**: the outcome the change is trying to create
- **Change**: the implementation step, behavior change, or decision made
- **Evidence**: tests, checks, review, logs, screenshots, metrics, or source references that prove the change
- **Remaining work**: explicit risks, follow-ups, deferred scope, or unresolved questions

For small work, compress the arc into one or two sentences. Do not add ceremony when a direct explanation is enough.

## Tickets

Tickets should explain why the work exists before listing implementation details.

Include enough narrative for a developer or agent to understand:

- the problem signal
- the intended outcome
- the expected observable behavior
- the evidence plan

Keep acceptance criteria structured and testable. Narrative sections may use prose; acceptance criteria, scope, dependencies, and done criteria must stay parseable.

## Commits

Each commit should represent one coherent step in the implementation story.

Prefer:

- preparatory refactor
- behavior change
- test coverage
- documentation or configuration update

Avoid broad commits that mix unrelated motivations.

Commit body should explain what changed and why. It does not need to repeat the diff.

## Pull Requests

A pull request is the complete chapter. It should connect:

- Problem
- Approach
- What changed
- Validation
- Risks or follow-ups

If a PR intentionally mixes concerns, explain why so reviewers can follow the story without reconstructing intent from the diff.

## Checkpoints and Run Logs

Checkpoints and run logs should preserve the current point in the story:

- current context
- current intent
- changes completed
- evidence gathered
- next step

Do not claim validation that has not been run.

## Memory

Memory entries should preserve reusable lessons as narrative facts:

- signal observed
- lesson learned
- source evidence
- future trigger

This makes entries useful for later graph/context retrieval without saving full session transcripts.

## Constraints

- Keep narrative factual, brief, and sourceable.
- Do not write marketing prose.
- Do not hide uncertainty; name it.
- Do not include secrets, private incident details, or customer data.
- Do not let storytelling override structured acceptance criteria, tests, or review evidence.
