# Reference — Code Smells & Refactoring Patterns

---

## Code Smell Table

| Smell | Symptom | Refactoring |
|-------|---------|-------------|
| Long method | > ~30 lines, multiple `//` section comments | Extract Method |
| Large class | 10+ public methods, multiple responsibilities | Extract Class, Split by SRP |
| Duplicated logic | Same block in 2+ places | Extract shared method / utility |
| Feature envy | Method uses another object's data more than its own | Move Method |
| Primitive obsession | `string` for Email, `int` for Money, `bool` flags | Introduce Value Object, Replace Flag with Enum |
| God object | One class does everything | Decompose by Single Responsibility |
| Deep nesting | 3+ levels of `if`/`foreach` | Guard clauses, Extract Method |
| Magic values | Unexplained numbers or strings | Named constants, configuration |
| Tight coupling | `new SomeService()` inside a method | Extract interface, inject dependency |
| Anemic domain | All logic in services, entities are data bags | Move behaviour to entity |
| Switch on type | `if (type == "X")` patterns repeated across methods | Strategy pattern, polymorphism |
| Long parameter list | Method with 4+ parameters | Parameter object, builder |
| Temporary field | Field only used in certain code paths | Extract class or method |
| Speculative generality | Abstractions for problems that don't exist yet | Remove unused abstractions (YAGNI) |

---

## Pattern: Extract Method

```csharp
// Before — one method doing too many things
public void ProcessOrder(Order order)
{
    // validate
    if (order.Items.Count == 0) throw new InvalidOperationException("No items");
    if (order.CustomerId == Guid.Empty) throw new InvalidOperationException("No customer");

    // calculate
    var subtotal = order.Items.Sum(i => i.Price * i.Quantity);
    var tax = subtotal * 0.1m;
    var total = subtotal + tax;

    // persist
    order.SetTotal(total);
    _repository.Save(order);
}

// After — each step is named and independently testable
public void ProcessOrder(Order order)
{
    ValidateOrder(order);
    var total = CalculateTotal(order);
    order.SetTotal(total);
    _repository.Save(order);
}

private static void ValidateOrder(Order order)
{
    if (order.Items.Count == 0) throw new InvalidOperationException("No items");
    if (order.CustomerId == Guid.Empty) throw new InvalidOperationException("No customer");
}

private static decimal CalculateTotal(Order order)
{
    var subtotal = order.Items.Sum(i => i.Price * i.Quantity);
    return subtotal + (subtotal * 0.1m);
}
```

---

## Pattern: Guard Clauses (Flatten Nesting)

```csharp
// Before — arrow-shaped code
public void Save(Order order)
{
    if (order != null)
    {
        if (order.IsValid())
        {
            if (!_repository.Exists(order.Id))
            {
                _repository.Save(order);
            }
        }
    }
}

// After — linear, readable
public void Save(Order order)
{
    if (order is null) return;
    if (!order.IsValid()) return;
    if (_repository.Exists(order.Id)) return;

    _repository.Save(order);
}
```

---

## Pattern: Introduce Value Object

```csharp
// Before — primitive obsession
public class Customer
{
    public string Email { get; set; }  // any string, no validation
}

// After — validated, meaningful type
public record Email
{
    public string Value { get; }

    public Email(string value)
    {
        if (string.IsNullOrWhiteSpace(value) || !value.Contains('@'))
            throw new ArgumentException("Invalid email address", nameof(value));
        Value = value.ToLowerInvariant();
    }

    public static implicit operator string(Email email) => email.Value;
}

public class Customer
{
    public Email Email { get; private set; }
}
```

---

## Pattern: Result Pattern (Replace Exception as Control Flow)

```csharp
// Before — exception for expected failure
public Order GetOrder(Guid id)
{
    var order = _repository.Find(id);
    if (order == null) throw new NotFoundException("Order not found");
    return order;
}

// After — explicit, composable outcome
public Result<Order> GetOrder(Guid id)
{
    var order = _repository.Find(id);
    return order is null
        ? Result.Failure<Order>("Order not found")
        : Result.Success(order);
}
```

---

## Pattern: Replace Switch with Strategy

```csharp
// Before — switch repeated every time a new type is added
public decimal CalculateDiscount(string customerType, decimal amount)
{
    return customerType switch
    {
        "VIP"       => amount * 0.2m,
        "Returning" => amount * 0.1m,
        _           => 0m
    };
}

// After — strategy, open for extension without modification
public interface IDiscountStrategy
{
    decimal Calculate(decimal amount);
}

public class VipDiscountStrategy : IDiscountStrategy
{
    public decimal Calculate(decimal amount) => amount * 0.2m;
}

public class ReturningCustomerDiscountStrategy : IDiscountStrategy
{
    public decimal Calculate(decimal amount) => amount * 0.1m;
}

public class NoDiscountStrategy : IDiscountStrategy
{
    public decimal Calculate(decimal amount) => 0m;
}

// Inject the correct strategy via DI factory or dictionary lookup
```

---

## Pattern: Move Behaviour to Entity (Fix Anemic Domain)

```csharp
// Before — service does all the work; entity is a data bag
public class OrderService
{
    public void CancelOrder(Order order)
    {
        if (order.Status == OrderStatus.Shipped)
            throw new InvalidOperationException("Cannot cancel shipped order");
        order.Status = OrderStatus.Cancelled;
        order.CancelledAt = DateTime.UtcNow;
    }
}

// After — invariant and behaviour live on the entity
public class Order
{
    public OrderStatus Status { get; private set; }
    public DateTime? CancelledAt { get; private set; }

    public void Cancel()
    {
        if (Status == OrderStatus.Shipped)
            throw new InvalidOperationException("Cannot cancel a shipped order");
        Status = OrderStatus.Cancelled;
        CancelledAt = DateTime.UtcNow;
        AddDomainEvent(new OrderCancelledEvent(Id));
    }
}

// Service becomes a thin orchestrator
public class OrderService
{
    public async Task CancelAsync(Guid id, CancellationToken ct)
    {
        var order = await _repository.FindAsync(id, ct);
        order.Cancel();
        await _repository.SaveAsync(order, ct);
    }
}
```

---

## Pattern: Extract Parameter Object

```csharp
// Before — long parameter list
public Invoice CreateInvoice(
    Guid customerId, string customerName, string customerEmail,
    string billingAddress, string billingCity, string billingPostcode,
    decimal amount, string currency)
{ ... }

// After — cohesive parameter object
public record BillingDetails(
    Guid CustomerId,
    string Name,
    string Email,
    Address BillingAddress);

public Invoice CreateInvoice(BillingDetails billing, Money amount) { ... }
```

---

## Commit Convention

```
refactor(orders): extract order validation into ValidateOrder method
refactor(payments): replace switch on payment type with strategy pattern
refactor(domain): move cancellation logic from OrderService to Order entity
refactor(users): introduce Email value object to replace string primitive
```
