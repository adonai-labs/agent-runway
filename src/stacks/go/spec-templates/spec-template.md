# Go Spec Template (Clean Architecture + Clean Code)

Use this template when the active stack is Go.

## Stack Scaffold Proposal

```text
cmd/
  <service>/
    main.go            # composition root: config, wiring, server start, shutdown
internal/
  <feature>/
    domain.go          # entities, value objects, domain errors
    service.go         # use cases; depends on interfaces declared here
    repository.go      # interface the service consumes
    postgres.go        # adapter implementing repository
    http.go            # handlers: decode, validate, call service, encode
  platform/
    config/
    database/
    observability/
migrations/
go.mod
```

Start flat (one package per feature); split into sub-packages only when a package grows unwieldy.

## Clean Architecture Guidance

- Domain and service code must not import `net/http`, SQL drivers, or SDKs.
- Define interfaces at the consumer (the service), not next to the implementation.
- Adapters (HTTP, Postgres, queues) depend on the service, never the reverse.
- `cmd/<service>/main.go` wires concrete types; no business logic there.

## Clean Code Guidance

- Return errors, wrap with context (`fmt.Errorf("place order: %w", err)`), branch with `errors.Is/As`.
- Pass `context.Context` first to every function that does I/O.
- Keep functions short; name by intent (`PlaceOrder`, not `Handle`).
- Table-driven tests per use case; `httptest` for handlers; Testcontainers for adapters.
