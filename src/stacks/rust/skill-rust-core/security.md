# rust-core/security.md

# Security for Rust

OWASP-aligned security standards for Rust backend services.

---

## Input validation

Rust's type system prevents many invalid states by construction. Use typed request structs with validation at the boundary.

```rust
use serde::Deserialize;
use validator::Validate;

#[derive(Debug, Deserialize, Validate)]
pub struct PlaceOrderDto {
    #[validate(length(min = 1, message = "customer_id is required"))]
    pub customer_id: String,

    #[validate(length(min = 1, max = 100, message = "must have 1-100 lines"))]
    pub lines: Vec<OrderLineDto>,
}

// Axum handler — validate on entry
async fn place_order(
    State(state): State<AppState>,
    Json(dto): Json<PlaceOrderDto>,
) -> Result<Json<OrderId>, AppError> {
    dto.validate().map_err(AppError::Validation)?;
    let id = state.order_service.place_order(dto).await?;
    Ok(Json(id))
}
```

Use `validator` for explicit constraints, or encode invariants into domain types (`NonEmptyVec<T>`, newtype wrappers) so invalid input cannot be constructed.

---

## SQL injection prevention

SQLx uses compile-time checked queries with parameter binding — safe by default.

```rust
// Safe — positional binding
let row = sqlx::query!(
    "SELECT id, total FROM orders WHERE id = $1",
    order_id
)
.fetch_optional(&pool)
.await?;

// Safe — query_as with binding
let order: Option<OrderRow> = sqlx::query_as!(
    OrderRow,
    "SELECT * FROM orders WHERE customer_id = $1 AND status = $2",
    customer_id,
    status,
)
.fetch_optional(&pool)
.await?;

// NEVER interpolate user input
let query = format!("SELECT * FROM orders WHERE id = '{}'", user_input);  // SQL injection
```

**Rules:**
- Use `sqlx::query!` macros for compile-time verification; use `query_as!` for typed results
- Never format user input into SQL strings
- Apply least-privilege DB credentials

---

## Subprocess safety

```rust
use std::process::Command;

// Safe — args as separate tokens; never pass to a shell
let output = Command::new("ffmpeg")
    .arg("-i").arg(&input_path)
    .arg(&output_path)
    .output()?;

// NEVER
let cmd = format!("ffmpeg -i {} out.mp4", user_input);
Command::new("sh").arg("-c").arg(&cmd).output()?;  // shell injection
```

**Rules:**
- Do not invoke shells with user-controlled data
- Sanitise and validate file paths before use; reject `..` traversal

---

## Dependency security

```bash
# Install cargo-audit
cargo install cargo-audit

# Audit for known vulnerabilities (RustSec advisory database)
cargo audit

# Deny specific categories in CI
cargo audit --deny warnings

# Check for outdated deps
cargo outdated
```

Add to CI:
```yaml
- run: cargo audit --deny warnings
- run: cargo deny check  # cargo-deny for broader policy enforcement
```

---

## Secrets hygiene

```rust
// Config validates at startup; fail before serving any request
fn main() -> anyhow::Result<()> {
    let config = Config::from_env().map_err(|e| anyhow::anyhow!("{e}"))?;
    // Do NOT log config fields that contain secrets
    tracing::info!(port = config.port, "starting server");
    ...
}
```

**Rules:**
- Never log `jwt_secret`, `database_url`, or any credential
- Implement `Debug` manually for types containing secrets to redact them
- Never commit `.env` files; document required vars in `.env.example`

---

## Security checklist

- [ ] All external input validated at the HTTP boundary (typed structs + `validator`)
- [ ] SQL queries use `sqlx::query!` macros; no string interpolation
- [ ] `Command::new` with arg list; no `sh -c` with user input
- [ ] `cargo audit --deny warnings` passes in CI
- [ ] Secrets never logged; `Debug` impls redact sensitive fields
- [ ] Stack traces not included in API error responses (`AppError` maps to status codes only)
