# typescript-core/architecture.md

# Architecture

Structural standards for TypeScript applications — scaled to complexity, not applied ceremonially.

**Default rule: start flat. Add layers when complexity justifies it.**

For small services (one domain, one team, fewer than ~10 use cases): a simple `src/services/`, `src/routes/`, `src/db/` is enough. Full layered architecture is for systems where concerns genuinely separate — do not introduce it upfront.

For larger or long-lived systems, Clean Architecture prevents infrastructure from leaking into business logic:

---

## Project structure

A TypeScript backend follows dependency inversion — outer layers depend on inner layers; domain and application layers have no knowledge of infrastructure or delivery mechanisms.

```
src/
├── domain/           ← no external dependencies; entities, value objects, domain errors
├── application/      ← use cases, DTOs, port interfaces; depends on domain only
├── infrastructure/   ← implements ports; DB, HTTP clients, messaging, file system
├── api/              ← HTTP layer; routes, controllers, middleware; depends on application
└── shared/           ← cross-cutting types, utilities, constants; no layer dependencies
tests/
├── unit/
├── integration/
└── e2e/
```

---

## Layer rules

### Domain

- Entities, value objects, aggregates, domain events, domain errors
- No framework, ORM, or infrastructure import
- Business invariants enforced in constructors and methods
- Port interfaces (repository contracts, external service contracts) defined here or in Application

### Application

- Use-case functions or classes — one per business operation
- References Domain only; defines port interfaces infrastructure must implement
- No framework-specific code; use cases must be independently testable
- Input DTOs validated before reaching use cases; output DTOs shaped for consumers

### Infrastructure

- Implements application and domain ports
- Contains: ORM repositories (Prisma, Drizzle, TypeORM), HTTP clients (Axios, got), message queue consumers/producers, cache adapters
- Registers dependencies; infrastructure concerns (retry, connection pooling) stay here

### API (Delivery)

- Maps HTTP requests to application use cases
- Transforms results to HTTP responses; error mapping lives here
- Authentication, authorisation middleware, rate limiting, global error handler
- Controllers/handlers are thin; no business logic

---

## Feature-first organisation (medium/large systems)

```
src/
├── orders/
│   ├── domain/
│   ├── application/
│   │   ├── place-order/
│   │   │   ├── place-order.use-case.ts
│   │   │   ├── place-order.dto.ts
│   │   │   └── place-order.use-case.test.ts
│   │   └── get-order/
│   ├── infrastructure/
│   └── api/
└── shared/
```

Use feature-first when a team owns a bounded context end-to-end. Flat structure is fine for small services.

---

## Dependency injection

Prefer constructor injection for services and repositories. Do not rely on a global service locator.

**Lightweight DI (manual wiring — preferred for small services):**
```typescript
// composition-root.ts
const orderRepo = new PrismaOrderRepository(prisma);
const orderService = new OrderService(orderRepo, eventBus);
const orderController = new OrderController(orderService);
```

**Container-based DI (NestJS, Inversify, TSyringe — for larger systems):**
- Register interfaces, not concrete classes, at composition root
- Use tokens (symbols) for interface bindings to avoid coupling to concrete types
- Keep container configuration at the entry point; do not scatter `@Injectable` across domain classes

---

## Monorepo patterns

```
packages/
├── domain/           ← shared domain types and interfaces (no runtime deps)
├── api/              ← HTTP service
├── worker/           ← background job processor
└── shared/           ← utilities, logging, config
```

- Use TypeScript project references (`composite: true`, `references: []`) for incremental builds
- Each package has its own `tsconfig.json` extending a root config
- Share types via packages, not via file system imports across package boundaries
- Prefer `exports` field in `package.json` over `main` for ESM/CJS dual publishing

---

## Naming conventions

| Concept | Convention | Example |
|---------|------------|---------|
| Files | `kebab-case.type.ts` | `place-order.use-case.ts` |
| Classes | `PascalCase` | `OrderService` |
| Interfaces | `PascalCase` (no `I` prefix) | `OrderRepository` |
| Type aliases | `PascalCase` | `OrderStatus` |
| Functions | `camelCase` | `placeOrder` |
| Constants | `UPPER_SNAKE` or `camelCase` const objects | `MAX_RETRIES`, `OrderStatus` |
| Test files | same name + `.test.ts` | `place-order.use-case.test.ts` |
