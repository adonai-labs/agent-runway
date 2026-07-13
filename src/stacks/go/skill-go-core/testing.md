# go-core/testing.md

# Testing for Go

---

## Core principles

- Test behaviour, not implementation — assert outcomes, not internal method calls
- Business logic must be testable without a database or running server
- Use the standard library; reach for external frameworks only for genuine value

---

## Table-driven tests

```go
// internal/order/service_test.go
package order_test

import (
    "context"
    "testing"
    "github.com/example/service/internal/order"
)

func TestPlaceOrder(t *testing.T) {
    tests := []struct {
        name    string
        dto     order.PlaceOrderDTO
        wantErr bool
    }{
        {
            name: "valid order",
            dto:  order.PlaceOrderDTO{CustomerID: "c-1", Lines: []order.Line{{ProductID: "p-1", Qty: 2}}},
        },
        {
            name:    "empty lines returns error",
            dto:     order.PlaceOrderDTO{CustomerID: "c-1", Lines: nil},
            wantErr: true,
        },
    }

    for _, tc := range tests {
        t.Run(tc.name, func(t *testing.T) {
            store := &fakeOrderStore{}
            events := &fakeEventPublisher{}
            svc := order.NewOrderService(store, events)

            _, err := svc.PlaceOrder(context.Background(), tc.dto)

            if tc.wantErr && err == nil {
                t.Fatal("expected error, got nil")
            }
            if !tc.wantErr && err != nil {
                t.Fatalf("unexpected error: %v", err)
            }
        })
    }
}
```

---

## Fakes (prefer over mocks)

```go
type fakeOrderStore struct {
    orders map[string]*order.Order
    err    error  // set to inject errors in tests
}

func (f *fakeOrderStore) Save(_ context.Context, o *order.Order) error {
    if f.err != nil {
        return f.err
    }
    if f.orders == nil {
        f.orders = make(map[string]*order.Order)
    }
    f.orders[string(o.ID)] = o
    return nil
}

func (f *fakeOrderStore) FindByID(_ context.Context, id order.OrderID) (*order.Order, error) {
    if f.err != nil {
        return nil, f.err
    }
    o, ok := f.orders[string(id)]
    if !ok {
        return nil, order.ErrOrderNotFound
    }
    return o, nil
}
```

Use fakes when state matters (e.g. a save that must be retrievable). Use simple interface implementations via `testify/mock` or `gomock` only when complex behaviour verification is needed.

---

## HTTP handler testing with `httptest`

```go
// internal/handler/order_test.go
package handler_test

import (
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "strings"
    "testing"
)

func TestPlaceOrderHandler_Returns201(t *testing.T) {
    store := &fakeOrderStore{}
    svc := order.NewOrderService(store, &fakeEventPublisher{})
    h := handler.NewOrderHandler(svc)

    body := `{"customer_id":"c-1","lines":[{"product_id":"p-1","qty":1}]}`
    req := httptest.NewRequest(http.MethodPost, "/orders", strings.NewReader(body))
    req.Header.Set("Content-Type", "application/json")
    w := httptest.NewRecorder()

    h.PlaceOrder(w, req)

    if w.Code != http.StatusCreated {
        t.Fatalf("expected 201, got %d", w.Code)
    }
    var resp map[string]string
    _ = json.NewDecoder(w.Body).Decode(&resp)
    if resp["order_id"] == "" {
        t.Fatal("expected order_id in response")
    }
}
```

---

## Integration testing with Testcontainers

```go
// tests/integration/order_store_test.go
package integration_test

import (
    "context"
    "testing"
    "github.com/testcontainers/testcontainers-go/modules/postgres"
)

func TestOrderStore_SaveAndFind(t *testing.T) {
    ctx := context.Background()
    pg, err := postgres.Run(ctx, "postgres:16-alpine",
        postgres.WithDatabase("testdb"),
        postgres.WithUsername("test"),
        postgres.WithPassword("test"),
    )
    if err != nil {
        t.Fatalf("start postgres: %v", err)
    }
    t.Cleanup(func() { _ = pg.Terminate(ctx) })

    dsn, _ := pg.ConnectionString(ctx, "sslmode=disable")
    store := newStore(t, dsn)

    o := order.New("c-1", sampleLines())
    if err := store.Save(ctx, o); err != nil {
        t.Fatalf("save: %v", err)
    }
    got, err := store.FindByID(ctx, o.ID)
    if err != nil {
        t.Fatalf("find: %v", err)
    }
    if got.ID != o.ID {
        t.Errorf("want ID %s, got %s", o.ID, got.ID)
    }
}
```

---

## Checklist

- [ ] Table-driven tests with `t.Run` for all business logic
- [ ] Services tested with fakes; no real database in unit tests
- [ ] HTTP handlers tested with `httptest`; no real server
- [ ] Integration tests use Testcontainers and run with `-tags=integration`
- [ ] `go test -race ./...` passes
- [ ] `go test -cover ./...` reports coverage; CI threshold enforced
