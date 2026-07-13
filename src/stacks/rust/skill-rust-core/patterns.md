# rust-core/patterns.md

# Application Patterns

Idiomatic Rust patterns — applied when the problem justifies the structure.

**Simplicity rule:** a struct with methods is the right starting point. Traits, generics, and `dyn Trait` add flexibility at the cost of complexity — introduce them only when there is a concrete reason (testability, multiple implementations, library reuse).

---

## Error handling

Use `thiserror` in library/domain code; `anyhow` in application and binary code.

```rust
// domain/error.rs — library error type
use thiserror::Error;

#[derive(Debug, Error)]
pub enum OrderError {
    #[error("order not found: {id}")]
    NotFound { id: String },
    #[error("invalid order: {reason}")]
    Invalid { reason: String },
    #[error("store error: {0}")]
    Store(#[from] sqlx::Error),
}

// application code — anyhow for flexible context
use anyhow::{Context, Result};

async fn place_order(dto: PlaceOrderDto) -> Result<OrderId> {
    let order = Order::new(dto.customer_id, dto.lines)
        .map_err(|e| anyhow::anyhow!("invalid order: {e}"))?;

    repo.save(&order).await
        .with_context(|| format!("saving order {}", order.id))?;

    Ok(order.id)
}
```

**Rules:**
- Never `unwrap()` in production code; use `?` or explicit `match`
- `expect()` only for programmer invariants with a clear message
- Propagate errors with `?`; add context at the layer where you have useful information

---

## Trait-based dependency injection

```rust
// domain/ports.rs
use async_trait::async_trait;

#[async_trait]
pub trait OrderRepository: Send + Sync {
    async fn find_by_id(&self, id: &OrderId) -> Result<Option<Order>, OrderError>;
    async fn save(&self, order: &Order) -> Result<(), OrderError>;
}

#[async_trait]
pub trait EventPublisher: Send + Sync {
    async fn publish(&self, event: DomainEvent) -> Result<(), OrderError>;
}

// application/order_service.rs — generic over repos
pub struct OrderService<R, E>
where
    R: OrderRepository,
    E: EventPublisher,
{
    repo:   R,
    events: E,
}

impl<R: OrderRepository, E: EventPublisher> OrderService<R, E> {
    pub fn new(repo: R, events: E) -> Self {
        Self { repo, events }
    }

    pub async fn place_order(&self, dto: PlaceOrderDto) -> Result<OrderId, OrderError> {
        let order = Order::new(dto.customer_id, dto.lines)?;
        self.repo.save(&order).await?;
        self.events.publish(DomainEvent::OrderPlaced { id: order.id.clone() }).await?;
        Ok(order.id)
    }
}
```

Prefer generics (`<R: Trait>`) when the concrete type is known at compile time (tests, wiring in `main`). Use `Arc<dyn Trait>` in `AppState` when the concrete type varies at runtime (e.g. different backends per tenant).

---

## Axum application state

```rust
// main.rs
#[derive(Clone)]
struct AppState {
    order_service: Arc<dyn OrderServiceTrait + Send + Sync>,
    config:        Arc<Config>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let config = Config::from_env().map_err(|e| anyhow::anyhow!(e))?;
    let pool   = sqlx::PgPool::connect(&config.database_url).await?;

    let state = AppState {
        order_service: Arc::new(OrderService::new(
            SqlxOrderRepo::new(pool.clone()),
            NatsEventPublisher::new(),
        )),
        config: Arc::new(config),
    };

    let app = Router::new()
        .route("/orders", post(place_order))
        .with_state(state);

    axum::serve(TcpListener::bind("0.0.0.0:8080").await?, app).await?;
    Ok(())
}
```

---

## Graceful shutdown

```rust
// Shutdown on SIGINT / SIGTERM
use tokio::signal;

async fn shutdown_signal() {
    let ctrl_c = async { signal::ctrl_c().await.expect("failed to install Ctrl+C handler") };
    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("failed to install SIGTERM handler")
            .recv()
            .await;
    };
    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! { _ = ctrl_c => {}, _ = terminate => {} }
    tracing::info!("shutdown signal received");
}

// In main — pass to axum::serve
axum::serve(listener, app)
    .with_graceful_shutdown(shutdown_signal())
    .await?;
```
