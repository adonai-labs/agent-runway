# React Spec Template (Clean Architecture + Clean Code)

Use this template when the active stack is React.

## Stack Scaffold Proposal

```text
src/
  app/
    routes/
    providers/
  features/
    <feature>/
      application/
        use-cases/
        ports/
      domain/
        entities/
        value-objects/
      infrastructure/
        api/
        repositories/
      presentation/
        components/
        hooks/
        pages/
  shared/
    ui/
    utils/
    types/
```

## Clean Architecture Guidance

- Keep domain pure (no React, HTTP, or framework imports).
- Application layer orchestrates use-cases through ports.
- Infrastructure implements ports (API clients, repositories).
- Presentation depends on application contracts, not infrastructure details.

## Clean Code Guidance

- Small focused components and hooks.
- Avoid large "god components"; split by responsibility.
- Prefer explicit names (`submitLoginForm`) over generic names (`handleAction`).
- Keep side effects isolated in hooks/use-cases.
