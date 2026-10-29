# TypeScript-Specific Code Review Searches

These searches complement the universal searches in `code-review/systematic-searches-base.md`. Ripgrep's `ts` type covers `.ts`, `.tsx`, `.mts`, and `.cts`. React-specific passes live in the React stack.

---

## Category: Any Type Usage

```bash
rg ":\s*any\b|<any>|as any\b|any\[\]" --type ts
```

High. `any` defeats type safety. Use `unknown` and narrow, or define proper types.

---

## Category: Double Assertions

```bash
rg "as unknown as\b" --type ts
```

High. Forces an unrelated type onto a value. Replace with a type guard or schema validation (Zod).

---

## Category: Assertions on Untrusted Data

```bash
rg "(JSON\.parse\([^)]*\)|\.json\(\)\)?|req\.(body|query|params))\s+as\s+\w+" --type ts
```

High. Parsed JSON and request input must be validated at runtime, not asserted.

---

## Category: Non-null Assertions

```bash
rg "[\w)\]]!(\.|\[|\))" --type ts
```

Medium. Review each `value!` usage. Prefer optional chaining (`?.`), nullish coalescing, or an explicit check.

---

## Category: @ts-ignore, @ts-nocheck, and eslint-disable

```bash
rg "@ts-ignore|@ts-nocheck|@ts-expect-error|eslint-disable" --type ts
```

High. Each match needs an explanatory comment. Prefer `@ts-expect-error` over `@ts-ignore`; prefer fixing the type issue.

---

## Category: Console Methods in Production Code

```bash
rg "console\.(log|warn|error|debug)" --type ts -g '!**/*.test.*' -g '!**/*.spec.*'
```

Medium. Use the project's structured logger.

---

## Category: Floating Promises

```bash
rg "^\s*[\w.]+\([^)]*\)\.then\(" --type ts
```

Medium. A `.then()` chain started as a statement is often not awaited or returned. Enable `@typescript-eslint/no-floating-promises` for full coverage.

---

## Category: Hardcoded Secrets

```bash
rg -i "(api[_-]?key|secret|token|password)\s*[:=]\s*['\"][^'\"]{8,}['\"]" --type ts
```

Critical. Move to configuration loaded from the environment or a secrets manager.

---

## Category: Empty Catch Blocks

```bash
rg -U "catch\s*(\([^)]*\))?\s*\{\s*\}" --type ts
```

Critical. Silent failures. At minimum log the error or rethrow. (`-U` lets the pattern span lines.)

---

## Category: TODO/FIXME Comments

```bash
rg "TODO|FIXME|HACK|XXX" --type ts
```

Medium. Each match must link an issue or be removed before merge.
