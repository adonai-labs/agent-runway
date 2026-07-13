# node-core/architecture.md

# Architecture

Project structure and architectural standards for Node.js backend services.

---

## Project structure

```
src/
├── config/           ← env validation, typed config object
├── domain/           ← business rules, entities, port interfaces (no runtime deps)
├── application/      ← use cases, DTOs; depends on domain only
├── infrastructure/   ← DB, queues, HTTP clients, cache — implements domain ports
├── api/              ← HTTP layer: routes, middleware, controllers
├── workers/          ← background jobs, queue consumers
└── shared/           ← logger, errors, utilities; no domain or infra imports
tests/
├── unit/
├── integration/
└── e2e/
```

Entry point at `src/index.ts` — compose the application from the outside in:
1. Validate config
2. Create infrastructure (DB connection, queue client)
3. Wire use cases with infrastructure
4. Mount HTTP server or start workers
5. Register shutdown handlers

---

## Module system

- Use ESM (`"type": "module"` in `package.json`) for new projects
- Use CommonJS only for legacy codebases or when a critical dependency does not support ESM
- Do not mix `require` and `import` in the same codebase — pick one and be consistent

---

## Layering rules

| Layer | May import | Must not import |
|-------|-----------|-----------------|
| Domain | Nothing external | Infrastructure, HTTP framework, ORM |
| Application | Domain | Infrastructure, HTTP framework |
| Infrastructure | Domain, Application | HTTP framework delivery layer |
| API | Application | Domain entities directly, Infrastructure |
| Config / Shared | Node built-ins | Domain, Application, Infrastructure |

---

## Hexagonal architecture for services with multiple entry points

When a service has both an HTTP API and a message queue consumer, treat each as a separate adapter:

```
src/
├── core/              ← domain + application (pure logic)
├── adapters/
│   ├── http/          ← Express/Fastify routes and middleware
│   ├── queue/         ← SQS/Kafka/RabbitMQ consumers
│   └── db/            ← repository implementations
└── infrastructure/    ← DB client, queue client, HTTP client creation
```

Both the HTTP adapter and the queue adapter call the same use cases — the core never knows which adapter triggered it.

---

## Configuration

```typescript
// src/config/index.ts
import { z } from 'zod';

const ConfigSchema = z.object({
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export const config = ConfigSchema.parse(process.env);
export type Config = z.infer<typeof ConfigSchema>;
```

**Rules:**
- Validate all required env vars at startup; fail fast with a clear error message
- Export a single typed `config` object; do not scatter `process.env` reads throughout the codebase
- Do not default-fill secrets — missing secret at startup is better than silent wrong behaviour

---

## Process entry point pattern

```typescript
// src/index.ts
import { createServer } from './api/server.js';
import { connectDatabase } from './infrastructure/database.js';
import { config } from './config/index.js';
import { logger } from './shared/logger.js';

async function main() {
  const db = await connectDatabase(config.DATABASE_URL);
  const server = createServer({ db, config });

  await server.listen({ port: config.PORT });
  logger.info({ port: config.PORT }, 'server started');

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'shutting down');
    await server.close();
    await db.end();
    process.exit(0);
  };

  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('Fatal startup error', err);
  process.exit(1);
});
```
