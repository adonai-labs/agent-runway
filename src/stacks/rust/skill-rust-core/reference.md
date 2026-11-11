# rust-core/reference.md

# Reference

`Cargo.toml`, common commands, and toolchain for Rust projects.

---

## Cargo.toml

```toml
[package]
name    = "my-service"
version = "0.1.0"
edition = "2024"            # requires Rust 1.85+

[dependencies]
# Web
axum       = { version = "0.8", features = ["macros"] }   # path params use "/{id}", not "/:id"
tokio      = { version = "1", features = ["full"] }
tower      = { version = "0.5" }
tower-http = { version = "0.6", features = ["trace", "cors"] }

# Serialisation
serde         = { version = "1", features = ["derive"] }
serde_json    = "1"

# Database
sqlx = { version = "0.8", features = ["postgres", "runtime-tokio", "uuid", "chrono", "macros"] }

# Error handling
thiserror = "2"
anyhow    = "1"

# Validation
validator = { version = "0.18", features = ["derive"] }

# Logging / tracing
tracing              = "0.1"
tracing-subscriber   = { version = "0.3", features = ["env-filter", "json"] }

# Config
uuid = { version = "1", features = ["v4"] }

[dev-dependencies]
testcontainers = "0.15"
testcontainers-modules = { version = "0.3", features = ["postgres"] }

[profile.release]
opt-level     = 3
lto           = true
codegen-units = 1
panic         = "abort"
```

> **Version note.** `axum` 0.8, `tokio` 1, `tower` 0.5, and `thiserror` 2 were current when checked against the crates.io index on 2026-11-11. Newer minor lines exist for `tower-http` (0.7), `sqlx` (0.9), and `validator` (0.21); for 0.x crates a new minor can break the API, so upgrade them deliberately and re-check the snippets.

---

## Common commands

```bash
# Build
cargo build
cargo build --release

# Run
cargo run
RUST_LOG=debug cargo run

# Tests
cargo test                              # all tests
cargo test -- --test-threads=1         # serial (useful for integration tests sharing infra)
cargo test --test api_tests            # specific integration test file
cargo test service::tests              # module path

# Lint
cargo clippy -- -D warnings            # fail on warnings
cargo fmt --check                      # CI formatting check
cargo fmt                              # auto-format

# Security audit
cargo audit
cargo audit --deny warnings            # CI blocking

# Outdated dependencies
cargo outdated

# Documentation
cargo doc --open
```

---

## Recommended toolchain

| Tool | Purpose | Install |
|------|---------|---------|
| `cargo-audit` | Known vulnerability scan (RustSec) | `cargo install cargo-audit` |
| `cargo-deny` | Licence, duplicate, and advisory policies | `cargo install cargo-deny` |
| `cargo-outdated` | Show outdated dependencies | `cargo install cargo-outdated` |
| `cargo-nextest` | Faster test runner with better output | `cargo install cargo-nextest` |
| `sqlx-cli` | SQLx migrations | `cargo install sqlx-cli` |

---

## Key crates by category

| Category | Crate | Notes |
|----------|-------|-------|
| Async runtime | `tokio` | Use `features = ["full"]` for services |
| HTTP server | `axum` | Preferred; ergonomic, tower-native |
| HTTP client | `reqwest` | Async, `rustls` for TLS |
| Database | `sqlx` | Compile-time query checking; async |
| Serialisation | `serde` + `serde_json` | Derive macros |
| Error (lib) | `thiserror` | Derive `Error`; structured types |
| Error (app) | `anyhow` | Flexible context; `?` propagation |
| Validation | `validator` | Derive-based field constraints |
| Logging | `tracing` + `tracing-subscriber` | Structured, async-aware |
| Config | `config` or env + manual | Validate at startup |
| UUIDs | `uuid` | `v4` feature for random |
| Time | `chrono` | Dates and times |
