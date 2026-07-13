# rust-core/testing.md

# Testing for Rust

---

## Core principles

- Unit tests in `#[cfg(test)]` in the same file — test private implementation when useful
- Integration tests in `tests/` — test public API only
- Business logic must be testable without a running server or database
- Prefer fakes over mocks; Rust's type system makes fakes easy with trait implementations

---

## Unit tests

```rust
// src/domain/order.rs
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn new_order_returns_error_for_empty_lines() {
        let result = Order::new("c-1".to_string(), vec![]);
        assert!(matches!(result, Err(OrderError::Invalid { .. })));
    }

    #[test]
    fn new_order_succeeds_with_valid_lines() {
        let result = Order::new("c-1".to_string(), vec![OrderLine { product_id: "p-1".to_string(), qty: 2 }]);
        assert!(result.is_ok());
    }
}
```

---

## Service tests with fakes

```rust
// src/application/order_service.rs
#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Mutex;

    struct FakeOrderRepo {
        saved: Mutex<Vec<Order>>,
        error: Option<OrderError>,
    }

    #[async_trait::async_trait]
    impl OrderRepository for FakeOrderRepo {
        async fn find_by_id(&self, _id: &OrderId) -> Result<Option<Order>, OrderError> {
            Ok(None)
        }
        async fn save(&self, order: &Order) -> Result<(), OrderError> {
            if let Some(ref e) = self.error {
                return Err(e.clone());
            }
            self.saved.lock().unwrap().push(order.clone());
            Ok(())
        }
    }

    #[tokio::test]
    async fn place_order_saves_and_publishes() {
        let repo   = FakeOrderRepo { saved: Mutex::new(vec![]), error: None };
        let events = FakeEventPublisher::default();
        let svc    = OrderService::new(repo, events);

        let result = svc.place_order(PlaceOrderDto { customer_id: "c-1".into(), lines: sample_lines() }).await;

        assert!(result.is_ok());
        assert_eq!(svc.repo.saved.lock().unwrap().len(), 1);
    }

    #[tokio::test]
    async fn place_order_returns_error_for_empty_lines() {
        let svc = OrderService::new(FakeOrderRepo::default(), FakeEventPublisher::default());
        let result = svc.place_order(PlaceOrderDto { customer_id: "c-1".into(), lines: vec![] }).await;
        assert!(matches!(result, Err(OrderError::Invalid { .. })));
    }
}
```

---

## HTTP handler tests with `axum::test`

```rust
// tests/api_tests.rs
use axum::body::Body;
use axum::http::{Request, StatusCode};
use tower::ServiceExt;  // for `oneshot`

#[tokio::test]
async fn post_order_returns_201() {
    let app = build_test_app();

    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/orders")
                .header("Content-Type", "application/json")
                .body(Body::from(r#"{"customer_id":"c-1","lines":[{"product_id":"p-1","qty":1}]}"#))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::CREATED);
}

fn build_test_app() -> Router {
    let state = AppState {
        order_service: Arc::new(OrderService::new(FakeOrderRepo::default(), FakeEventPublisher::default())),
    };
    Router::new().route("/orders", post(place_order)).with_state(state)
}
```

---

## Integration tests with Testcontainers

```rust
// tests/integration/order_repo_test.rs
use testcontainers::{clients::Cli, images::postgres::Postgres};
use sqlx::PgPool;

#[tokio::test]
async fn save_and_find_order() {
    let docker = Cli::default();
    let pg     = docker.run(Postgres::default());
    let url    = format!("postgres://postgres:postgres@127.0.0.1:{}/postgres", pg.get_host_port_ipv4(5432));
    let pool   = PgPool::connect(&url).await.unwrap();

    sqlx::migrate!("./migrations").run(&pool).await.unwrap();

    let repo  = SqlxOrderRepo::new(pool);
    let order = Order::new("c-1".to_string(), sample_lines()).unwrap();

    repo.save(&order).await.unwrap();
    let found = repo.find_by_id(&order.id).await.unwrap();

    assert!(found.is_some());
    assert_eq!(found.unwrap().id, order.id);
}
```

---

## Checklist

- [ ] Domain logic tested in `#[cfg(test)]` without async or external deps
- [ ] Services tested with trait fakes; no real I/O in unit tests
- [ ] HTTP handlers tested with `axum::test` or `tower::ServiceExt::oneshot`
- [ ] Integration tests use Testcontainers; run separately from unit tests
- [ ] `cargo test` passes; `cargo test --no-fail-fast` in CI
- [ ] `cargo test -- --test-threads=4` if integration tests need isolation
