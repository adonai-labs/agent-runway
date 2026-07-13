# go-core/reference.md

# Reference

`go.mod`, common commands, and conventions for Go projects.

---

## go.mod

```go
module github.com/example/my-service

go 1.23

require (
    golang.org/x/sync v0.7.0
    go.opentelemetry.io/otel v1.26.0
    go.opentelemetry.io/otel/sdk v1.26.0
    go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp v1.26.0
    go.uber.org/zap v1.27.0                  // alternative to slog for high-throughput logging
)

require (
    // indirect dependencies — managed by go mod tidy
)
```

---

## Common commands

```bash
# Initialise module
go mod init github.com/example/my-service

# Add dependency
go get golang.org/x/sync@latest

# Tidy (remove unused, add missing)
go mod tidy

# Build
go build ./cmd/server

# Run
go run ./cmd/server

# Tests
go test ./...                             # all packages
go test -race ./...                       # race detector — always run in CI
go test -cover ./...                      # coverage
go test -run TestPlaceOrder ./internal/order   # specific test
go test -tags=integration ./tests/...    # integration tests

# Lint
golangci-lint run ./...

# Vulnerability scan
govulncheck ./...

# Module verification
go mod verify
```

---

## Recommended toolchain

| Tool | Purpose | Install |
|------|---------|---------|
| `golangci-lint` | Multi-linter (errcheck, govet, staticcheck, …) | `go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest` |
| `govulncheck` | Known vulnerability scan | `go install golang.org/x/vuln/cmd/govulncheck@latest` |
| `testcontainers-go` | Real infra in tests | `go get github.com/testcontainers/testcontainers-go` |
| `errgroup` | Concurrent goroutines with error propagation | `go get golang.org/x/sync/errgroup` |

---

## golangci-lint config

```yaml
# .golangci.yml
linters:
  enable:
    - errcheck       # check that errors are handled
    - govet          # suspicious code constructs
    - staticcheck    # comprehensive static analysis
    - gosimple       # simplification suggestions
    - ineffassign    # unused assignments
    - gofmt          # formatting
    - goimports      # import ordering

linters-settings:
  errcheck:
    check-type-assertions: true
    check-blank: true

run:
  timeout: 5m
```

---

## Useful stdlib packages

| Package | Use for |
|---------|---------|
| `net/http` | HTTP server and client |
| `net/http/httptest` | Handler testing without a server |
| `context` | Cancellation and deadline propagation |
| `log/slog` | Structured logging (Go 1.21+) |
| `database/sql` | SQL database access |
| `encoding/json` | JSON marshalling |
| `errors` | `Is`, `As`, `New`, wrapping with `%w` |
| `os` | Environment vars, file I/O, signals |
| `sync` | `Mutex`, `RWMutex`, `WaitGroup`, `Once` |
| `testing` | Tests, benchmarks, examples |
