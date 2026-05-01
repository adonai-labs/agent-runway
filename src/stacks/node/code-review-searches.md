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
rg "exec\(|spawn\(|execFile\(" --type ts --type js
```

High. Verify untrusted input is not interpolated into shell commands.

---

## Category: Missing Graceful Shutdown

```bash
rg "process\.on\(['\"]SIGTERM['\"]|process\.on\(['\"]SIGINT['\"]" --type ts --type js
```

High. Services should handle termination signals and close dependencies safely.

---

## Category: Unhandled Promise Patterns

```bash
rg "void\s+\w+\(|\.then\(|\.catch\(" --type ts --type js
```

Medium-High. Confirm rejected promises are handled and background tasks are supervised.

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

