# node-core/testing.md

# Testing for Node.js

---

## Core principles

- Test process behaviour, not just units — graceful shutdown, signal handling, stream back-pressure, and queue consumer lifecycle all need tests
- Keep business logic independent of the HTTP framework so use cases can be tested without starting a server
- Prefer real infrastructure in integration tests (Testcontainers); avoid in-memory fakes that diverge from production behaviour

---

## Test types for Node.js services

| Type | What to test | Tools |
|------|-------------|-------|
| **Unit** | Use cases, domain logic, stream transformers, utility functions | Vitest / Jest |
| **Integration** | Repositories, queue consumers, HTTP clients against real infra | Vitest + Testcontainers |
| **API** | HTTP layer — routing, middleware, error mapping, auth | Supertest |
| **Process** | Startup, shutdown, signal handling, unhandled rejection behaviour | Node child_process |

---

## API testing with Supertest

Test the HTTP layer without starting a real server — Supertest binds directly to the Express/Fastify app.

```typescript
import request from 'supertest';
import { buildApp } from '../api/app.js';
import { createTestDeps } from './helpers/deps.js';

describe('POST /orders', () => {
  const deps = createTestDeps();  // wires fake repos and event bus
  const app = buildApp(deps);

  it('returns 201 with orderId on valid input', async () => {
    const res = await request(app)
      .post('/orders')
      .set('Authorization', 'Bearer valid-token')
      .send({ customerId: 'c-1', lines: [{ productId: 'p-1', quantity: 2 }] });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ orderId: expect.any(String) });
  });

  it('returns 400 when lines array is empty', async () => {
    const res = await request(app)
      .post('/orders')
      .set('Authorization', 'Bearer valid-token')
      .send({ customerId: 'c-1', lines: [] });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('returns 401 when no token is provided', async () => {
    const res = await request(app).post('/orders').send({ customerId: 'c-1', lines: [] });
    expect(res.status).toBe(401);
  });
});
```

**Rules:**
- Build the app with injected test dependencies — do not start a real server with `listen()`
- Test each error path explicitly: missing auth, invalid payload, missing resource, downstream failure
- Assert `Content-Type: application/json` on JSON endpoints

---

## Integration testing with Testcontainers

```typescript
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer, type StartedRedisContainer } from '@testcontainers/redis';

let pg: StartedPostgreSqlContainer;
let redis: StartedRedisContainer;

beforeAll(async () => {
  [pg, redis] = await Promise.all([
    new PostgreSqlContainer('postgres:16-alpine').start(),
    new RedisContainer('redis:7-alpine').start(),
  ]);
  await runMigrations(pg.getConnectionUri());
}, 60_000);

afterAll(async () => {
  await Promise.all([pg.stop(), redis.stop()]);
});

beforeEach(async () => {
  await truncateAllTables(pg.getConnectionUri());
});

it('saves and retrieves an order via the repository', async () => {
  const repo = new PostgresOrderRepository(pg.getConnectionUri());
  const order = Order.create({ customerId: 'c-1', lines: [] }).value!;
  await repo.save(order);
  const found = await repo.findById(order.id);
  expect(found?.id).toEqual(order.id);
});
```

**Rules:**
- Start containers in `beforeAll`, clean state in `beforeEach` — do not restart containers per test
- Use `Promise.all` to start multiple containers in parallel
- Set a generous `beforeAll` timeout (60s) — container start can be slow in CI

---

## Testing queue consumers

```typescript
// Use an in-process test message bus or a real queue via Testcontainers
it('processes an order.placed event and sends a confirmation email', async () => {
  const emailSpy = vi.fn();
  const consumer = new OrderConfirmationConsumer({ emailService: { send: emailSpy } });

  await consumer.handleMessage({
    type: 'order.placed',
    orderId: 'o-1',
    customerId: 'c-1',
    occurredAt: new Date(),
  });

  expect(emailSpy).toHaveBeenCalledWith(expect.objectContaining({ orderId: 'o-1' }));
});

// Test idempotency — duplicate messages must not cause duplicate side effects
it('does not send duplicate emails when the same message is processed twice', async () => {
  const emailSpy = vi.fn();
  const consumer = new OrderConfirmationConsumer({ emailService: { send: emailSpy } });
  const msg = { type: 'order.placed', orderId: 'o-1', customerId: 'c-1', occurredAt: new Date() };

  await consumer.handleMessage(msg);
  await consumer.handleMessage(msg);

  expect(emailSpy).toHaveBeenCalledOnce();
});
```

---

## Testing streams

```typescript
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

it('parses JSON lines and emits objects', async () => {
  const input = Readable.from(['{"id":1}\n', '{"id":2}\n']);
  const parser = new JsonLineParser();
  const results: unknown[] = [];

  const sink = new Writable({
    objectMode: true,
    write(chunk, _enc, cb) { results.push(chunk); cb(); },
  });

  await pipeline(input, parser, sink);
  expect(results).toEqual([{ id: 1 }, { id: 2 }]);
});
```

---

## Testing process lifecycle

```typescript
import { fork } from 'node:child_process';

it('exits cleanly on SIGTERM', async () => {
  const child = fork('./src/index.js', [], { silent: true });

  // Wait for the server to start
  await new Promise<void>((resolve) => child.stdout!.once('data', () => resolve()));

  // Send SIGTERM and wait for clean exit
  child.kill('SIGTERM');
  const code = await new Promise<number>((resolve) => child.once('exit', (c) => resolve(c ?? 1)));

  expect(code).toBe(0);
});
```
