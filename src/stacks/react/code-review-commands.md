# React Build & Test Commands

Commands to run during code review for React projects.

---

## Build & Test

```bash
npm run build
npm test
```

Or if using other package managers:

```bash
yarn build && yarn test
pnpm build && pnpm test
```

All must pass. Document any failures as Critical findings.

---

## Linting

```bash
npm run lint
```

Or for specific linters:

```bash
npx eslint src/
npx eslint --ext .tsx,.ts src/
```

All must pass. Document any failures as High findings.

---

## Type Check (if TypeScript)

```bash
npm run type-check
# or
npx tsc --noEmit
```

All type errors must be resolved. Document any failures as High findings.

---

## React-Specific Checks

If using Create React App or similar tools:

```bash
# Check for unused dependencies
npx depcheck

# Check bundle size
npm run build -- --stats
# Then analyze with webpack-bundle-analyzer
```

Review bundle size and dependency usage. Large bundles affect performance.
