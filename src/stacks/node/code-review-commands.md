# Node.js Build & Runtime Validation Commands

Commands to run during code review for Node.js projects.

---

## Build and Tests

```bash
npm run build
npm test
```

If scripts differ, run the project-equivalent build and test commands. Failures are at least High severity.

---

## Lint and Type Checks

```bash
npm run lint
npm run type-check
```

If TypeScript is not used, run the available static checks for the project.

---

## Dependency and Security Checks

```bash
npm audit
npm outdated
```

High/critical vulnerabilities in production dependencies must be documented as Critical findings.

