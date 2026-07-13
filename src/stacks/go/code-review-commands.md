# Go Build & Test Commands

Commands to run during code review for Go projects.

---

## Build & Test

```bash
go build ./...
go test -race -cover ./...
```

All must pass. The `-race` flag is mandatory — data races are findings. Document failures as Critical.

---

## Vet

```bash
go vet ./...
```

`go vet` should report nothing. Document findings as High.

---

## Linting

```bash
golangci-lint run
```

Linting should pass. Document failures as High findings.

---

## Format Check

```bash
gofmt -l .
```

Any file listed is unformatted. Run `gofmt -w` and document as Medium findings.

---

## Security Audit

```bash
# Known vulnerabilities in dependencies and stdlib
govulncheck ./...

# Static security analysis
gosec ./...
```

Review vulnerabilities and insecure patterns. Document High and Critical issues as Critical findings.
