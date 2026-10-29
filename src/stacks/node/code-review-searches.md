# Node.js-Specific Code Review Searches

These searches complement universal and TypeScript searches.

---

## Category: Dangerous Dynamic Execution

```bash
rg "eval\(|new Function\(" --type ts --type js
```

Critical. Validate any dynamic execution usage; avoid in production code.

---

## Category: Child Process Shell Injection Risk

```bash
rg "\b(exec|execSync)\(|shell:\s*true" --type ts --type js
```

High. `exec`/`execSync` and `shell: true` run through a shell. Verify no untrusted input is interpolated; prefer `execFile`/`spawn` with an argument array.

---

## Category: Outbound Requests to Variable URLs (SSRF)

```bash
rg '(fetch|axios\.(get|post|request)|got)\(\s*[a-zA-Z_`]' --type ts --type js
```

High. Check whether the URL can be influenced by user input; validate against an allow-list and block internal ranges.

---

## Category: Missing Graceful Shutdown

```bash
rg "process\.on\(['\"]SIGTERM['\"]|process\.on\(['\"]SIGINT['\"]" --type ts --type js
```

High. Services should handle termination signals and close dependencies safely.

---

## Category: Unhandled Promise Patterns

```bash
rg "\bvoid\s+\w+\(|\.then\(" --type ts --type js
```

Medium-High. Confirm rejected promises are handled and background tasks are supervised. Enable `@typescript-eslint/no-floating-promises` to catch the rest.

---

## Category: Secrets and Tokens in Source

```bash
rg "(api[_-]?key|secret|token|password)\s*[:=]\s*['\"][^'\"]+['\"]" --type ts --type js -i
```

Critical. No hardcoded secrets in repository code.

---

## Category: Stack Trace Leakage

```bash
rg "res\.(send|json)\(.*(stack|error\.stack)" --type ts --type js
```

Critical. Never expose stack traces in API responses.

