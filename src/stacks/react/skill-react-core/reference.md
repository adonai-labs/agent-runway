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
    "react":                    "^18.3",
    "react-dom":                "^18.3",
    "react-router-dom":         "^6",
    "@tanstack/react-query":    "^5",
    "zod":                      "^3",
    "react-hook-form":          "^7",
    "@hookform/resolvers":      "^3",
    "dompurify":                "^3"
  },
  "devDependencies": {
    "@vitejs/plugin-react":         "^4",
    "vite":                         "^5",
    "typescript":                   "^5",
    "@types/react":                 "^18",
    "@types/react-dom":             "^18",
    "@types/dompurify":             "^3",
    "vitest":                       "^2",
    "@vitest/coverage-v8":          "^2",
    "@testing-library/react":       "^16",
    "@testing-library/user-event":  "^14",
    "@testing-library/jest-dom":    "^6",
    "jest-axe":                     "^8",
    "msw":                          "^2",
    "eslint":                       "^9",
    "@typescript-eslint/eslint-plugin": "^8"
  }
}
```

---

## Vite config

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
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
| Bundler | Vite | Faster dev server; esbuild-based |
| Test runner | Vitest | Native Vite integration; Jest-compatible API |
| Component testing | React Testing Library | Behaviour-focused; pairs with Vitest |
| HTTP mocking | MSW v2 | Intercepts at service worker level; realistic |
| Forms | react-hook-form + zod | Performant; uncontrolled inputs; type-safe schema |
| Server state | React Query v5 | Fetch, cache, sync; keeps server data out of Zustand |
| Client state | Zustand | Minimal API; no boilerplate; only when context is insufficient |
| Routing | react-router-dom v6 | Data router; loader/action pattern for server-rendered data |
| XSS sanitisation | DOMPurify | Only needed when rendering user-supplied HTML |
