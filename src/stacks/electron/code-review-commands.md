# Electron Code Review Commands

## Build and type check

```bash
npm run build
npx tsc --noEmit
```

## Tests

```bash
npm test
npm run test:e2e          # Playwright against the built app
```

## Security audit

```bash
npm audit --omit=dev --audit-level=high
npx @doyensec/electronegativity -i . -o findings.csv   # static Electron misconfiguration scan
npx @electron/fuses read --app <path-to-packaged-app>   # verify fuses in the packaged build
```
