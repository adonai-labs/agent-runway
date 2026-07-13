# node-core/reference.md

# Reference

Common commands, useful built-ins, and Node.js toolchain reference.

---

## package.json scripts

```jsonc
{
  "scripts": {
    "start": "node dist/index.js",
    "start:dev": "node --watch --env-file=.env src/index.ts",  // Node 22+ native watch
    "build": "tsc --project tsconfig.json",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "format:check": "prettier --check src",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:coverage": "vitest run --coverage",
    "audit": "npm audit --audit-level=high",
    "clean": "rm -rf dist"
  }
}
```

---

## Useful Node.js built-ins (no npm install needed)

| Module | Use for |
|--------|---------|
| `node:fs/promises` | File system operations (async) |
| `node:path` | Cross-platform path handling |
| `node:crypto` | `randomUUID()`, `createHash()`, `timingSafeEqual()` |
| `node:stream/promises` | `pipeline()`, `finished()` |
| `node:util` | `promisify()`, `parseArgs()`, `inspect()` |
| `node:worker_threads` | CPU-bound work off the event loop |
| `node:child_process` | `execFile()`, `spawn()` |
| `node:http` / `node:https` | Raw HTTP client/server (prefer a library for APIs) |
| `node:events` | `EventEmitter` |
| `node:timers/promises` | `setTimeout`, `setInterval` as promises |

```typescript
// Prefer node: prefix for built-ins — makes it explicit and avoids shadowing
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';

await delay(1000);  // promisified delay
```

---

## Express boilerplate

```typescript
// src/api/app.ts
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { requestLogger } from './middleware/request-logger.js';
import { errorHandler } from './middleware/error-handler.js';
import { orderRouter } from './routes/orders.js';
import type { AppDependencies } from '../composition-root.js';

export function buildApp(deps: AppDependencies) {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: deps.config.ALLOWED_ORIGINS?.split(',') }));
  app.use(express.json({ limit: '100kb' }));
  app.use(requestLogger);

  app.use('/orders', orderRouter(deps));

  app.use(errorHandler);
  return app;
}
```

---

## Fastify boilerplate

```typescript
import Fastify from 'fastify';
import fastifyHelmet from '@fastify/helmet';

export async function buildApp(deps: AppDependencies) {
  const app = Fastify({ logger: false }); // use Pino directly

  await app.register(fastifyHelmet);

  app.addHook('onRequest', (req, _reply, done) => {
    req.log = logger.child({ requestId: req.id });
    done();
  });

  app.register(orderRoutes, { prefix: '/orders', ...deps });
  return app;
}
```

---

## Useful runtime flags

```bash
# Node.js 22+ — native TypeScript support (experimental, no type checking)
node --experimental-strip-types src/index.ts

# Native watch mode (Node 18+)
node --watch src/index.js

# Load env file (Node 20.6+)
node --env-file=.env src/index.js

# Enable source map support for readable stack traces
node --enable-source-maps dist/index.js

# Inspect for debugging
node --inspect-brk dist/index.js
```

---

## Common CLI tools

```bash
# Dependency hygiene
npm audit --audit-level=high
npx depcheck                     # unused dependencies
npx npm-check-updates -u         # show available updates

# Type-checking without build
npx tsc --noEmit

# Profile CPU (generates flamegraph-compatible output)
node --prof dist/index.js
node --prof-process isolate-*.log > profile.txt
```
