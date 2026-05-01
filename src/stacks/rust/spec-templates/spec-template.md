# Rust Spec Template (Clean Architecture + Clean Code)

Use this template when the active stack is Rust.

## Stack Scaffold Proposal

```text
src/
  domain/
    entities/
    value_objects/
    errors.rs
  application/
    use_cases/
    ports/
    dto/
  infrastructure/
    persistence/
    external/
    adapters/
  interfaces/
    http/
    cli/
  shared/
    config/
    observability/
```

## Clean Architecture Guidance

- Domain must not depend on infrastructure crates.
- Application defines traits/ports and orchestrates use-cases.
- Infrastructure implements traits/ports and handles IO.
- Interface layer maps transport concerns to application DTOs.

## Clean Code Guidance

- Prefer explicit types and narrow enums for domain state.
- Keep functions small; extract complex branches to named helpers.
- Use `Result<T, E>` with meaningful domain errors.
- Avoid hidden side effects and implicit mutable state.
