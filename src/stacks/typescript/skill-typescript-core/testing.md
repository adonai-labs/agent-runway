# typescript-core/testing.md

# Testing for TypeScript

---

## Core principles

- Tests are part of the system — design for testability from the start
- Test behaviour, not implementation — verify outcomes and business rules, not internal method calls
- Business rules should be testable without HTTP, a real database, or a running server
- A balanced portfolio: fast unit tests for logic, integration tests for infrastructure, E2E only for critical flows

---

## Test types and when to use them

| Type | What to test | Tools |
|------|-------------|-------|
| **Unit** | Domain logic, use cases, validators, mappers, pure functions | Vitest / Jest |
| **Integration** | Repositories, HTTP clients, message consumers against real infra | Vitest + Testcontainers |
| **API / E2E** | Critical flows end-to-end via HTTP | Supertest, Playwright |
| **Contract** | Service boundaries (consumer-driven) | Pact |

---

## Vitest (preferred) / Jest setup

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/*.d.ts'],
    },
  },
});
```

**Rules:**
- Prefer Vitest for new projects — faster, native ESM, first-class TypeScript
- Use Jest if the project already has it; do not migrate mid-project for its own sake
- Enable `globals: true` to avoid importing `describe/it/expect` in every file
- Run unit tests on every save in watch mode; integration tests in CI only

---

## Unit testing use cases

```typescript
// place-order.use-case.test.ts
import { describe, it, expect, vi } from 'vitest';
import { placeOrder } from './place-order.use-case';
import { ok } from '../shared/result';

const mockOrderRepo = {
  save: vi.fn().mockResolvedValue(undefined),
  findById: vi.fn(),
};
const mockEvents = {
  publish: vi.fn().mockResolvedValue(undefined),
};

describe('placeOrder', () => {
  it('saves the order and publishes the event', async () => {
    const result = await placeOrder(
      { customerId: 'c-1', lines: [{ productId: 'p-1', qty: 2 }] },
      { orderRepo: mockOrderRepo, events: mockEvents }
    );

    expect(result.ok).toBe(true);
    expect(mockOrderRepo.save).toHaveBeenCalledOnce();
    expect(mockEvents.publish).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'order.placed' })
    );
  });

  it('returns err when customer id is empty', async () => {
    const result = await placeOrder(
      { customerId: '', lines: [] },
      { orderRepo: mockOrderRepo, events: mockEvents }
    );
    expect(result.ok).toBe(false);
    expect(mockOrderRepo.save).not.toHaveBeenCalled();
  });
});
```

**Rules:**
- Inject dependencies; never import concrete infrastructure in use-case tests
- Assert outcomes (return value, side effects on mocks), not implementation steps
- One `describe` per use case; group related scenarios
- Name tests as plain English sentences: `'saves the order and publishes the event'`

---

## Mocking with Vitest

```typescript
// Prefer vi.fn() for simple mocks
const mockFn = vi.fn().mockResolvedValue({ id: '1' });

// Prefer vi.spyOn() when you want to partially mock a module
vi.spyOn(someService, 'findById').mockResolvedValue(null);

// Reset between tests to avoid cross-contamination
beforeEach(() => vi.clearAllMocks());
```

**Rules:**
- Avoid `vi.mock('module')` for modules you own — inject a fake instead
- Use `vi.mock` for third-party modules you cannot inject (e.g. `node:crypto`, SDKs)
- Always clear mocks in `beforeEach`; avoid shared state between tests

---

## Integration testing with Testcontainers

```typescript
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

beforeAll(async () => {
  const pg = await new PostgreSqlContainer().start();
  prisma = new PrismaClient({ datasources: { db: { url: pg.getConnectionUri() } } });
  await prisma.$executeRawUnsafe(/* run migrations */);
});

afterAll(async () => {
  await prisma.$disconnect();
});

it('saves and retrieves an order', async () => {
  const repo = new PrismaOrderRepository(prisma);
  const order = Order.create({ customerId: 'c-1', lines: [] }).value!;
  await repo.save(order);
  const found = await repo.findById(order.id);
  expect(found?.id).toEqual(order.id);
});
```

**Rules:**
- Use Testcontainers for real DB; do not use SQLite as a proxy for Postgres — behaviour differs
- Run migrations before the suite, not before each test
- Clean state between tests with transactions or `TRUNCATE` — do not rely on order
- Integration tests are slow; tag them and skip in watch mode

---

## API testing with Supertest

```typescript
import request from 'supertest';
import { buildApp } from '../app';

const app = buildApp();

it('POST /orders returns 201 with order id', async () => {
  const res = await request(app)
    .post('/orders')
    .set('Authorization', 'Bearer test-token')
    .send({ customerId: 'c-1', lines: [{ productId: 'p-1', qty: 1 }] });

  expect(res.status).toBe(201);
  expect(res.body).toMatchObject({ orderId: expect.any(String) });
});

it('POST /orders returns 400 for missing customerId', async () => {
  const res = await request(app).post('/orders').send({ lines: [] });
  expect(res.status).toBe(400);
});
```

---

## Test structure checklist

- [ ] Use cases tested without infrastructure dependencies
- [ ] Mocks injected via constructor or function parameter, not module-level patches
- [ ] One assertion per test concept (multiple `expect` is fine; multiple scenarios is not)
- [ ] Integration tests use real infrastructure via Testcontainers
- [ ] Tests clean up after themselves — no shared mutable state
- [ ] CI runs unit + integration; E2E only on main / release branches
