# TypeScript-Specific Code Review Searches

These searches complement the universal searches in `code-review/systematic-searches-base.md`.

---

## Category: Any Type Usage

```bash
rg "\bany\b" --type ts --type tsx
```

High. Using `any` defeats TypeScript's type safety. Use `unknown` and narrow, or define proper types.

---

## Category: Type Assertions without Validation

```bash
rg "as \w+|<\w+>" --type ts --type tsx
```

Medium. Review each assertion. Prefer type guards or runtime validation (Zod, io-ts).

---

## Category: Non-null Assertions

```bash
rg "!" --type ts --type tsx
```

Medium. Review usage of `!` operator. Prefer optional chaining (`?.`) and explicit checks.

---

## Category: @ts-ignore and @ts-expect-error

```bash
rg "@ts-ignore|@ts-expect-error" --type ts --type tsx
```

High. Each match must have a comment explaining why. Prefer fixing the type issue.

---

## Category: Console Methods in Production Code

```bash
rg "console\.(log|warn|error|debug)" --type ts --type tsx
```

Medium. Remove debug console statements. Use proper logging library in production code.

---

## Category: Promises without Await

```bash
rg "\.then\(|\.catch\(" --type ts --type tsx
```

Low-Medium. Consider using async/await for better readability and error handling.

---

## Category: Missing Error Handling

```bash
rg "fetch\(|axios\." --type ts --type tsx
```

High. Verify every API call has proper error handling (try/catch or .catch()).

---

## Category: Hardcoded URLs and API Keys

```bash
rg "(http://|https://|api[_-]?key|token)" --type ts --type tsx -i
```

Critical. Verify no hardcoded production URLs or secrets. Use environment variables.

---

## Category: Empty Catch Blocks

```bash
rg "catch\s*\([^)]*\)\s*\{[\s\r\n]*\}" --type ts --type tsx
```

Critical. Silent failures. At minimum log the error or rethrow.

---

## Category: TODO/FIXME Comments

```bash
rg "TODO|FIXME|HACK|XXX" --type ts --type tsx -i
```

Medium. Each match must be accompanied by a linked issue or be removed before merge.

---

## Category: Disabled ESLint Rules

```bash
rg "eslint-disable|@ts-nocheck" --type ts --type tsx
```

High. Each match must have a comment explaining why. Avoid disabling rules without justification.

---

## Category: React-specific: Inline Functions in JSX

```bash
rg "onClick=\{.*=>|onChange=\{.*=>" --type tsx
```

Low-Medium. Consider extracting to useCallback for performance in frequently re-rendered components.

---

## Category: React-specific: Missing Dependency Arrays

```bash
rg "useEffect\(|useCallback\(|useMemo\(" -A 5 --type tsx
```

High. Verify dependency arrays are complete. Missing dependencies cause stale closures.

---

## Category: React-specific: Keys on List Items

```bash
rg "\.map\(" -A 3 --type tsx
```

Medium. Verify each mapped element has a unique, stable `key` prop.
