# rust-core/observability.md

# Observability for Rust

Practical observability using `tracing` and OpenTelemetry.

---

## Structured logging with `tracing`

`tracing` is the standard for structured, async-aware instrumentation in Rust.

```rust
// Cargo.toml
// tracing = "0.1"
// tracing-subscriber = { version = "0.3", features = ["env-filter", "json"] }

use tracing_subscriber::{fmt, layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

pub fn init_tracing() {
    let env_filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info"));

    let json_layer = fmt::layer()
        .json()
        .with_current_span(true)
        .with_span_list(false);

    tracing_subscriber::registry()
        .with(env_filter)
        .with(json_layer)
        .init();
}
```

**Structured logging in code:**
```rust
use tracing::{info, error, instrument};

// Auto-instrument a function — creates a span with function name
#[instrument(skip(self, dto), fields(customer_id = %dto.customer_id))]
pub async fn place_order(&self, dto: PlaceOrderDto) -> Result<OrderId, OrderError> {
    info!("placing order");

    let order = Order::new(dto.customer_id, dto.lines)?;
    self.repo.save(&order).await.map_err(|e| {
        error!(error = %e, "failed to save order");
        e
    })?;

    info!(order_id = %order.id, "order placed");
    Ok(order.id)
}
```

**Log levels:**
| Level | Use when |
|-------|----------|
| `error!` | Unexpected failure; requires attention |
| `warn!` | Expected degraded state; retry; partial failure |
| `info!` | Significant business event |
| `debug!` | Diagnostic detail (disabled in production) |
| `trace!` | Very fine-grained — request/response bodies, loop iterations |

---

## OpenTelemetry

```toml
# Cargo.toml
opentelemetry = "0.23"
opentelemetry-otlp = { version = "0.16", features = ["http-proto"] }
opentelemetry_sdk = { version = "0.23", features = ["rt-tokio"] }
tracing-opentelemetry = "0.24"
```

```rust
use opentelemetry::global;
use opentelemetry_otlp::WithExportConfig;
use tracing_opentelemetry::OpenTelemetryLayer;

pub fn init_telemetry(service_name: &str) -> anyhow::Result<()> {
    let tracer = opentelemetry_otlp::new_pipeline()
        .tracing()
        .with_exporter(opentelemetry_otlp::new_exporter().http())
        .with_trace_config(opentelemetry_sdk::trace::config().with_resource(
            opentelemetry_sdk::Resource::new(vec![
                opentelemetry::KeyValue::new("service.name", service_name.to_string()),
            ]),
        ))
        .install_batch(opentelemetry_sdk::runtime::Tokio)?;

    tracing_subscriber::registry()
        .with(EnvFilter::from_default_env())
        .with(fmt::layer().json())
        .with(OpenTelemetryLayer::new(tracer))
        .init();

    Ok(())
}

// Shutdown in main
pub fn shutdown_telemetry() {
    global::shutdown_tracer_provider();
}
```

---

## Health endpoints (Axum)

```rust
// src/routes/health.rs
use axum::{http::StatusCode, Json};
use serde_json::{json, Value};

pub async fn liveness() -> Json<Value> {
    Json(json!({"status": "ok"}))
}

pub async fn readiness(
    State(pool): State<PgPool>,
) -> Result<Json<Value>, StatusCode> {
    sqlx::query("SELECT 1")
        .execute(&pool)
        .await
        .map_err(|_| StatusCode::SERVICE_UNAVAILABLE)?;
    Ok(Json(json!({"status": "ready"})))
}

// Register in router
let app = Router::new()
    .route("/health/live", get(health::liveness))
    .route("/health/ready", get(health::readiness));
```

---

## Checklist

- [ ] `tracing-subscriber` initialised with JSON format in production; `RUST_LOG` controls level
- [ ] `#[instrument]` used on service methods; sensitive fields excluded with `skip`
- [ ] OpenTelemetry SDK initialised at startup; `shutdown_tracer_provider()` called on exit
- [ ] `/health/live` and `/health/ready` registered on the router
- [ ] Secrets and PII excluded from `tracing` fields
