# Reference — Code Smells & Refactoring Patterns

> The examples are in TypeScript for compactness; each refactoring is language-agnostic. Translate to the project's language and idioms, and to the installed stack skill's patterns file when there is one (`../<stack>-core/patterns.md`). The `.NET` stack ships C# versions of these examples. Keep behaviour identical and tests green at every step.

---

## Code Smell Table

| Smell | Symptom | Refactoring |
|-------|---------|-------------|
| Long method | > ~30 lines, multiple `//` section comments | Extract Method |
| Large class | 10+ public methods, multiple responsibilities | Extract Class, Split by SRP |
| Duplicated logic | Same block in 2+ places | Extract shared method / utility |
| Feature envy | Method uses another object's data more than its own | Move Method |
| Primitive obsession | `string` for Email, `number` for Money, boolean flags | Introduce Value Object, Replace Flag with Enum |
| God object | One class does everything | Decompose by Single Responsibility |
| Deep nesting | 3+ levels of `if`/loops | Guard clauses, Extract Method |
| Magic values | Unexplained numbers or strings | Named constants, configuration |
| Tight coupling | A dependency constructed inside the method that uses it | Extract interface, inject dependency |
| Anemic domain | All logic in services, entities are data bags | Move behaviour to entity |
| Switch on type | `if (type === "X")` repeated across methods | Strategy pattern, polymorphism |
| Long parameter list | Function with 4+ parameters | Parameter object, builder |
| Temporary field | Field only used in certain code paths | Extract class or method |
| Speculative generality | Abstractions for problems that don't exist yet | Remove unused abstractions (YAGNI) |

---

## Pattern: Extract Method

**When:** a function does several things, with comments marking the sections.
**Mechanics:** move one section at a time into a named function, pass only what it needs, run the tests after each move.
**Watch out:** a name that needs "and" means the extraction is still doing two things.

```ts
// Before
function processOrder(order: Order) {
  // validate
  if (order.items.length === 0) throw new Error("No items");
  if (!order.customerId) throw new Error("No customer");
  // calculate
  const subtotal = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const total = subtotal * 1.1;
  // persist
  order.total = total;
  repository.save(order);
}

// After — each step is named and independently testable
function processOrder(order: Order) {
  validateOrder(order);
  order.total = calculateTotal(order);
  repository.save(order);
}
```

---

## Pattern: Guard Clauses (Flatten Nesting)

**When:** the happy path sits three or more levels deep.
**Mechanics:** invert each condition and return or throw early; the main flow ends up at the left margin.
**Watch out:** keep early returns consistent in what they return, and don't skip cleanup that a single exit point used to guarantee.

```ts
// Before — arrow-shaped code
function save(order: Order | null) {
  if (order) {
    if (order.isValid()) {
      if (!repository.exists(order.id)) {
        repository.save(order);
      }
    }
  }
}

// After — linear
function save(order: Order | null) {
  if (!order) return;
  if (!order.isValid()) return;
  if (repository.exists(order.id)) return;
  repository.save(order);
}
```

---

## Pattern: Introduce Value Object

**When:** the same primitive (email, money, id) is validated or formatted in several places.
**Mechanics:** create an immutable type that validates in its constructor or factory, then replace the primitive at the boundaries first.
**Watch out:** don't wrap every string; do it where invalid values have caused or would cause bugs.

```ts
// Before — any string is accepted
class Customer { email: string = ""; }

// After — validated, meaningful type
class Email {
  private constructor(readonly value: string) {}
  static parse(raw: string): Email {
    const value = raw.trim().toLowerCase();
    if (!value.includes("@")) throw new Error("Invalid email address");
    return new Email(value);
  }
}
class Customer { constructor(readonly email: Email) {} }
```

---

## Pattern: Result Pattern (Replace Exception as Control Flow)

**When:** an expected outcome (not found, validation failed) is signalled with an exception that every caller must remember to catch.
**Mechanics:** return an explicit success/failure value; keep exceptions for unexpected faults.
**Watch out:** follow the project's existing error-handling convention; don't introduce a second one for a single function.

```ts
// Before — exception for an expected failure
function getOrder(id: string): Order {
  const order = repository.find(id);
  if (!order) throw new NotFoundError("Order not found");
  return order;
}

// After — explicit, composable outcome
type Result<T> = { ok: true; value: T } | { ok: false; error: string };

function getOrder(id: string): Result<Order> {
  const order = repository.find(id);
  return order ? { ok: true, value: order } : { ok: false, error: "Order not found" };
}
```

---

## Pattern: Replace Switch with Strategy

**When:** the same switch on a type or kind is repeated, and each new kind touches several places.
**Mechanics:** define one interface (or a function type), one implementation per case, and select it in a single lookup.
**Watch out:** a single, stable switch is fine; apply this only when the cases keep growing.

```ts
// Before
function discount(customerType: string, amount: number): number {
  switch (customerType) {
    case "vip": return amount * 0.2;
    case "returning": return amount * 0.1;
    default: return 0;
  }
}

// After — open for extension without modification
type DiscountStrategy = (amount: number) => number;
const strategies: Record<string, DiscountStrategy> = {
  vip: (amount) => amount * 0.2,
  returning: (amount) => amount * 0.1,
};
const discount = (customerType: string, amount: number) =>
  (strategies[customerType] ?? (() => 0))(amount);
```

---

## Pattern: Move Behaviour to Entity (Fix Anemic Domain)

**When:** a service checks and mutates an entity's fields, so the same rules get copied wherever the entity is used.
**Mechanics:** move the invariant and the state change into a method on the entity; make the fields private or read-only; leave the service as an orchestrator.
**Watch out:** only for entities with real invariants; plain data holders can stay plain.

```ts
// Before — service does the work; entity is a data bag
class OrderService {
  cancel(order: Order) {
    if (order.status === "shipped") throw new Error("Cannot cancel shipped order");
    order.status = "cancelled";
    order.cancelledAt = new Date();
  }
}

// After — invariant and behaviour live on the entity
class Order {
  private _status: "open" | "shipped" | "cancelled" = "open";
  cancelledAt?: Date;
  cancel() {
    if (this._status === "shipped") throw new Error("Cannot cancel a shipped order");
    this._status = "cancelled";
    this.cancelledAt = new Date();
  }
}
// The service now loads the order, calls order.cancel(), and saves it.
```

---

## Pattern: Extract Parameter Object

**When:** a function takes four or more parameters that travel together.
**Mechanics:** group the related parameters into one named type, update callers one at a time.
**Watch out:** group by meaning (billing details), not by convenience (a bag of "options").

```ts
// Before
function createInvoice(customerId: string, name: string, email: string,
                       address: string, city: string, postcode: string,
                       amount: number, currency: string) { /* ... */ }

// After
interface BillingDetails { customerId: string; name: string; email: string; address: Address; }
function createInvoice(billing: BillingDetails, amount: Money) { /* ... */ }
```

---

## Commit Convention

```
refactor(orders): extract order validation into validateOrder
refactor(payments): replace switch on payment type with strategy lookup
refactor(domain): move cancellation logic from OrderService to Order entity
refactor(users): introduce Email value object to replace string primitive
```
