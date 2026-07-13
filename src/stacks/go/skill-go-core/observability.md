# go-core/observability.md

# Observability for Go

Practical observability for Go backend services using `slog` and OpenTelemetry.

---

## Structured logging with `slog`

`slog` is in the standard library from Go 1.21. No external dependency required for basic structured logging.

```go
// main.go — set up JSON handler in production
import "log/slog"

func setupLogger(level string) *slog.Logger {
    lvl := slog.LevelInfo
    _ = lvl.UnmarshalText([]byte(level))

    handler := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: lvl})
    return slog.New(handler)
}
```

**Correlation IDs via middleware:**
```go
// middleware/correlation.go
type contextKey string
const correlationIDKey contextKey = "correlation_id"

func CorrelationID(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        id := r.Header.Get("X-Correlation-ID")
        if id == "" {
            id = uuid.New().String()
        }
        ctx := context.WithValue(r.Context(), correlationIDKey, id)
        w.Header().Set("X-Correlation-ID", id)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

// In handlers or services — extract and log with it
func CorrelationIDFrom(ctx context.Context) string {
    if id, ok := ctx.Value(correlationIDKey).(string); ok {
        return id
    }
    return ""
}

// Usage
logger.InfoContext(ctx, "order placed",
    slog.String("order_id", string(o.ID)),
    slog.String("correlation_id", CorrelationIDFrom(ctx)),
)
```

**Log levels:**
| Level | Use when |
|-------|----------|
| `Error` | Unexpected failure; requires attention |
| `Warn` | Expected degraded state; retry; partial failure |
| `Info` | Significant business event |
| `Debug` | Diagnostic detail (disabled in production) |

---

## OpenTelemetry

```go
// internal/platform/telemetry/tracer.go
package telemetry

import (
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
    "go.opentelemetry.io/otel/sdk/trace"
)

func InitTracer(ctx context.Context, serviceName string) (func(), error) {
    exp, err := otlptracehttp.New(ctx)
    if err != nil {
        return nil, fmt.Errorf("create trace exporter: %w", err)
    }
    tp := trace.NewTracerProvider(
        trace.WithBatcher(exp),
        trace.WithResource(resource.NewWithAttributes(
            semconv.SchemaURL,
            semconv.ServiceName(serviceName),
        )),
    )
    otel.SetTracerProvider(tp)
    return func() { _ = tp.Shutdown(context.Background()) }, nil
}
```

**Manual spans for business operations:**
```go
tracer := otel.Tracer("order-service")

func (s *OrderService) PlaceOrder(ctx context.Context, dto PlaceOrderDTO) (OrderID, error) {
    ctx, span := tracer.Start(ctx, "order.place")
    defer span.End()

    span.SetAttributes(attribute.String("customer.id", dto.CustomerID))

    result, err := s.placeOrder(ctx, dto)
    if err != nil {
        span.RecordError(err)
        span.SetStatus(codes.Error, err.Error())
    }
    return result, err
}
```

---

## Health endpoints

```go
// internal/platform/health/handler.go
func LiveHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    _, _ = w.Write([]byte(`{"status":"ok"}`))
}

func ReadyHandler(db *sql.DB) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        if err := db.PingContext(r.Context()); err != nil {
            http.Error(w, `{"status":"unavailable"}`, http.StatusServiceUnavailable)
            return
        }
        w.Header().Set("Content-Type", "application/json")
        _, _ = w.Write([]byte(`{"status":"ready"}`))
    }
}
```

---

## Checklist

- [ ] `slog.JSONHandler` in production; `slog.TextHandler` in development
- [ ] Correlation ID generated per request; propagated via context and response header
- [ ] OpenTelemetry SDK initialised at startup; shutdown registered
- [ ] Manual spans for significant business operations
- [ ] `/health/live` and `/health/ready` registered on the router
- [ ] Secrets and PII not logged; `slog.String` keys reviewed
