# Decision Governance

This model separates two planes:

1. Execution plane: implement what is defined with quality gates.
2. Critical reasoning plane: challenge whether the selected solution is conceptually correct.

## Automatic Routing

Classify each request with four signals:
- impact: low/medium/high
- reversibility: reversible/hard-to-reverse/irreversible
- uncertainty: low/medium/high
- cost of error: low/medium/high

Then route:
- `express` or `fast-lead`: low risk and reversible
- `lead`: medium risk or multi-layer implementation
- `lead + contrarian gate`: high impact, hard-to-reverse, or high uncertainty

Simplicity-by-default rule:
- choose the smallest implementation that satisfies requirements
- new structural complexity requires explicit justification
- low-risk work must follow a short path (minimal gates/questions)

## Contrarian Gate Policy

Mandatory disagreement simulation for:
- architecture decisions
- domain behavior changes
- critical interface/contract changes
- high-risk migration paths

The contrarian gate runs as an **isolated agent** (`contrarian`) with a clean context window. This is intentional — the implementation agent accumulates bias toward its chosen approach during exploration; the contrarian agent has no access to that reasoning and can challenge it without anchoring effects.

Invoked via the `/contrarian Handoff` template. Output must include:
- strongest counter-argument (grounded in codebase evidence)
- viable alternative
- failure signals
- verdict: `Go`, `Go with conditions`, `Stop`

## Block vs Warn vs Execute

- High impact + irreversible + high uncertainty: block until contrarian verdict is approved.
- Medium risk: warn and require explicit approval.
- Low risk and reversible: execute with observability and follow-up.

## Improvement/Issue -> Spec/Ticket

Use this intake path:

1. Normalize source:
- symptom/pain
- desired outcome
- urgency/constraints

2. Decision:
- if solution space is broad or architectural: create spec first
- if scope is narrow and implementation-ready: create delivery ticket directly

3. If spec path:
- include options, trade-offs, and contrarian verdict
- derive ordered ticket slices from spec

4. If ticket path:
- include chosen approach and known alternatives
- tag decision risk for implementation gates

## Memory Feedback Loop

- Update execution memory after implementation or validation failures.
- Update reasoning memory after decision outcomes become visible in runtime.
- Promote repeated reasoning failures into new routing thresholds.
- Keep memory concise: deduplicate and cap writes per run to avoid noise.
