# python-core/observability.md

# Observability for Python

Practical observability for Python backend services.

---

## Structured logging

Prefer `structlog` for structured, context-aware logging. Fall back to the standard `logging` module with a JSON formatter if keeping dependencies minimal.

```python
# structlog setup (recommended)
import structlog, logging

logging.basicConfig(level=logging.INFO, format="%(message)s")
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
)

logger = structlog.get_logger()
```

**Request-scoped correlation IDs (FastAPI):**
```python
from fastapi import Request
import structlog, uuid

@app.middleware("http")
async def correlation_id_middleware(request: Request, call_next):
    correlation_id = request.headers.get("x-correlation-id", str(uuid.uuid4()))
    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(
        correlation_id=correlation_id,
        path=request.url.path,
        method=request.method,
    )
    response = await call_next(request)
    response.headers["x-correlation-id"] = correlation_id
    return response
```

**Log levels:**
| Level | Use when |
|-------|----------|
| `critical` | Service cannot continue |
| `error` | Unexpected failure; requires attention |
| `warning` | Expected degraded state; retry; partial failure |
| `info` | Significant business event |
| `debug` | Diagnostic detail for development |

---

## OpenTelemetry

```python
# instrumentation.py — import before app code
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor

provider = TracerProvider()
provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter()))
trace.set_tracer_provider(provider)

# Auto-instrument FastAPI and SQLAlchemy
FastAPIInstrumentor.instrument()
SQLAlchemyInstrumentor().instrument()
```

**Manual spans for business operations:**
```python
tracer = trace.get_tracer("order-service")

async def place_order(self, dto: PlaceOrderDto) -> OrderId:
    with tracer.start_as_current_span("order.place") as span:
        span.set_attribute("customer.id", str(dto.customer_id))
        try:
            result = await self._do_place_order(dto)
            return result
        except Exception as exc:
            span.record_exception(exc)
            span.set_status(trace.StatusCode.ERROR)
            raise
```

---

## Health endpoints (FastAPI)

```python
@app.get("/health/live")
async def liveness() -> dict:
    return {"status": "ok"}

@app.get("/health/ready")
async def readiness(db: AsyncSession = Depends(get_db)) -> dict:
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "ready"}
    except Exception as exc:
        logger.error("readiness check failed", exc_info=exc)
        raise HTTPException(status_code=503, detail="unavailable")
```

---

## Checklist

- [ ] `structlog` configured with JSON output in production
- [ ] Correlation ID generated per request and bound to log context
- [ ] OpenTelemetry SDK initialised; auto-instrumentation for FastAPI and SQLAlchemy
- [ ] Manual spans for significant business operations
- [ ] `/health/live` and `/health/ready` endpoints defined
- [ ] No PII in logs; sensitive keys redacted
