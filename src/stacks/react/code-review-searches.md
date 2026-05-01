# React-Specific Code Review Searches

These searches complement the universal searches in `code-review/systematic-searches-base.md`.

---

## Category: Inline Functions in JSX Props

```bash
rg "onClick=\{.*=>|onChange=\{.*=>|onSubmit=\{.*=>" --type tsx
```

Low-Medium. Inline arrow functions create new instances on every render. Consider extracting to useCallback for performance in frequently re-rendered components.

---

## Category: Missing Dependency Arrays

```bash
rg "useEffect\(|useCallback\(|useMemo\(" -A 5 --type tsx
```

High. Verify dependency arrays are complete and accurate. Missing dependencies cause stale closures. Extra dependencies cause unnecessary re-renders.

---

## Category: Keys on List Items

```bash
rg "\.map\(" -A 3 --type tsx
```

Medium. Verify each mapped element has a unique, stable key prop. Using array index as key is an anti-pattern.

---

## Category: Direct State Mutation

```bash
rg "\.push\(|\.pop\(|\.splice\(|\.sort\(|\.reverse\(" --type tsx --type ts
```

High. Verify these mutations are not applied to React state directly. State must be immutable - use spread operator or array methods that return new arrays.

---

## Category: Unsafe HTML Rendering

```bash
rg "dangerouslySetInnerHTML" --type tsx
```

Critical. This API exposes XSS risk. Verify content is sanitized with DOMPurify or similar library before rendering.
