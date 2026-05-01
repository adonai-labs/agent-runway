# Complexity Signals — When and Where to Refactor

Not all complex code needs refactoring. This file helps decide **when** refactoring is justified, **where** to focus effort, and **when to stop**.

---

## When to Refactor

Refactor when the code creates **measurable friction** in one of these areas:

| Signal | Symptom | Refactoring justified? |
|--------|---------|----------------------|
| Change amplification | A small requirement change touches 5+ files | Yes — reduce coupling |
| Cognitive load | New team members cannot understand the code without a walkthrough | Yes — improve naming, extract methods |
| Unknown unknowns | Changes cause unexpected failures elsewhere | Yes — clarify boundaries, add tests |
| Test brittleness | Tests break on internal refactors, not behaviour changes | Yes — test behaviour, not implementation |
| Bug clustering | Same area produces repeated defects | Yes — simplify, add invariants |
| Velocity decay | Feature delivery slows in a specific area | Investigate first — may be complexity or may be unclear requirements |

---

## When NOT to Refactor

| Situation | Reason to leave it |
|-----------|-------------------|
| Code works, is tested, and rarely changes | Stable code has earned its shape |
| Code will be replaced soon | Refactoring disposable code is waste |
| The only justification is "it's not how I'd write it" | Style preference is not a refactoring driver |
| The refactoring requires changing a public API contract | That is a breaking change, not a refactoring |
| No tests exist and writing characterisation tests is prohibitively expensive | Risk of silent behaviour change is too high |

---

## Complexity Indicators

### Structural Signals (Detectable by Search)

| Indicator | Threshold | Detection |
|-----------|-----------|-----------|
| Class line count | > 300 lines | File length scan |
| Method line count | > 30 lines | Manual review or static analysis |
| Constructor parameters | > 5 injected dependencies | Search for constructors |
| Nesting depth | > 3 levels | Indentation scan |
| Cyclomatic complexity | > 10 per method | Static analysis tooling (`dotnet-counters`, SonarQube) |
| Fan-out (number of types used) | > 8 distinct types in one method | Manual review |
| Number of public methods on a class | > 10 | Signal of multiple responsibilities |

### Behavioural Signals (Detectable by Observation)

| Indicator | What it looks like |
|-----------|-------------------|
| Shotgun surgery | Every feature touches the same 5 files |
| Divergent change | One class is modified for unrelated reasons |
| Parallel inheritance hierarchies | Adding a subclass always requires adding another subclass elsewhere |
| Speculative generality | Abstractions exist with one implementation and no variation |
| Dead code | Methods, classes, or branches that are never executed |

---

## Prioritisation — Where to Focus

Not all smells have equal cost. Prioritise based on **change frequency** and **defect risk**:

```
High priority:    Smells in code that changes frequently
Medium priority:  Smells in code that will change soon (upcoming feature)
Low priority:     Smells in stable code that rarely changes
Do not touch:     Smells in code scheduled for replacement
```

### The Hotspot Heuristic

```powershell
# Find files changed most frequently (last 6 months)
git log --since="6 months ago" --name-only --pretty=format: -- "*.cs" | Sort-Object | Group-Object | Sort-Object Count -Descending | Select-Object -First 20 Count, Name
```

Files that change frequently **and** have high complexity are the highest-value refactoring targets.

---

## Deciding the Refactoring Scope

### Micro (minutes to hours)
- Rename a variable or method
- Extract a helper method
- Add guard clauses to flatten nesting
- Replace a magic number with a named constant

### Targeted (hours to a day)
- Extract a class from a god class
- Introduce a value object for a primitive
- Move behaviour from a service to an entity
- Replace a switch-on-type with a strategy

### Structural (days — requires planning)
- Decompose a module into separate bounded contexts
- Introduce a new layer or boundary
- Replace inheritance hierarchy with composition
- Move from anemic to rich domain model

**Rule:** Start at micro and escalate only if the problem persists. Most refactorings are micro or targeted. If you find yourself planning a structural refactor, use the `architect` skill to validate the design before proceeding.

---

## Knowing When to Stop

Stop refactoring when:

- [ ] The stated goal from Step 1 of the workflow is met
- [ ] Tests pass and no behaviour has changed
- [ ] The code is easier to understand and change than before
- [ ] Further changes would introduce new abstractions without clear pressure
- [ ] The remaining smells are in stable code that does not need to change soon

Refactoring beyond the goal is scope creep. Commit, move on, and revisit when the next change creates friction.
