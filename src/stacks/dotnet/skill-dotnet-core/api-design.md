# API Design

REST API design standards for ASP.NET Core applications.

---

## Resource-oriented design

Design APIs around resources, not operations. Resources are the nouns; HTTP methods are the verbs.

- `GET /orders` — list orders
- `GET /orders/{id}` — get a specific order
- `POST /orders` — create an order
- `PATCH /orders/{id}` — partially update an order
- `DELETE /orders/{id}` — delete an order

Use nested resources for clear ownership: `GET /orders/{id}/lines`

Do not encode operations in the resource name: avoid `/createOrder`, `/getOrderById`.

---

## URI design

- Use lowercase, hyphen-separated words: `/order-items`, not `/orderItems` or `/OrderItems`
- Use plural nouns for collections: `/orders`, `/products`, `/customers`
- Do not include file extensions: no `/orders.json`
- Do not use verbs in URIs for standard CRUD operations
- Keep URIs short and meaningful; avoid deep nesting beyond two levels

---

## HTTP methods

| Method | Purpose | Body | Idempotent | Safe |
|--------|---------|------|-----------|------|
| GET | Retrieve resource or collection | No | Yes | Yes |
| POST | Create a new resource | Yes | No | No |
| PUT | Replace a resource entirely | Yes | Yes | No |
| PATCH | Partially update a resource | Yes | No | No |
| DELETE | Delete a resource | No | Yes | No |

Use `POST` for operations that are not naturally CRUD, but only when the semantics are clear. Name these clearly: `POST /orders/{id}:cancel`.

---

## Custom methods

When standard CRUD does not fit the operation semantics, use custom methods with the colon convention:

```
POST /orders/{id}:cancel
POST /invoices/{id}:approve
POST /batches/{id}:process
```

Document custom methods explicitly. They should be used when forcing the operation into CRUD would confuse consumers about atomicity, side effects, or meaning.

---

## Request and response design

### Request DTOs

- Accept only the fields needed for the operation
- Do not accept internal IDs or server-managed fields in creation requests
- Use `[Required]` or FluentValidation to enforce mandatory fields
- Use strong types (enums, value objects) where possible; avoid stringly-typed inputs

### Response DTOs

- Return only fields that consumers need; avoid leaking internal structure
- Use consistent naming: camelCase in JSON
- Return the same shape for the same resource across operations
- Never return internal persistence identifiers, ORM state, or computed fields without semantic clarity

### Created resource location

For `POST` that creates a resource, return `201 Created` with a `Location` header pointing to the created resource:

```csharp
return CreatedAtAction(nameof(GetById), new { id = result.Value }, null);
```

---

## Status codes

Use standard HTTP status codes with consistent semantics:

| Code | When to use |
|------|------------|
| 200 OK | Successful GET, PATCH, PUT |
| 201 Created | Successful POST (resource created) |
| 202 Accepted | Async operation accepted for processing |
| 204 No Content | Successful DELETE or action with no body |
| 400 Bad Request | Client-side validation failure |
| 401 Unauthorised | Authentication required |
| 403 Forbidden | Authenticated but not authorised |
| 404 Not Found | Resource not found |
| 409 Conflict | State conflict (duplicate, version mismatch) |
| 422 Unprocessable Entity | Business rule violation |
| 429 Too Many Requests | Rate limit exceeded |
| 500 Internal Server Error | Unexpected server error |

---

## Error responses

Use Problem Details (`application/problem+json`, RFC 7807) as the standard error format:

```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Validation failed",
  "status": 422,
  "detail": "One or more fields failed validation.",
  "instance": "/orders",
  "errors": {
    "lines": ["An order must have at least one line."]
  }
}
```

Never return stack traces or internal exception details to consumers.

Register the global error handler:

```csharp
app.UseExceptionHandler();
app.UseStatusCodePages();
builder.Services.AddProblemDetails();
```

---

## PATCH (partial update)

Implement `PATCH` using `JsonPatch` or by accepting a partial update DTO with nullable fields:

```csharp
public record UpdateOrderRequest(
    string? Notes,
    OrderPriority? Priority);
```

Only update fields that are explicitly provided. Do not reset all unspecified fields to null.

For complex partial updates, prefer JSON Merge Patch (`application/merge-patch+json`) or explicit update DTOs over JSON Patch for readability.

---

## Filtering and pagination

### Query string parameters

```
GET /orders?status=pending&customerId={id}
GET /orders?page=1&pageSize=25&sortBy=createdAt&sortDirection=desc
```

- Return a pagination envelope for list responses:

```json
{
  "items": [...],
  "totalCount": 143,
  "page": 1,
  "pageSize": 25
}
```

- Cap `pageSize` at a server-side maximum (e.g., 100)
- Always apply a default `pageSize` if not provided
- Return `totalCount` only when it is cheap to compute; otherwise use cursor-based pagination

---

## Idempotency

For operations that may be retried (payments, submissions), support idempotency keys:

```
POST /payments
Idempotency-Key: <client-generated-uuid>
```

- Store processed keys with results for the TTL window
- Return the original response for replayed requests
- Document idempotency support in the API contract

---

## Versioning

Prefer **no versioning** by designing additive, backward-compatible APIs.

When versioning is needed, use URI path versioning as the default:

```
GET /v1/orders
GET /v2/orders
```

Avoid versioning by query parameter or header; it is harder to discover and test.

Deprecate versions explicitly with a `Sunset` header and a migration timeline.

Do not version every change; reserve versions for breaking changes to resource shape or semantics.

---

## Long-running operations (LROs)

When an operation may take more than a few seconds:

1. Accept the request and return `202 Accepted` with an operation resource location
2. Create a status resource the client can poll

```
POST /reports/generate
→ 202 Accepted
Location: /operations/{operationId}
```

```
GET /operations/{operationId}
→ { "status": "running", "progress": 42 }
→ { "status": "completed", "result": { ... } }
→ { "status": "failed", "error": { ... } }
```

- Define explicit status values: `pending`, `running`, `completed`, `failed`, `cancelled`
- Define TTL for operation resources
- Support cancellation (`DELETE /operations/{id}`) where possible

---

## Authentication and authorisation in API

- Use JWT bearer tokens via `AddAuthentication().AddJwtBearer()`
- Apply `[Authorize]` globally and opt out on public endpoints with `[AllowAnonymous]`
- Use policy-based authorisation for resource-level checks; do not hardcode roles in controllers
- Check ownership inside handlers, not only in middleware

```csharp
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("CanManageOrders", policy =>
        policy.RequireClaim("permission", "orders:write"));
});
```

---

## Content negotiation

- Default to `application/json`
- Accept `Accept` header; return `406 Not Acceptable` for unsupported types
- Always set `Content-Type` on responses
- For file downloads, use `application/octet-stream` with `Content-Disposition: attachment`

---

## API documentation

Use Swagger/OpenAPI generated from code:

```csharp
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "MyApp API", Version = "v1" });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme { ... });
});
```

Annotate endpoints with `ProducesResponseType` and `[Tags]` for organised documentation.

---

## Minimal API endpoint registration

Group endpoints by feature using extension methods:

```csharp
public static class OrderEndpoints
{
    public static IEndpointRouteBuilder MapOrderEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/orders").RequireAuthorization();
        group.MapGet("/", ListOrders);
        group.MapGet("/{id:guid}", GetById);
        group.MapPost("/", PlaceOrder);
        group.MapDelete("/{id:guid}", CancelOrder);
        return app;
    }
}
```

Register in `Program.cs`:

```csharp
app.MapOrderEndpoints();
app.MapPaymentEndpoints();
```
