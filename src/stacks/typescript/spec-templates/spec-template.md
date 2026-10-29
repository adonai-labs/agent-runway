# TypeScript Spec Template (Clean Architecture + Clean Code)

Use this template when the active stack is TypeScript.

## Stack Scaffold Proposal

```text
src/
  domain/
    <feature>/
      entities.ts
      value-objects.ts     # branded types for IDs, emails, money
      errors.ts
  application/
    <feature>/
      use-cases/
      ports.ts             # interfaces implemented by infrastructure
      dto.ts
  infrastructure/
    persistence/
    http-clients/
  interfaces/
    http/                  # routes/controllers; Zod schemas for requests
    cli/
  shared/
    config.ts              # validated at startup
    result.ts              # Result/Either helpers if used
tests/
  unit/
  integration/
tsconfig.json              # strict, noUncheckedIndexedAccess, verbatimModuleSyntax
eslint.config.js           # flat config with typescript-eslint strictTypeChecked
```

## Clean Architecture Guidance

- Domain has no imports from frameworks, ORMs, or infrastructure.
- Application orchestrates use cases through ports; it does not know about HTTP.
- Infrastructure implements ports; interfaces layer maps transport ↔ DTOs.
- Validate at the boundary (Zod) and pass validated, typed data inward.

## Clean Code Guidance

- No `any`; use `unknown` and narrow. No `as` on untrusted data.
- Discriminated unions with exhaustive `switch` (`never` check) for domain state.
- Small functions with intent-revealing names; `import type` for type-only imports.
- Vitest for unit tests with injected fakes; Testcontainers for integration.
