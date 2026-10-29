# React-Specific Code Review Searches

These searches complement the universal searches in `code-review/systematic-searches-base.md`. Ripgrep's `ts` type covers `.ts` and `.tsx`; add `--type js` for JavaScript projects.

---

## Category: Hook Dependency Arrays

```bash
rg "use(Effect|LayoutEffect|Callback|Memo)\(" -A 5 --type ts
```

High. Verify dependency arrays are complete and accurate (prefer `eslint-plugin-react-hooks` to catch these). Missing dependencies cause stale closures. If the React Compiler is enabled, question new manual `useMemo` / `useCallback`.

---

## Category: Array Index as Key

```bash
rg "key=\{\s*(index|idx|i)\s*\}" --type ts
```

Medium. Index keys break state and focus when lists are reordered, filtered, or inserted into. Use a stable id from the data.

---

## Category: Fetching in useEffect

```bash
rg -U "useEffect\(\s*\(\)\s*=>\s*\{[^}]*\bfetch\(" --type ts
```

Medium. Ad-hoc fetching in effects misses caching, races, and cancellation. Prefer TanStack Query/SWR, router loaders, or `use()` with a cached promise.

---

## Category: Direct State Mutation

```bash
rg "\b(state|prev)[\w.]*\.(push|pop|splice|sort|reverse)\(" --type ts
```

High. State must be immutable — use spread, `toSorted()`, `toReversed()`, or other non-mutating methods.

---

## Category: Legacy APIs (React 19)

```bash
rg "forwardRef\(|\.Provider\b|ReactDOM\.render\(|react-dom/test-utils|propTypes|defaultProps" --type ts
```

Low. `ref` is a regular prop in React 19; `<Context>` replaces `<Context.Provider>`; `ReactDOM.render`, `react-dom/test-utils`, and function-component `propTypes`/`defaultProps` are removed.

---

## Category: Unsafe HTML Rendering

```bash
rg "dangerouslySetInnerHTML" --type ts
```

Critical. This API exposes XSS risk. Verify content is sanitised with DOMPurify (or equivalent) before rendering.
