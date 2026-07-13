# node-core/security.md

# Security for Node.js

OWASP-aligned security standards for Node.js backend applications.

---

## Input validation and sanitisation

Validate all external input at process boundaries — HTTP, message queues, files, environment variables.

```typescript
import { z } from 'zod';

// HTTP input
const CreateOrderSchema = z.object({
  customerId: z.string().uuid(),
  lines: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive().max(1000),
  })).min(1).max(50),
});

// Environment
const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  NODE_ENV: z.enum(['development', 'test', 'production']),
});

export const config = EnvSchema.parse(process.env);
```

**Rules:**
- Fail startup if required env vars are missing or invalid
- Never trust data arriving from a queue, webhook, or file system — validate the same as HTTP input
- Apply length limits on all string inputs; reject unexpectedly large payloads early (use a body size limit)

---

## Child process safety

Dynamic command execution is a critical attack surface — shell injection can lead to full system compromise.

```typescript
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// Safe — passes arguments as an array, never through shell interpolation
const { stdout } = await execFileAsync('ffmpeg', ['-i', inputPath, outputPath]);

// NEVER do this with user input
// exec(`ffmpeg -i ${userInput} out.mp4`);  // shell injection risk
```

**Rules:**
- Use `execFile` (not `exec`) — it does not invoke a shell
- Never interpolate user-controlled data into shell command strings
- Validate file paths before passing them to child processes; reject paths with `..` or null bytes
- Limit child process execution time with a timeout

---

## HTTP security headers

```typescript
import helmet from 'helmet';

app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: [],
  },
}));

// Body size limit — prevent memory exhaustion from large payloads
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
```

---

## SSRF prevention

Server-Side Request Forgery — prevent user input from controlling outbound HTTP requests.

```typescript
import { URL } from 'node:url';

function isSafeUrl(rawUrl: string, allowedHosts: string[]): boolean {
  try {
    const url = new URL(rawUrl);
    // Block internal/loopback addresses
    if (['localhost', '127.0.0.1', '::1', '0.0.0.0'].includes(url.hostname)) return false;
    if (/^10\.|^172\.(1[6-9]|2\d|3[01])\.|^192\.168\./.test(url.hostname)) return false;
    return allowedHosts.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
}
```

**Rules:**
- Use an allowlist of permitted target hostnames for outbound HTTP requests triggered by user input
- Block requests to RFC 1918 address ranges and loopback addresses
- Use a dedicated HTTP client that supports timeout and redirect controls

---

## Secrets hygiene

```typescript
// Never log secrets
logger.info({ userId }, 'user authenticated');        // good
logger.info({ userId, token }, 'user authenticated'); // bad — token in logs

// Redact sensitive fields in Pino
const logger = pino({
  redact: { paths: ['req.headers.authorization', 'body.password', 'body.token'], censor: '[REDACTED]' },
});
```

**Rules:**
- Use `.env` files only in development; use a secrets manager (AWS Secrets Manager, Vault, Doppler) in production
- Rotate secrets on suspected exposure; treat rotation as a normal operational procedure
- Scan for leaked secrets in CI with `trufflesecurity/trufflehog` or similar
- Remove unused npm packages; run `npm audit --audit-level=high` in CI as a blocking step

---

## Dependency security

```bash
# Run in CI — fail on high/critical
npm audit --audit-level=high

# Find unused packages
npx depcheck

# Check for known malicious packages (supply chain)
npx socket npm audit
```

---

## Security checklist

- [ ] All external input validated with Zod at every boundary
- [ ] Body size limits applied to HTTP endpoints
- [ ] `helmet()` and CSP configured
- [ ] `execFile` (not `exec`) for all child processes; no user input interpolated
- [ ] SSRF: outbound URLs validated against an allowlist; internal ranges blocked
- [ ] Secrets never logged; Pino `redact` configured for sensitive fields
- [ ] `npm audit --audit-level=high` runs in CI as a blocking check
- [ ] Stack traces never returned in API error responses
- [ ] `NODE_ENV=production` in production — disables verbose error output in many frameworks
