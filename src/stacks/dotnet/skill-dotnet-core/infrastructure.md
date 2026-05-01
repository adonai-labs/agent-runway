# Infrastructure

EF Core, messaging, HTTP clients, caching, configuration, secrets, and background jobs for .NET applications.

---

## EF Core — DbContext

### Design principles

- One DbContext per bounded context or module
- Split read and write contexts where read paths need significant query optimisation
- DbContext lifetime is `Scoped`; never singleton
- Use `IDbContextFactory<T>` for background jobs that need a separate scope

### Configuration

```csharp
services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        configuration.GetConnectionString("Default"),
        sql => sql.EnableRetryOnFailure(3)));
```

### Entity configuration

Use fluent configuration in `IEntityTypeConfiguration<T>` classes, not data annotations on domain entities:

```csharp
public class OrderEntityConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("Orders");
        builder.HasKey(o => o.Id);
        builder.OwnsOne(o => o.TotalAmount, money =>
        {
            money.Property(m => m.Amount).HasColumnName("TotalAmount");
            money.Property(m => m.Currency).HasColumnName("Currency").HasMaxLength(3);
        });
    }
}
```

Apply configurations via assembly scanning:

```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
    => modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
```

---

## EF Core — queries

- Use `AsNoTracking()` for all read-only queries
- Project to DTOs directly in queries; do not load full aggregates for reads
- Avoid N+1 by including related data (`Include`, `ThenInclude`) or using split queries for large collections
- Cap unbounded queries with `.Take(n)` or pagination; never load an entire table
- Avoid lazy loading in application code; prefer explicit eager loading or separate queries

```csharp
// Correct: project to DTO, no tracking
var orders = await dbContext.Orders
    .AsNoTracking()
    .Where(o => o.CustomerId == customerId)
    .Select(o => new OrderSummaryDto(o.Id, o.Status, o.CreatedAt))
    .ToListAsync(ct);
```

---

## EF Core — migrations

- Keep migrations in the Infrastructure project
- Never apply migrations from application startup in production; use a migration runner or `dotnet ef database update` in CI/CD
- Review each migration script before applying to production
- Use `HasData()` sparingly; prefer seed scripts run separately from schema migrations
- Do not edit an applied migration; create a new one

---

## EF Core — repositories

Implement repository interfaces defined in Application:

```csharp
public class OrderRepository : IOrderRepository
{
    private readonly AppDbContext _context;

    public OrderRepository(AppDbContext context) => _context = context;

    public async Task<Order?> GetByIdAsync(Guid id, CancellationToken ct)
        => await _context.Orders
            .Include(o => o.Lines)
            .FirstOrDefaultAsync(o => o.Id == id, ct);

    public void Add(Order order) => _context.Orders.Add(order);
}
```

Do not call `SaveChangesAsync` inside repositories. Let the unit of work (transaction behaviour or handler) control the commit.

---

## Messaging

### Outbox pattern

For reliable event publication alongside state changes:

1. Write the event to an outbox table in the same transaction as the state change
2. A relay process reads the outbox and publishes to the broker
3. Mark published records as processed

```csharp
// Inside the same transaction:
dbContext.OutboxMessages.Add(new OutboxMessage
{
    Id = Guid.NewGuid(),
    Type = @event.GetType().AssemblyQualifiedName,
    Payload = JsonSerializer.Serialize(@event),
    OccurredAt = DateTimeOffset.UtcNow
});
await dbContext.SaveChangesAsync(ct);
```

### Consumer patterns

- Consumers should be idempotent; the broker may deliver a message more than once
- Use a deduplication key (message ID) stored in the database to prevent duplicate processing
- Consumers should not consume their own published events unless by design

### MassTransit (recommended)

```csharp
services.AddMassTransit(x =>
{
    x.AddConsumers(typeof(InfrastructureAssemblyMarker).Assembly);
    x.UsingAzureServiceBus((ctx, cfg) =>
    {
        cfg.Host(configuration["ServiceBus:ConnectionString"]);
        cfg.ConfigureEndpoints(ctx);
    });
});
```

---

## HTTP clients

Use `IHttpClientFactory` for all external HTTP calls; never construct `HttpClient` manually.

```csharp
services.AddHttpClient<IPaymentGatewayClient, PaymentGatewayClient>(client =>
{
    client.BaseAddress = new Uri(configuration["PaymentGateway:BaseUrl"]!);
    client.Timeout = TimeSpan.FromSeconds(30);
})
.AddStandardResilienceHandler(); // Polly defaults via Microsoft.Extensions.Http.Resilience
```

