# .NET Spec Template (Clean Architecture + Clean Code)

Use this template when the active stack is .NET.

## Stack Scaffold Proposal

```text
src/
  MyApp.Domain/
    Entities/
    ValueObjects/
    Events/
  MyApp.Application/
    Features/
      <Feature>/
        Commands/
        Queries/
        Validators/
    Abstractions/
  MyApp.Infrastructure/
    Persistence/
    Integrations/
    Security/
  MyApp.Api/
    Endpoints/
    Contracts/
    Filters/
tests/
  MyApp.Domain.Tests/
  MyApp.Application.Tests/
  MyApp.Infrastructure.Tests/
  MyApp.Api.Tests/
```

## Clean Architecture Guidance

- Domain and Application must not reference Infrastructure or Api projects.
- Application exposes use-cases via commands/queries and abstractions.
- Infrastructure provides concrete implementations for abstractions.
- Api remains thin: transport mapping, auth, validation boundary, response shaping.

## Clean Code Guidance

- Keep handlers small and single-purpose.
- Name use-cases by intent (`CreateOrder`, `CancelOrder`).
- Use explicit validation (e.g., FluentValidation) at boundaries.
- Handle expected failures explicitly (Result/ProblemDetails mapping).
