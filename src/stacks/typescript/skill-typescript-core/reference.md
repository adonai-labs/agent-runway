# typescript-core/reference.md

# Reference

Toolchain, tsconfig, common scripts, and ESM/CJS guidance for TypeScript projects.

---

## Recommended tsconfig

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noImplicitOverride": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": false        // only enable for legacy third-party types
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

For monorepos — extend a base config:
```jsonc
// packages/api/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "rootDir": "src", "outDir": "dist" },
  "references": [{ "path": "../domain" }, { "path": "../shared" }]
}
```

---

## ESM / CJS interop

- Prefer ESM (`"type": "module"` in `package.json`, `moduleResolution: "NodeNext"`)
- Use `.js` extensions in imports even though source is `.ts` — TypeScript resolves them correctly with NodeNext
- For dual ESM/CJS packages, use a build tool (tsup, Rollup) — do not try to maintain two `tsconfig.json` manually

```typescript
// Correct with NodeNext moduleResolution
import { placeOrder } from './use-cases/place-order.js';

// Avoid barrel files in large projects — they break tree-shaking and slow type-checking
// BAD: import { placeOrder, getOrder, cancelOrder } from './use-cases/index.js';
```

---

## Common build scripts

```jsonc
{
  "scripts": {
    "build": "tsc --project tsconfig.json",
    "build:watch": "tsc --project tsconfig.json --watch",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write src",
    "format:check": "prettier --check src",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "clean": "rm -rf dist"
  }
}
```

---

## ESLint configuration (flat config)

```typescript
// eslint.config.ts
import tseslint from 'typescript-eslint';

export default tseslint.config(
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: { project: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    },
  }
);
```

---

## Path aliases

```jsonc
// tsconfig.json
"paths": {
  "@/*": ["./src/*"],
  "@domain/*": ["./src/domain/*"],
  "@application/*": ["./src/application/*"]
}
```

Sync aliases with your bundler / `tsconfig-paths` / `vite-tsconfig-paths` as needed.

---

## Dependency audit

```bash
npm audit --audit-level=high    # fail on high/critical
npx depcheck                    # find unused dependencies
npx tsc --noEmit                # type check without emitting
```

Run `npm audit` in CI with `--audit-level=high` as a blocking check.
