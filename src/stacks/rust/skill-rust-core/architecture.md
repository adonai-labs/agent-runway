# rust-core/architecture.md

# Architecture

Project structure for Rust services and libraries — scaled to what is needed.

---

## Start simple: single crate

For a service, API, or CLI that serves one purpose:

```
src/
├── main.rs          ← entry point; wires router, config, tracing
├── config.rs        ← env validation
├── routes/          ← HTTP handlers (mod.rs + route files)
│   └── orders.rs
├── services/        ← business logic
│   └── order_service.rs
├── db/              ← repository implementations
│   └── order_repo.rs
├── domain/          ← types, traits, errors
│   └── order.rs
└── error.rs         ← application error type
tests/
└── api_tests.rs     ← integration tests against the running app
Cargo.toml
```

Keep it in one crate until there is a clear reuse or publishing boundary.

---

## Workspace layout (larger systems)

When domain boundaries are stable and multiple binaries or shared libraries emerge:

```
my-platform/
├── Cargo.toml        ← workspace manifest
├── crates/
│   ├── domain/       ← pure domain types; no async, no DB (lib)
│   ├── application/  ← use cases; depends on domain (lib)
│   ├── infrastructure/ ← DB, HTTP clients, queues (lib)
│   └── api/          ← Axum service; depends on application + infra (bin)
└── tests/
    └── integration/
```

**Workspace rules:**
- `domain` crate: no `async`, no ORM, no framework — pure types, traits, domain errors
- `application` crate: async use cases; depends on domain traits only (via generics or `dyn Trait`)
- `infrastructure` crate: implements domain traits with SQLx, reqwest, etc.
- `api` crate: wires everything; owns `main`

---

## Configuration

```rust
// src/config.rs
use std::env;

pub struct Config {
    pub database_url: String,
    pub jwt_secret:   String,
    pub port:         u16,
    pub log_level:    String,
}

impl Config {
    pub fn from_env() -> Result<Self, String> {
        let mut missing = Vec::new();

        let database_url = env::var("DATABASE_URL").unwrap_or_else(|_| { missing.push("DATABASE_URL"); String::new() });
        let jwt_secret   = env::var("JWT_SECRET").unwrap_or_else(|_| { missing.push("JWT_SECRET"); String::new() });

        if !missing.is_empty() {
            return Err(format!("missing required env vars: {}", missing.join(", ")));
        }

        Ok(Self {
            database_url,
            jwt_secret,
            port: env::var("PORT").ok().and_then(|p| p.parse().ok()).unwrap_or(8080),
            log_level: env::var("LOG_LEVEL").unwrap_or_else(|_| "info".into()),
        })
    }
}
```

**Rules:**
- Validate required env vars at startup; return `Err` and exit clearly
- Never read `env::var` in business logic; inject `Config`
- Never default-fill secrets; fail fast

---

## Naming conventions

| Concept | Convention | Example |
|---------|------------|---------|
| Modules / files | `snake_case` | `order_service.rs` |
| Types / structs / enums | `PascalCase` | `OrderService`, `OrderError` |
| Functions / methods | `snake_case` | `place_order`, `find_by_id` |
| Constants | `UPPER_SNAKE` | `MAX_RETRIES` |
| Traits | `PascalCase`, named by behaviour | `OrderRepository`, `EventPublisher` |
| Lifetime params | short lowercase | `'a`, `'conn` |
