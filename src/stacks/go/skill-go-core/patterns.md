# go-core/patterns.md

# Application Patterns

Idiomatic Go patterns — applied when the problem justifies the structure.

**Simplicity rule:** a function that returns `(value, error)` is the right starting point. Add interfaces, types, and packages only when there is a concrete reason: testability, variation, reuse. Avoid ceremony.

---

## Error handling

```go
// Wrap errors with context so callers can inspect
func (s *OrderService) PlaceOrder(ctx context.Context, dto PlaceOrderDTO) (OrderID, error) {
    order, err := order.New(dto.CustomerID, dto.Lines)
    if err != nil {
        return "", fmt.Errorf("creating order: %w", err)
    }
    if err := s.store.Save(ctx, order); err != nil {
        return "", fmt.Errorf("saving order: %w", err)
    }
    return order.ID, nil
}

// Define sentinel errors for conditions callers branch on
var ErrOrderNotFound = errors.New("order not found")

// Typed errors for richer context
type ValidationError struct {
    Field   string
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("%s: %s", e.Field, e.Message)
}

// Caller
if errors.Is(err, ErrOrderNotFound) { ... }

var ve *ValidationError
if errors.As(err, &ve) { ... }
```

**Rules:**
- Always return errors to callers; never log-and-continue at intermediate layers
- Wrap with `%w` to preserve the error chain for `errors.Is` / `errors.As`
- Do not log and return the same error — do one or the other at each layer
- Use `panic` only for unrecoverable states (programming invariants); never for expected failures

---

## Interfaces — small, defined at the consumer

```go
// Define the interface where it is used, not where it is implemented
// internal/service/order.go

type OrderStore interface {
    FindByID(ctx context.Context, id OrderID) (*Order, error)
    Save(ctx context.Context, order *Order) error
}

type OrderService struct {
    store  OrderStore
    events EventPublisher
}

func NewOrderService(store OrderStore, events EventPublisher) *OrderService {
    return &OrderService{store: store, events: events}
}
```

**Rules:**
- Accept interfaces; return concrete types — callers define what they need
- Keep interfaces to 1–3 methods; split large interfaces at the seam
- Do not create an interface until you have two implementations or a test double needs it

---

## Context propagation

```go
// Always the first parameter for I/O or blocking operations
func (s *OrderStore) FindByID(ctx context.Context, id OrderID) (*Order, error) {
    row := s.db.QueryRowContext(ctx, "SELECT ... FROM orders WHERE id = $1", id)
    ...
}

// Cancel on shutdown
func Run(ctx context.Context) error {
    srv := &http.Server{Addr: ":8080", Handler: routes()}
    go func() {
        <-ctx.Done()
        _ = srv.Shutdown(context.Background())
    }()
    return srv.ListenAndServe()
}
```

**Rules:**
- Never store context in a struct; pass it as the first argument
- Honour cancellation in loops with `select { case <-ctx.Done(): return ctx.Err() }`
- Propagate deadlines across service boundaries; do not create a fresh `context.Background()` mid-request

---

## Service layer

```go
// One method per use case; no "manager" structs with unrelated methods
type OrderService struct {
    store  OrderStore
    events EventPublisher
}

func (s *OrderService) PlaceOrder(ctx context.Context, dto PlaceOrderDTO) (OrderID, error) {
    if len(dto.Lines) == 0 {
        return "", &ValidationError{Field: "lines", Message: "must not be empty"}
    }
    order := order.New(dto.CustomerID, dto.Lines)
    if err := s.store.Save(ctx, order); err != nil {
        return "", fmt.Errorf("save order: %w", err)
    }
    s.events.Publish(ctx, OrderPlacedEvent{OrderID: order.ID})
    return order.ID, nil
}
```

---

## Concurrency

**Default: do not reach for goroutines.** A sequential implementation is correct, readable, and safe. Introduce concurrency only when you have a measured performance problem or a structural need (streaming, fan-out, background work).

```go
// Concurrent independent I/O — use errgroup
import "golang.org/x/sync/errgroup"

g, ctx := errgroup.WithContext(ctx)

var order *Order
var customer *Customer

g.Go(func() error {
    var err error
    order, err = orderStore.FindByID(ctx, orderID)
    return err
})
g.Go(func() error {
    var err error
    customer, err = customerStore.FindByID(ctx, customerID)
    return err
})

if err := g.Wait(); err != nil {
    return err
}
```
