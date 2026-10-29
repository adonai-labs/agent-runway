# Go-Specific Code Review Searches

These searches complement the universal searches in `code-review/systematic-searches-base.md`.

---

## Category: Ignored Errors

```bash
rg ",\s*_\s*:?=\s|^\s*_\s*=\s*\w+[\w.]*\(" --type go
```

High. Discarding an error with `_` hides failures. Each instance must be justified; otherwise handle or wrap the error.

---

## Category: Panic in Production Code

```bash
rg "\bpanic\(" --type go
```

High. Production code should return errors, not panic. Reserve panic for unrecoverable states only.

---

## Category: SQL Injection Risk

```bash
rg "(Query|Exec|QueryRow)\(.*\+|fmt\.Sprintf\(.*(SELECT|INSERT|UPDATE|DELETE)" --type go
```

Critical. String-built SQL enables injection. Use parameterised queries with placeholders.

---

## Category: Command Injection Risk

```bash
rg "exec\.Command\(\"(/bin/|/usr/bin/)?(sh|bash|dash|cmd)" --type go
```

Critical. Invoking a shell with interpolated input enables command injection. Call the binary directly with an argument list.

---

## Category: Missing Context Propagation

```bash
rg "func \w+\(" --type go | rg -v "context\.Context"
```

Medium. I/O and blocking functions should accept `context.Context` as the first parameter to honour cancellation. This lists function signatures that omit `context.Context`; manual review for relevance (not every function needs a context).

---

## Category: Goroutine Without Cancellation

```bash
rg "go func\(" --type go
```

High. Each goroutine needs a clear stop path (context, channel, WaitGroup). Review for leaks.

---

## Category: Unclosed Resources

```bash
rg "\.Open\(|\.Dial\(|sql\.Open\(" --type go
```

High. Verify every opened resource has a matching `defer Close()`. Leaks exhaust file descriptors and connections.

---

## Category: Insecure Randomness

```bash
rg "\"math/rand(/v2)?\"" --type go
```

Medium. `math/rand` and `math/rand/v2` are not cryptographically secure. Use `crypto/rand` for tokens, secrets, or IDs.

---

## Category: Test Coverage

```bash
rg "func Test|func Benchmark" --type go
```

Info. Verify critical functionality has tests. Run `go test -race -cover ./...`.
