# Reference — Search Commands & Key Paths

---

## Codebase Search Commands

### Find existing patterns before writing new code

```powershell
# Find similar commands/queries
rg "class.*Command\b|class.*Query\b" --type cs -l

# Find existing handlers
rg "IRequestHandler<" --type cs -l

# Find validators
rg "AbstractValidator<" --type cs -l

# Find existing repository interfaces
rg "interface I.*Repository" --type cs

# Find existing domain events
rg "class.*Event\b" --type cs -l

# Find existing value objects
rg ": ValueObject|: IEquatable" --type cs -l

# Find existing extension methods
rg "public static.*this " --type cs -l

# Find EF Core configurations
rg "IEntityTypeConfiguration<" --type cs -l
```

### Find anti-patterns (use in Phase 4b)

```powershell
# Blocking async
rg "\.Result\b|\.Wait\(\)" --type cs

# async void
rg "async void " --type cs

# Direct instantiation of services
rg "= new [A-Z]\w*(Service|Repository|Client|Manager)\(" --type cs

# New HttpClient
rg "new HttpClient\(\)" --type cs

# Swallowed exceptions
rg "catch\s*\([^)]*\)\s*\{\s*\}" --type cs

# Raw SQL
rg "FromSqlRaw\|ExecuteSqlRaw\|\"SELECT " --type cs

# Hardcoded secrets
rg "(password|secret|apikey|connectionstring)\s*=\s*\"[^{]" --type cs -i

# Missing CancellationToken on async methods
rg "public.*Task.*Async\([^)]*\)" --type cs
```

---

## Standard Folder Structure

```
src/
  <AppName>.Domain/
    <Aggregate>/
      <Entity>.cs
      <ValueObject>.cs
      <DomainEvent>.cs
      <AggregateRoot>.cs
  <AppName>.Application/
    Features/
      <Feature>/
        <Command>/<Command>.cs
        <Command>/<CommandHandler>.cs
        <Command>/<CommandValidator>.cs
        <Query>/<Query>.cs
        <Query>/<QueryHandler>.cs
  <AppName>.Infrastructure/
    Persistence/
      Configurations/
      Migrations/
      Repositories/
    ExternalServices/
  <AppName>.Api/
    Endpoints/ (or Controllers/)
    Middleware/

infra/
  main.bicep
  modules/
  main.parameters.dev.json
  main.parameters.prod.json

tests/
  <AppName>.Domain.Tests/
  <AppName>.Application.Tests/
  <AppName>.Integration.Tests/
```

---

## Key Conventions

| Concern | Convention |
|---------|------------|
| Command naming | `VerbNounCommand` — e.g., `CancelOrderCommand` |
| Query naming | `GetNounQuery` or `ListNounQuery` |
| Handler naming | Matches command/query + `Handler` |
| Domain event | Past tense: `OrderCancelledEvent` |
| Repository interface | `I<Entity>Repository` in Application layer |
| Repository implementation | `Ef<Entity>Repository` in Infrastructure layer |
| Migration naming | `dotnet ef migrations add <PascalCase description>` |
| API route | `api/v{version}/<resource>` — plural nouns, kebab-case |

---

## Useful dotnet CLI Commands

```powershell
# Add EF Core migration
dotnet ef migrations add <MigrationName> --project src/<AppName>.Infrastructure --startup-project src/<AppName>.Api

# Apply migrations
dotnet ef database update --project src/<AppName>.Infrastructure --startup-project src/<AppName>.Api

# Run with watch
dotnet watch run --project src/<AppName>.Api

# Run all tests
dotnet test

# Format check
dotnet format --verify-no-changes

# List vulnerable packages
dotnet list package --vulnerable
```
