# go-core/security.md

# Security for Go

OWASP-aligned security standards for Go backend services.

---

## Input validation

Go's type system handles a lot, but business constraints must be validated explicitly.

```go
// Use a typed request struct; validate before passing to the service
type PlaceOrderRequest struct {
    CustomerID string      `json:"customer_id"`
    Lines      []OrderLine `json:"lines"`
}

func (r PlaceOrderRequest) Validate() error {
    if r.CustomerID == "" {
        return &ValidationError{Field: "customer_id", Message: "required"}
    }
    if len(r.Lines) == 0 {
        return &ValidationError{Field: "lines", Message: "must not be empty"}
    }
    if len(r.Lines) > 100 {
        return &ValidationError{Field: "lines", Message: "too many lines"}
    }
    return nil
}

// Handler — validate at the boundary
func (h *OrderHandler) PlaceOrder(w http.ResponseWriter, r *http.Request) {
    var req PlaceOrderRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "invalid request", http.StatusBadRequest)
        return
    }
    if err := req.Validate(); err != nil {
        http.Error(w, err.Error(), http.StatusUnprocessableEntity)
        return
    }
    ...
}
```

---

## SQL injection prevention

```go
// Safe — positional placeholders with database/sql
row := db.QueryRowContext(ctx, "SELECT id, total FROM orders WHERE id = $1", orderID)

// Safe — pgx named args
_, err = pool.Exec(ctx,
    "INSERT INTO orders (id, customer_id) VALUES (@id, @customerID)",
    pgx.NamedArgs{"id": o.ID, "customerID": o.CustomerID},
)

// NEVER
query := fmt.Sprintf("SELECT * FROM orders WHERE id = '%s'", userInput)  // SQL injection
```

**Rules:**
- Use `$1`/`?` placeholders (driver-specific); never interpolate user data into queries
- Use `database/sql` or `pgx` — both parameterise by default
- Least-privilege DB credentials: app user should not DROP or ALTER

---

## Subprocess safety

```go
// Safe — pass args as a slice; never shell=true
cmd := exec.CommandContext(ctx, "ffmpeg", "-i", inputPath, outputPath)
out, err := cmd.Output()

// NEVER with user input
cmd := exec.Command("sh", "-c", "ffmpeg -i "+userInput)  // shell injection
```

**Rules:**
- Do not use `sh -c` with any user-controlled data
- Validate and sanitise file paths; reject `..` traversal before passing to exec

---

## Secrets hygiene

```go
// Load and validate at startup
cfg, err := config.Load()  // returns error for missing required vars

// Never log secrets
slog.Info("server starting", "port", cfg.Port)  // ✅
slog.Info("loaded config", "jwt_secret", cfg.JWTSecret)  // ❌
```

**Rules:**
- Use `govulncheck` and `go mod verify` in CI to catch vulnerable dependencies
- Never commit `.env` files; document required vars in `.env.example`
- For production, use a secrets manager (Vault, cloud KMS, etc.)

---

## HTTP security headers

```go
// middleware/security.go
func SecurityHeaders(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        h := w.Header()
        h.Set("X-Content-Type-Options", "nosniff")
        h.Set("X-Frame-Options", "DENY")
        h.Set("Referrer-Policy", "strict-origin-when-cross-origin")
        next.ServeHTTP(w, r)
    })
}
```

---

## Security checklist

- [ ] All external input validated at the HTTP boundary before reaching the service
- [ ] SQL queries use parameterised placeholders; no string interpolation
- [ ] `exec.Command` called with arg slice; no `sh -c` with user input
- [ ] Secrets validated at startup; never logged or committed
- [ ] `govulncheck ./...` runs in CI; `go mod verify` confirms module integrity
- [ ] Stack traces not returned in API error responses
