# Reference

Quick reference for .NET Core development: NuGet packages, CLI commands, common conventions, and code skeletons.

---

## Key NuGet packages

### Application layer

| Package | Purpose |
|---------|---------|
| `MediatR` | CQRS mediator, pipeline behaviours |
| `FluentValidation` | Fluent validation rules |
| `FluentValidation.DependencyInjectionExtensions` | DI registration of validators |
| `ErrorOr` or `OneOf` | Discriminated union result types |

### Infrastructure

| Package | Purpose |
|---------|---------|
| `Microsoft.EntityFrameworkCore` | ORM core |
| `Microsoft.EntityFrameworkCore.SqlServer` | SQL Server provider |
| `Microsoft.EntityFrameworkCore.Design` | EF tooling |
| `MassTransit` | Message broker abstraction |
| `MassTransit.Azure.ServiceBus.Core` | Azure Service Bus transport |
| `Polly` | Resilience and retry policies |
| `Microsoft.Extensions.Http.Resilience` | Resilience for HttpClient |
| `StackExchange.Redis` | Redis cache client |
| `Hangfire` | Background job scheduling |
| `Azure.Extensions.AspNetCore.Configuration.Secrets` | Azure Key Vault config provider |
| `Azure.Identity` | Managed identity and Azure credentials |

### Observability

| Package | Purpose |
|---------|---------|
| `Serilog.AspNetCore` | Structured logging |
| `Serilog.Sinks.ApplicationInsights` | Application Insights sink |
| `OpenTelemetry.Extensions.Hosting` | OTEL host integration |
| `OpenTelemetry.Instrumentation.AspNetCore` | ASP.NET Core tracing |
| `OpenTelemetry.Instrumentation.EntityFrameworkCore` | EF Core tracing |
| `OpenTelemetry.Exporter.OpenTelemetryProtocol` | OTLP exporter |
| `AspNetCore.HealthChecks.SqlServer` | SQL Server health check |
| `AspNetCore.HealthChecks.Redis` | Redis health check |
| `AspNetCore.HealthChecks.AzureServiceBus` | Service Bus health check |

### Testing

| Package | Purpose |
|---------|---------|
| `xunit` | Test framework |
| `Moq` or `NSubstitute` | Mocking |
| `FluentAssertions` | Readable assertions |
| `Microsoft.AspNetCore.Mvc.Testing` | WebApplicationFactory integration tests |
| `Testcontainers` | Real database/service containers in tests |
| `Respawn` | Database reset between tests |
| `Bogus` | Realistic test data generation |

---

## dotnet CLI — common commands

```bash
# Create solution and projects
dotnet new sln -n MyApp
dotnet new webapi -n MyApp.Api
dotnet new classlib -n MyApp.Application
dotnet new classlib -n MyApp.Domain
dotnet new classlib -n MyApp.Infrastructure
dotnet new xunit -n MyApp.Tests.Unit

# Add projects to solution
dotnet sln add src/**/*.csproj tests/**/*.csproj

# Add project references
dotnet add MyApp.Application/MyApp.Application.csproj reference MyApp.Domain/MyApp.Domain.csproj

# Restore and build
dotnet restore
dotnet build

# Run tests
dotnet test --no-build --logger "console;verbosity=minimal"

# EF Core migrations
dotnet ef migrations add InitialCreate --project MyApp.Infrastructure --startup-project MyApp.Api
dotnet ef database update --project MyApp.Infrastructure --startup-project MyApp.Api
dotnet ef migrations script --idempotent --output migration.sql

# Dependency vulnerability check
dotnet list package --vulnerable --include-transitive

# Publish
dotnet publish -c Release -o ./publish
```

---

## Serilog bootstrap pattern

```csharp
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);
    builder.Host.UseSerilog((context, services, configuration) =>
        configuration.ReadFrom.Configuration(context.Configuration)
                     .ReadFrom.Services(services)
                     .Enrich.FromLogContext());
    // ...
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application failed to start");
}
finally
{
    Log.CloseAndFlush();
}
```

---

## Result pattern skeleton

```csharp
public class Result<T>
{
    public bool IsSuccess { get; }
    public T? Value { get; }
    public string? Error { get; }

    private Result(T value) { IsSuccess = true; Value = value; }
    private Result(string error) { IsSuccess = false; Error = error; }

    public static Result<T> Success(T value) => new(value);
    public static Result<T> Failure(string error) => new(error);
}
```

Or use the `ErrorOr` package for a richer, source-generated variant.

---

## Aggregate root base class

```csharp
public abstract class AggregateRoot
{
    private readonly List<IDomainEvent> _domainEvents = new();

    public IReadOnlyList<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    protected void RaiseDomainEvent(IDomainEvent @event) => _domainEvents.Add(@event);

    public void ClearDomainEvents() => _domainEvents.Clear();
}
```

---

## Global exception handler

```csharp
public class GlobalExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext ctx, Exception ex, CancellationToken ct)
    {
        var (status, title) = ex switch
        {
            ValidationException => (422, "Validation failed"),
            NotFoundException => (404, "Not found"),
            ForbiddenAccessException => (403, "Forbidden"),
            _ => (500, "An unexpected error occurred")
        };

        await ctx.Response.WriteAsJsonAsync(new ProblemDetails
        {
            Status = status,
            Title = title,
            Instance = ctx.Request.Path
        }, ct);

        return true;
    }
}
```

Register: `builder.Services.AddExceptionHandler<GlobalExceptionHandler>();`

---

## Standard folder structure (modular monolith)

```
src/
├── Modules/
│   └── Orders/
│       ├── Domain/
│       │   ├── Entities/
│       │   ├── Events/
│       │   └── ValueObjects/
│       ├── Application/
│       │   ├── Commands/
│       │   ├── Queries/
│       │   ├── Behaviours/
│       │   └── Exceptions/
│       └── Infrastructure/
│           ├── Persistence/
│           │   ├── Configurations/
│           │   ├── Migrations/
│           │   └── Repositories/
│           ├── Messaging/
│           └── ServiceCollectionExtensions.cs
└── Host/
    └── MyApp.Api/
        ├── Endpoints/
        ├── Middleware/
        └── Program.cs
tests/
├── Unit/
├── Integration/
└── Functional/
```

---

## WebApplicationFactory base class (integration tests)

```csharp
public class ApiFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureTestServices(services =>
        {
            // Replace real DbContext with test database
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.AddDbContext<AppDbContext>(options =>
                options.UseNpgsql(TestDatabase.ConnectionString));
        });
    }
}
```

---

## Health check endpoints convention

```
GET /health/live   → liveness (no dependency checks; just "is the process alive?")
GET /health/ready  → readiness (checks all tagged dependencies; used by load balancer)
```

---

## Common rg search patterns for .NET

```bash
# Blocking async calls
rg "\.Result\b|\.Wait\(\)" --type cs

# async void (dangerous)
rg "async void" --type cs

# Missing CancellationToken
rg "async Task" --type cs -v "CancellationToken"

# Direct DbContext in non-infrastructure code
rg "AppDbContext|DbContext" src/Domain src/Application --type cs

# Hardcoded connection strings or secrets
rg "(password|connectionstring|secret|apikey)\s*=\s*\"" --type cs -i

# Missing Authorize attribute
rg "MapGet|MapPost|MapPut|MapDelete|MapPatch" --type cs -v "Authorize|AllowAnonymous"

# Console.WriteLine in application code
rg "Console\.Write" src --type cs

# Swallowed exceptions
rg "catch\s*\(" --type cs -A 1 | rg "^\s*\}"
```