### Resilience

- Wrap external HTTP calls with retry and circuit breaker policies
- Use `Microsoft.Extensions.Http.Resilience` or Polly directly
- Log transient failures and circuit breaker state changes

### Anti-Corruption Layer for external APIs

Create a typed client that translates external models to internal domain types:

```csharp
public class PaymentGatewayClient : IPaymentGatewayClient
{
    public async Task<PaymentResult> ChargeAsync(ChargeRequest request, CancellationToken ct)
    {
        var response = await _httpClient.PostAsJsonAsync("/charge", MapToExternal(request), ct);
        var external = await response.Content.ReadFromJsonAsync<ExternalChargeResponse>(ct);
        return MapToInternal(external!);
    }
}
```

---

## Caching

### In-memory cache

Use `IMemoryCache` for single-instance scenarios. Use `IDistributedCache` (Redis) for multi-instance or shared state.

```csharp
if (!_cache.TryGetValue(cacheKey, out ProductDto? product))
{
    product = await LoadFromDbAsync(id, ct);
    _cache.Set(cacheKey, product, TimeSpan.FromMinutes(5));
}
```

### Cache invalidation

- Invalidate cache on successful write commands
- Do not cache sensitive personal data without TTL controls
- Distinguish between short-lived hot data and long-lived reference data in cache strategy

### Output caching (ASP.NET Core)

Use `[OutputCache]` or `MapXxx().CacheOutput()` for response-level caching on query endpoints.

---

## Configuration and secrets

### Configuration access

Use typed options with `IOptions<T>`, not `IConfiguration` directly in services:

```csharp
services.Configure<PaymentOptions>(configuration.GetSection("Payment"));

// In service:
public PaymentService(IOptions<PaymentOptions> options) =>
    _options = options.Value;
```

### Secrets management

- Local development: use `dotnet user-secrets`
- Production: load from Azure Key Vault via `builder.Configuration.AddAzureKeyVault(...)`
- Never store secrets in `appsettings.json`, environment variables in code, or source control
- Use managed identity in Azure environments; no connection strings with credentials in config

---

## Background jobs

### Hosted services

Use `IHostedService` or `BackgroundService` for recurring background work:

```csharp
public class OutboxRelayService : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await ProcessOutboxAsync(stoppingToken);
            await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
        }
    }
}
```

### Rules for background jobs

- Use `IServiceScopeFactory` to create a new scope per execution; do not inject scoped services into `BackgroundService`
- Log start, completion, and errors with structured fields
- Honour `CancellationToken` on all async calls; handle `OperationCanceledException` gracefully
- Add a health check that reflects the last successful run

### Hangfire (scheduled jobs)

Use Hangfire for scheduled, delayed, or retried background work:

```csharp
services.AddHangfire(x => x.UseSqlServerStorage(connectionString));
services.AddHangfireServer();

// Schedule:
RecurringJob.AddOrUpdate<IReportService>(
    "daily-report",
    svc => svc.GenerateAsync(),
    Cron.Daily);
```

---

## Transaction boundaries in infrastructure

- Transaction control sits in the application layer (transaction pipeline behaviour), not in repositories
- `SaveChangesAsync` is called once per unit of work, not per repository operation
- Use `IDbContextTransaction` when explicit control is needed
- Distributed transactions across multiple databases or services should be avoided; use the outbox pattern instead

---

## Health and readiness checks

Register dependency health checks in the Infrastructure layer:

```csharp
services.AddHealthChecks()
    .AddSqlServer(connectionString, name: "database", tags: new[] { "ready" })
    .AddAzureServiceBusQueue(connectionString, queueName, name: "service-bus", tags: new[] { "ready" });
```

Map health endpoints in the API project:

```csharp
app.MapHealthChecks("/health/live", new HealthCheckOptions { Predicate = _ => false });
app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = hc => hc.Tags.Contains("ready"),
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
});
```

---

## Infrastructure registration pattern

Organise all DI registrations in extension methods:

```csharp
public static IServiceCollection AddInfrastructureServices(
    this IServiceCollection services,
    IConfiguration configuration)
{
    services.AddDbContext<AppDbContext>(...);
    services.AddScoped<IOrderRepository, OrderRepository>();
    services.AddMassTransit(...);
    services.AddHttpClient<IPaymentGatewayClient, PaymentGatewayClient>(...);
    services.AddStackExchangeRedisCache(...);
    services.AddHostedService<OutboxRelayService>();
    services.AddHealthChecks()...;
    return services;
}
```
