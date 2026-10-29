# Node.js Spec Template (Clean Architecture + Clean Code)

Use this template when the active stack is Node.js.

## Stack Scaffold Proposal

```text
src/
  <feature>/
    domain/            # entities, value objects, domain errors — no framework imports
    application/       # use cases + port interfaces
    infrastructure/    # DB repositories, queue publishers, HTTP clients
    api/               # Express 5 / Fastify routes: validate (Zod), call use case, map response
  shared/
    config.ts          # env validated with Zod at startup
    logger.ts          # Pino
    errors.ts          # AppError hierarchy
  app.ts               # buildApp(deps) — no listen()
  main.ts              # composition root, server start, graceful shutdown
test/
  unit/
  integration/         # Vitest + Testcontainers
  api/                 # Supertest against buildApp()
```

## Clean Architecture Guidance

- Domain and application import nothing from Express/Fastify, DB drivers, or SDKs.
- Use cases depend on port interfaces; infrastructure implements them.
- HTTP handlers and queue consumers are thin adapters over the same use cases.
- `main.ts` wires concrete dependencies and owns process lifecycle (SIGTERM/SIGINT).

## Clean Code Guidance

- Validate all input at the boundary with Zod; infer types from schemas.
- No floating promises; every outbound call has a timeout.
- Typed errors mapped to responses in one error handler.
- Small functions named by intent (`placeOrder`, not `handle`).
