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
npx eslint .          # flat config (eslint.config.js) decides which files are linted; --ext is not supported
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

```bash
# Unused / missing dependencies
npx depcheck

# Bundle size (Vite): build, then inspect the output sizes
npx vite build
npx vite-bundle-visualizer   # optional treemap of the production bundle
```

Review bundle size and dependency usage. Large bundles affect performance.
