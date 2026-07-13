# node-core/observability.md

# Observability for Node.js

Practical observability guidance for Node.js backend services.

---

## Core principles

- Observability is a production requirement, not a nice-to-have
- Structured JSON logs are queryable; free-text is not — always use JSON in production
- Correlation IDs connect logs across async boundaries and services
- Metrics and traces reduce mean time to diagnose; logs reduce mean time to understand

---

## Structured logging with Pino

```typescript
// src/shared/logger.ts
import pino from 'pino';
import { config } from '../config/index.js';

export const logger = pino({
  level: config.LOG_LEVEL,
  base: { service: 'order-api', version: process.env.npm_package_version },
  ...(config.NODE_ENV !== 'production' && {
    transport: { target: 'pino-pretty', options: { colorize: true } },
  }),
  redact: {
    paths: ['req.headers.authorization', '*.password', '*.token', '*.secret'],
    censor: '[REDACTED]',
  },
  serializers: {
    err: pino.stdSerializers.err,  // includes stack, type, message
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
});
```

**Request-scoped child logger:**
```typescript
// Express middleware
app.use((req: AppRequest, _res, next) => {
  req.id = (req.headers['x-request-id'] as string) ?? crypto.randomUUID();
  req.log = logger.child({
    requestId: req.id,
    method: req.method,
    path: req.path,
  });
  next();
});

// Propagate correlation ID to downstream services
outboundHttpClient.defaults.headers['x-request-id'] = req.id;
```

**Log levels — when to use each:**
| Level | Use when |
|-------|----------|
| `fatal` | Process cannot continue; about to exit |
| `error` | Unexpected failure that needs attention; operation failed |
| `warn` | Expected degraded state; retrying; partial failure |
| `info` | Significant business event; request received/completed |
| `debug` | Diagnostic detail useful for local development |

---

## OpenTelemetry

```typescript
// src/instrumentation.ts — import before everything else in index.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

const sdk = new NodeSDK({
  resource: new Resource({ [SEMRESATTRS_SERVICE_NAME]: 'order-api' }),
  traceExporter: new OTLPTraceExporter(),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter(),
    exportIntervalMillis: 30_000,
  }),
  instrumentations: [getNodeAutoInstrumentations({
    '@opentelemetry/instrumentation-fs': { enabled: false },  // too noisy
  })],
});

sdk.start();
process.once('SIGTERM', () => sdk.shutdown().catch(console.error));
```

**Custom spans:**
```typescript
import { trace, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('order-service');

async function processOrderMessage(msg: OrderPlacedEvent) {
  await tracer.startActiveSpan('queue.order.process', async (span) => {
    span.setAttribute('order.id', msg.orderId);
    try {
      await sendConfirmationEmail(msg);
    } catch (err) {
      span.setStatus({ code: SpanStatusCode.ERROR });
      span.recordException(err as Error);
      throw err;
    } finally {
      span.end();
    }
  });
}
```

---

## Memory and CPU profiling

```typescript
// Heap snapshot on demand — useful for diagnosing memory leaks in production
import { writeHeapSnapshot } from 'node:v8';

process.on('SIGUSR2', () => {
  const file = writeHeapSnapshot();
  logger.info({ file }, 'heap snapshot written');
});
```

**Memory leak signals to monitor:**
- Heap used increases monotonically over time without corresponding user load increase
- `process.memoryUsage().heapUsed` growing across multiple GC cycles
- Event listener count increasing (run `process.listeners('data').length`)

```typescript
// Periodic memory logging — useful baseline
setInterval(() => {
  const mem = process.memoryUsage();
  logger.debug({
    heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
    rssMs: Math.round(mem.rss / 1024 / 1024),
  }, 'memory usage');
}, 30_000);
```

---

## Health endpoints

```typescript
app.get('/health/live', (_req, res) => res.status(200).json({ status: 'ok' }));

app.get('/health/ready', async (_req, res) => {
  const checks = await Promise.allSettled([
    db.query('SELECT 1'),
    redis.ping(),
  ]);

  const failed = checks.filter((c) => c.status === 'rejected');
  if (failed.length > 0) {
    failed.forEach((f) => logger.error({ err: (f as PromiseRejectedResult).reason }, 'readiness check failed'));
    return res.status(503).json({ status: 'unavailable' });
  }
  res.status(200).json({ status: 'ready' });
});
```

---

## Observability checklist

- [ ] Pino configured; JSON output in production, pretty in development
- [ ] `redact` configured for sensitive fields
- [ ] Correlation ID generated per request; propagated to downstream calls
- [ ] Child logger bound to request context; used throughout handler chain
- [ ] OpenTelemetry SDK initialised before app code
- [ ] Auto-instrumentation enabled; noisy instrumentations disabled
- [ ] Custom spans for significant business operations
- [ ] `/health/live` and `/health/ready` endpoints defined
- [ ] Periodic memory usage logged; heap snapshot handler registered
