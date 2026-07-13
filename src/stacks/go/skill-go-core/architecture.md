# go-core/architecture.md

# Architecture

Project structure for Go services — scaled to what is needed.

---

## Start flat

For a small CLI, script, or single-responsibility service: a flat structure is idiomatic Go.

```
cmd/
└── server/
    └── main.go       ← entry point; wires dependencies
internal/
├── handler/          ← HTTP handlers
├── service/          ← business logic
└── store/            ← database access
go.mod
go.sum
```

Do not create multiple packages until a single package becomes hard to understand or reuse.

---

## Larger services

When the codebase grows and boundaries emerge, structure by domain concern rather than type:

```
cmd/
└── server/
    └── main.go
internal/
├── order/
│   ├── handler.go    ← HTTP layer
│   ├── service.go    ← business rules
│   ├── store.go      ← data access
│   └── model.go      ← domain types
├── customer/
│   └── ...
└── platform/
    ├── database/     ← connection management
    ├── middleware/   ← logging, tracing, auth
    └── health/       ← health checks
```

**Package rules:**
- `internal/` — not importable by external modules; prefer over `pkg/` unless you explicitly intend a public library
- Keep packages cohesive — one concern, minimal exports
- Avoid circular imports; if they occur, a package boundary is wrong
- `cmd/` contains only wiring — parse config, create dependencies, call `Run()`

---

## Configuration

```go
// internal/platform/config/config.go
package config

import (
    "fmt"
    "os"
)

type Config struct {
    DatabaseURL string
    JWTSecret   string
    Port        string
    LogLevel    string
}

func Load() (Config, error) {
    cfg := Config{
        Port:     getEnvOrDefault("PORT", "8080"),
        LogLevel: getEnvOrDefault("LOG_LEVEL", "info"),
    }
    var missing []string
    if cfg.DatabaseURL = os.Getenv("DATABASE_URL"); cfg.DatabaseURL == "" {
        missing = append(missing, "DATABASE_URL")
    }
    if cfg.JWTSecret = os.Getenv("JWT_SECRET"); cfg.JWTSecret == "" {
        missing = append(missing, "JWT_SECRET")
    }
    if len(missing) > 0 {
        return Config{}, fmt.Errorf("missing required env vars: %v", missing)
    }
    return cfg, nil
}

func getEnvOrDefault(key, def string) string {
    if v := os.Getenv(key); v != "" {
        return v
    }
    return def
}
```

**Rules:**
- Validate required env vars at startup; fail fast with a clear error
- Never read `os.Getenv` in business logic; inject a `Config` struct
- Never default-fill secrets; missing secret at startup is safer than silent misconfiguration

---

## Naming conventions

| Concept | Convention | Example |
|---------|------------|---------|
| Packages | short, lowercase, no underscores | `order`, `store`, `httputil` |
| Types / interfaces | `PascalCase` | `OrderService`, `OrderStore` |
| Functions / methods | `PascalCase` (exported), `camelCase` (unexported) | `PlaceOrder`, `validate` |
| Variables / constants | `camelCase`, `UPPER_SNAKE` for pkg-level consts | `orderID`, `MaxRetries` |
| Test files | same package or `_test` suffix | `service_test.go` |
| Interfaces | name by behaviour, not by type | `OrderStore`, not `IOrderRepository` |
