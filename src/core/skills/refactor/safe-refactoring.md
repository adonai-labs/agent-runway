# Safe Refactoring — Incremental Change with Confidence

Core principle: **change structure, not behaviour**. Every step must be verifiable.

---

## Before You Touch Anything

### 1. Establish the Safety Net

If tests exist:
- Run them. They must all pass before you start.
- Note which tests cover the code you plan to change.

If tests do **not** exist:
- Write **characterisation tests** first — tests that document the current behaviour, even if it seems wrong.
- A characterisation test asserts what the code actually does, not what it should do.
- These tests protect against unintentional behaviour changes during refactoring.

```csharp
// Characterisation test — captures existing behaviour
[Fact]
public async Task PlaceOrder_WithEmptyLines_ThrowsInvalidOperation()
{
    var handler = CreateHandler();
    var command = new PlaceOrderCommand(Guid.NewGuid(), []);

    var act = () => handler.HandleAsync(command, CancellationToken.None);

    await act.Should().ThrowAsync<InvalidOperationException>()
        .WithMessage("No items");
}
```

### 2. Assess Blast Radius

Before refactoring, understand the impact surface:

- **Who calls this code?** Search for usages of the class, method, or interface.
- **Who depends on the public contract?** If the type is public, consumers may break.
- **Does it cross a layer boundary?** Refactoring a domain entity affects everything above it.
- **Is this code deployed behind a contract?** APIs, events, and message schemas are not internal refactoring targets.

```powershell
# Find all callers of a type
rg "OrderService" --type cs -l

# Find all implementations of an interface
rg ": IOrderRepository" --type cs
```

### 3. Define the Goal

Name the specific problem you are solving:
- "This class has 4 responsibilities — I am extracting validation into its own class."
- "This method is 80 lines — I am extracting 3 named helper methods."
- "Business logic is in the handler — I am moving the invariant to the entity."

Do not refactor without a stated goal. "Make it cleaner" is not a goal.

---

## During Refactoring

### One Change at a Time

Each step should be:
1. A single, nameable refactoring operation (Extract Method, Move Method, Introduce Parameter Object, etc.)
2. Verifiable by running tests immediately after
3. Committable on its own — `refactor(<scope>): <what you did>`

### The Incremental Loop

```
1. Make one structural change
2. Run tests → must pass
3. Review the change → naming clear? Behaviour preserved?
4. Commit
5. Repeat
```

### What Counts as One Change

| One change | Not one change |
|------------|---------------|
| Extract a method | Extract a method and rename 5 other methods |
| Move a method to another class | Move a method and change its signature |
| Introduce a value object | Introduce a value object and refactor all callers in the same step |
| Replace inheritance with composition | Replace inheritance, add new interface, rewire DI, and update tests |

If you find yourself saying "and", you are combining steps. Split them.

---

## Verification After Each Step

### Automated

```powershell
dotnet build --no-incremental
dotnet test
dotnet format --verify-no-changes
```

### Manual Checklist

- [ ] All existing tests still pass — no test modifications unless the test was testing implementation details
- [ ] No new public API surface created unintentionally
- [ ] No behaviour change — the system does exactly what it did before
- [ ] Naming is clearer than before, not just different
- [ ] No new dependencies introduced between layers
- [ ] Complexity reduced — less nesting, shorter methods, fewer responsibilities

---

## After Refactoring

### Add Missing Tests

If the refactoring exposed previously untestable logic (e.g., extracted a pure method from a god class), write unit tests for the extracted units.

### Validate Layer Boundaries

```powershell
# Confirm no infrastructure leaked into domain/application
rg "using.*Infrastructure" --type cs --glob "**/Domain/**"
rg "using.*Infrastructure" --type cs --glob "**/Application/**"
```

### Final Review

Apply the validation checklist from the refactor skill's Step 5 before marking the work as done.

---

## Common Traps

| Trap | Why it's dangerous | Mitigation |
|------|-------------------|------------|
| Refactoring without tests | No way to verify behaviour preservation | Write characterisation tests first |
| Combining refactoring with feature work | Impossible to isolate regressions | Separate commits: refactor first, feature second |
| Renaming everything at once | Large diffs obscure real changes | Rename in focused, reviewable batches |
| Introducing abstractions during refactoring | Adds complexity while claiming to reduce it | Only extract when the smell is clear and the pattern repeats |
| Refactoring code you don't understand | High risk of breaking subtle behaviour | Understand end-to-end before touching; ask if unsure |
| Perfectionism — refactoring beyond the goal | Diminishing returns; scope creep | Stop when the stated goal is met |
