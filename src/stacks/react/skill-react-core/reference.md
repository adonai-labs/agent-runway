# react-core/reference.md

# Reference

Toolchain, `package.json`, and common commands for React applications.

---

## package.json (Vite + React)

```json
{
  "scripts": {
    "dev":     "vite",
    "build":   "tsc -b && vite build",
    "preview": "vite preview",
    "test":    "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "lint":    "eslint . --max-warnings 0",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "react":                    "^19",
    "react-dom":                "^19",
    "react-router":             "^7",
    "@tanstack/react-query":    "^5",
    "zod":                      "^4",
    "react-hook-form":          "^7",
    "@hookform/resolvers":      "^5",
    "dompurify":                "^3"
  },
  "devDependencies": {
    "@vitejs/plugin-react":         "^5",
    "vite":                         "^7",
    "typescript":                   "^5",
    "@types/react":                 "^19",
    "@types/react-dom":             "^19",
    "vitest":                       "^4",
    "@vitest/coverage-v8":          "^3",
    "jsdom":                        "latest",
    "@testing-library/react":       "^16",
    "@testing-library/user-event":  "^14",
    "@testing-library/jest-dom":    "^6",
    "jest-axe":                     "^8",
    "msw":                          "^2",
    "eslint":                       "^9",
    "typescript-eslint":            "^8",
    "eslint-plugin-react-hooks":    "latest"
  }
}
```

---

## Vite config

```ts
// vite.config.ts — defineConfig from 'vitest/config' types the `test` block
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Optional: enable the React Compiler via babel-plugin-react-compiler
  // plugins: [react({ babel: { plugins: ['babel-plugin-react-compiler'] } })],
  plugins: [react()],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: { lines: 80 },
    },
  },
});
```

---

## Common commands

```bash
# Development
npm run dev                       # start dev server
npm run build                     # production build
npm run preview                   # preview production build

# Quality
npm run typecheck                 # TypeScript compile check
npm run lint                      # ESLint; --max-warnings 0 fails on any warning

# Tests
npm test                          # vitest watch mode
npm run test:coverage             # run once with coverage report
npx vitest run                    # run once (CI)

# Security
npm audit                         # known vulnerabilities
npm audit --audit-level=high      # CI blocking check

# Dependency check
npx depcheck                      # unused and missing dependencies
```

---

## Key decisions by category

| Decision | Recommended | Notes |
|----------|-------------|-------|
| Bundler | Vite | Fast dev server; native ESM |
| Test runner | Vitest | Native Vite integration; Jest-compatible API |
| Component testing | React Testing Library | Behaviour-focused; pairs with Vitest |
| HTTP mocking | MSW v2 | Intercepts at service worker level; realistic |
| Forms | React 19 Actions (`useActionState`) for simple forms; react-hook-form + zod for complex ones | Type-safe schema validation |
| Server state | React Query v5 | Fetch, cache, sync; keeps server data out of Zustand |
| Client state | Zustand | Minimal API; no boilerplate; only when context is insufficient |
| Routing | react-router v7 (`react-router-dom` merged into `react-router`) | Data/declarative mode for SPAs; loaders/actions |
| Memoisation | React Compiler | Auto-memoises; avoid manual `useMemo`/`useCallback` when enabled |
| XSS sanitisation | DOMPurify | Only needed when rendering user-supplied HTML |
