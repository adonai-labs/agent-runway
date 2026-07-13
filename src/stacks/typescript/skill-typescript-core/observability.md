# typescript-core/observability.md

# Observability for TypeScript

Practical observability guidance for TypeScript backend applications.

---

## Core principles

- Design observability alongside the feature — do not add it after incidents
- Favour useful signals: logs, metrics, and traces that answer "what, where, why, what next"
- Structured logs are queryable; free-text logs are not — always emit JSON in production
- Correlation IDs connect logs across services and async boundaries

---

## Structured logging with Pino

Pino is the recommended logger for Node.js/TypeScript — low overhead, JSON-native.

```typescript
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  ...(process.env.NODE_ENV !== 'production' && {
    transport: { target: 'pino-pretty' },  // human-readable in dev only
  }),
  base: { service: 'order-api', version: process.env.APP_VERSION },
});
```

**Child loggers for request context:**
```typescript
// Middleware — attach correlation ID and child logger to request
app.use((req: AppRequest, _res, next) => {
  req.correlationId = req.headers['x-correlation-id'] as string ?? crypto.randomUUID();
  req.log = logger.child({ correlationId: req.correlationId, path: req.path });
  next();
});

// In handlers — use the request-scoped logger
req.log.info({ orderId }, 'order placed');
req.log.error({ err, orderId }, 'failed to place order');
```

**Rules:**
- Use `logger.child()` to bind request-scoped context; never pass correlation ID as a parameter through all calls
- Log at the right level: `error` for unexpected failures, `warn` for expected degraded states, `info` for significant business events, `debug` for diagnostic detail
- Never log PII (email, name, payment data) unless masked
- Include `err` (the error object) in error logs — Pino serialises the stack automatically

---

## OpenTelemetry tracing

```typescript
// instrumentation.ts — initialise before importing anything else
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({ url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT }),
  instrumentations: [getNodeAutoInstrumentations()],
  serviceName: 'order-api',
});

sdk.start();
process.on('SIGTERM', () => sdk.shutdown());
```

**Manual spans for business operations:**
```typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('order-service');

async function placeOrder(dto: PlaceOrderDto): Promise<Result<OrderId, OrderError>> {
  return tracer.startActiveSpan('order.place', async (span) => {
    try {
      span.setAttribute('customer.id', dto.customerId);
      const result = await doPlaceOrder(dto);
      if (!result.ok) span.setStatus({ code: SpanStatusCode.ERROR, message: result.error });
      return result;
    } finally {
      span.end();
    }
  });
}
```

**Rules:**
- Auto-instrumentation covers HTTP, DB, and common libraries — add manual spans only for significant business operations
- Set `span.setStatus(ERROR)` on failures; do not swallow errors silently
- Propagate trace context across service calls via HTTP headers (OpenTelemetry handles this automatically with auto-instrumentation)

---

## Metrics

```typescript
import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('order-service');

const ordersPlaced = meter.createCounter('orders.placed', {
  description: 'Number of orders successfully placed',
});
const orderDuration = meter.createHistogram('orders.place.duration_ms', {
  description: 'Duration of place order operation in milliseconds',
});

// In use case
const start = Date.now();
const result = await placeOrder(dto);
if (result.ok) ordersPlaced.add(1, { region: env.REGION });
orderDuration.record(Date.now() - start);
```

**Key metrics to emit:**
- Request count and error rate per endpoint
- Use-case duration histograms
- Queue depth and consumer lag for async workers
- Dependency health (DB pool size, external API latency)

---

## Health checks

```typescript
app.get('/health/live', (_req, res) => res.json({ status: 'ok' }));

app.get('/health/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ready' });
  } catch (err) {
    logger.error({ err }, 'readiness check failed');
    res.status(503).json({ status: 'unavailable' });
  }
});
```

**Rules:**
- Liveness: the process is alive (no dependencies checked)
- Readiness: all critical dependencies are reachable — used by load balancers and Kubernetes
- Never fail liveness because a downstream dependency is slow

---

## Observability checklist

- [ ] Pino configured with JSON output in production, pretty in development
- [ ] Correlation ID generated per request and propagated via child logger
- [ ] OpenTelemetry SDK initialised before app code; auto-instrumentation enabled
- [ ] Manual spans for critical business operations
- [ ] Business metrics (counters, histograms) emitted for key operations
- [ ] `/health/live` and `/health/ready` endpoints defined
- [ ] No PII in logs; error objects serialised (not `.toString()`)
