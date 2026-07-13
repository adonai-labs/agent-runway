# typescript-core/security.md

# Security for TypeScript

OWASP-aligned security standards for TypeScript applications.

---

## Input validation

Validate all external input at the boundary before it reaches application logic.

```typescript
import { z } from 'zod';

const PlaceOrderSchema = z.object({
  customerId: z.string().uuid(),
  lines: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive().max(1000),
  })).min(1).max(100),
});

// In the API layer — parse throws on invalid input
const dto = PlaceOrderSchema.parse(req.body);

// Use safeParse when you want to handle errors explicitly
const result = PlaceOrderSchema.safeParse(req.body);
if (!result.success) {
  return res.status(400).json({ errors: result.error.flatten() });
}
```

**Rules:**
- Use Zod (or equivalent) at every external boundary: HTTP, message queue consumers, config, env vars
- Infer TypeScript types from schemas — do not duplicate type definitions manually
- Validate once at the boundary; propagate validated types inward as narrowed types
- Apply length limits, format constraints, and range checks to all inputs

---

## Authentication and authorisation

```typescript
import jwt from 'jsonwebtoken';

// Verify — always validate iss, aud, exp
const payload = jwt.verify(token, process.env.JWT_SECRET!, {
  issuer: 'https://auth.yourapp.com',
  audience: 'api.yourapp.com',
}) as JwtPayload;

// Middleware
const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorised' });
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Authorisation — check permissions after authentication
const requireRole = (role: Role) => (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user?.roles.includes(role)) return res.status(403).json({ error: 'Forbidden' });
  next();
};
```

**Rules:**
- Never store secrets (JWT secret, DB credentials) in source — use environment variables
- Use short-lived access tokens (15 min) with refresh token rotation
- Validate `iss`, `aud`, and `exp` on every JWT; reject tokens missing claims
- Use HTTPS everywhere; enforce HSTS in production

---

## SQL injection prevention

```typescript
// Prisma — parameterised by default
const order = await prisma.order.findUnique({ where: { id: orderId } });

// Raw SQL — always use tagged template or parameterised form
const rows = await prisma.$queryRaw`SELECT * FROM orders WHERE customer_id = ${customerId}`;

// Never concatenate user input into queries
// BAD: prisma.$executeRawUnsafe(`SELECT * FROM orders WHERE id = '${id}'`);
```

**Rules:**
- Use Prisma / Drizzle / TypeORM query builders — avoid raw string SQL unless absolutely necessary
- When raw SQL is needed, use parameterised forms only (`$queryRaw` template literal, `?` placeholders)
- Apply principle of least privilege to database credentials

---

## XSS and injection prevention

```typescript
import helmet from 'helmet';
import { escape } from 'html-escaper';

// HTTP security headers
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
  },
}));

// Escape user content before rendering in HTML contexts
const safeHtml = escape(userInput);
```

---

## Rate limiting and abuse prevention

```typescript
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limits for auth endpoints
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

app.use('/api/', apiLimiter);
app.post('/auth/login', authLimiter, loginHandler);
```

---

## Secrets hygiene

```typescript
import { z } from 'zod';

// Validate all required env vars at startup — fail fast
const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  NODE_ENV: z.enum(['development', 'test', 'production']),
});

const env = EnvSchema.parse(process.env);
export { env };
```

**Rules:**
- Never log secrets, tokens, or full request bodies containing credentials
- Use `.env.example` to document required variables; never commit `.env`
- Rotate secrets on suspected exposure; use a secrets manager (AWS Secrets Manager, Vault) in production
- Scan dependencies with `npm audit` or `snyk` in CI; treat critical vulnerabilities as blocking

---

## Security checklist

- [ ] All external input validated with Zod at the boundary
- [ ] JWT validated with `iss`, `aud`, `exp`; short-lived tokens
- [ ] No raw string SQL; parameterised queries only
- [ ] `helmet()` applied; CSP configured
- [ ] Rate limiting on public and auth endpoints
- [ ] `npm audit` runs in CI; critical vulnerabilities block merge
- [ ] No secrets in source; env vars validated at startup
- [ ] Stack traces never sent in API responses
