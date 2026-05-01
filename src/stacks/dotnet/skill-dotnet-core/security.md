# Security

OWASP-aligned security standards for .NET Core applications.

---

## Input validation

Always validate input at the boundary before processing.

- Use FluentValidation validators invoked through the MediatR pipeline
- Reject requests with missing or malformed mandatory fields with `400 Bad Request` or `422 Unprocessable Entity`
- Do not rely on client-side validation as a security control
- Apply length limits, format constraints, and range checks to all inputs

```csharp
RuleFor(x => x.Email)
    .NotEmpty()
    .EmailAddress()
    .MaximumLength(254);
```

---

## SQL injection prevention

- Use EF Core or parameterised queries only; never concatenate user input into SQL strings
- If raw SQL is required, use `FromSqlRaw` with parameters, not interpolation with untrusted values

```csharp
// Correct
dbContext.Products.FromSqlRaw("SELECT * FROM Products WHERE Category = {0}", category);

// Incorrect — do not do this
dbContext.Products.FromSqlRaw($"SELECT * FROM Products WHERE Category = '{category}'");
```

- Apply the principle of least privilege to database accounts

---

## Authentication

- Use ASP.NET Core Identity or an external identity provider (Azure AD B2C, Auth0, Okta)
- Use JWT bearer tokens for API authentication
- Validate `iss`, `aud`, `exp`, `nbf` claims; reject tokens that fail validation
- Use HTTPS everywhere; enforce HSTS

```csharp
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = configuration["Auth:Authority"];
        options.Audience = configuration["Auth:Audience"];
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });
```

---

## Authorisation

- Apply `[Authorize]` globally and opt out explicitly on public endpoints with `[AllowAnonymous]`
- Use policy-based authorisation; do not hardcode roles in controllers
- Verify resource ownership in handlers, not only in middleware

```csharp
builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();

    options.AddPolicy("CanWriteOrders", policy =>
        policy.RequireClaim("permission", "orders:write"));
});
```

---

## Secrets management

- Never store secrets in `appsettings.json`, environment variables committed to source control, or in code
- Use `dotnet user-secrets` in local development
- Use Azure Key Vault in deployed environments with managed identity — no connection string credentials
- Use `IOptions<T>` to access configuration; do not inject `IConfiguration` into domain or application code

```csharp
builder.Configuration.AddAzureKeyVault(
    new Uri($"https://{vaultName}.vault.azure.net/"),
    new DefaultAzureCredential());
```

---

## OWASP Top 10 mitigations

| Risk | .NET mitigation |
|------|----------------|
| A01 Broken access control | Policy-based auth; resource ownership checks in handlers |
| A02 Cryptographic failures | Use ASP.NET Core Data Protection; TLS enforced via HSTS |
| A03 Injection | EF Core parameterised queries; FluentValidation input validation |
| A04 Insecure design | Clean Architecture separation; boundaries enforced via dependency inversion |
| A05 Security misconfiguration | Remove default pages; disable debug in production; restrict CORS |
| A06 Vulnerable components | Keep NuGet packages updated; use `dotnet list package --vulnerable` |
| A07 Auth and session failures | JWT validation; short token TTL; token revocation via short-lived tokens |
| A08 Software and data integrity | Sign and verify packages; use secure CI/CD pipelines |
| A09 Logging and monitoring failures | Structured logs; correlation IDs; alert on repeated 401/403 patterns |
| A10 SSRF | Validate and allowlist URLs before outbound HTTP; do not use user input as raw URLs |

---

## HTTP security headers

Add via middleware or reverse proxy:

```csharp
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    context.Response.Headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
    await next();
});
```

Configure `Content-Security-Policy` per application context. Use HSTS:

```csharp
app.UseHsts();
app.UseHttpsRedirection();
```

---

## CORS

- Do not use `AllowAnyOrigin()` in production
- Define explicit allowed origins based on environment

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins(configuration["Cors:AllowedOrigins"]!.Split(','))
              .AllowAnyMethod()
              .AllowAnyHeader());
});
```

---

## Sensitive data in logs

Do not log the following without explicit need and masking:

- Passwords, tokens, API keys
- Full credit card numbers, bank account numbers
- National identity numbers, tax file numbers
- Full names combined with addresses, dates of birth, or health information

Use log enrichers that mask known sensitive field names:

```csharp
Log.ForContext("Email", MaskEmail(email))
   .Information("User login attempt");
```

---

## Mass assignment prevention

- Never bind incoming request bodies directly to domain entities or persistence models
- Map from DTOs to domain objects explicitly
- Whitelist allowed fields in binders rather than blacklisting known dangerous ones

---

## Dependency vulnerability scanning

Add to CI pipelines:

```yaml
- name: Check for vulnerable packages
  run: dotnet list package --vulnerable --include-transitive
```

Also integrate with GitHub Dependabot or Azure DevOps pipeline security scanning.

---

## Anti-forgery (server-rendered apps)

If the application renders HTML, enable anti-forgery token validation:

```csharp
builder.Services.AddControllersWithViews(options =>
    options.Filters.Add(new AutoValidateAntiforgeryTokenAttribute()));
```

For SPAs using APIs, anti-forgery tokens are not typically required if `Authorization: Bearer` headers are used (browser cannot forge custom headers cross-origin).

---

## Rate limiting

Apply rate limiting to protect public or sensitive endpoints:

```csharp
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("default", limiter =>
    {
        limiter.PermitLimit = 100;
        limiter.Window = TimeSpan.FromMinutes(1);
    });
});

app.UseRateLimiter();
```

Use more restrictive limits on authentication and password reset endpoints.
