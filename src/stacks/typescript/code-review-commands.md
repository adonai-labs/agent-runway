# TypeScript/Node Build & Test Commands

Commands to run during code review for TypeScript projects.

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
bun run build && bun test
```

All must pass. Document any failures as Critical findings.

---

## Linting & Type Check

```bash
npm run lint
npm run type-check
```

Or equivalent for your project. All must pass. Document any failures as High findings.

---

## Vulnerability Check

```bash
npm audit
```

Or for yarn/pnpm:

```bash
yarn audit
pnpm audit
```

Review any high or critical vulnerabilities. Document as Critical findings if in production dependencies.
