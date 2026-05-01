# Incremental Checks — Phase 4b

Run after every file created or modified. Fix findings before moving to the next file.

---

## Category 1 — Anti-Patterns

Scan for items in [antipatterns.md](antipatterns.md):

```powershell
# Blocking async calls
rg "\.Result\b|\.Wait\(\)" --type cs

# Direct HttpClient instantiation
rg "new HttpClient\(\)" --type cs

# Swallowed exceptions
rg "catch\s*\([^)]*\)\s*\{\s*\}" --type cs

# SQL string concatenation
rg "\"SELECT|\"INSERT|\"UPDATE|\"DELETE" --type cs

# Secrets in code
rg "password\s*=\s*\"|connectionstring\s*=\s*\"" --type cs -i
```

**Expected**: 0 matches in files touched by this change.

---

## Category 2 — Naming & Readability

Check manually:

- [ ] Class, method, and variable names express intent without abbreviation
- [ ] Boolean names use `is`, `has`, `can`, `should` prefix
- [ ] No single-letter variables outside `for` loop counters
- [ ] Method length ≤ ~30 lines; long methods flagged for extraction
- [ ] Magic numbers and strings replaced with named constants

---

## Category 3 — Structure & Layer Boundaries

Check manually:

- [ ] Domain layer: no framework references (`Microsoft.*`, EF Core, HTTP)
- [ ] Application layer: no direct EF Core `DbContext` access — only via repository interfaces
- [ ] Infrastructure layer: implements interfaces defined in Application
- [ ] API layer: no business logic — delegates to MediatR handlers
- [ ] Feature folder correctly placed (not scattered across type folders)

---

## Category 4 — Async Correctness

```powershell
# async void (non-event handlers)
rg "async void " --type cs

# Missing cancellation token propagation
rg "public.*Async\([^)]*\)" --type cs
# Verify CancellationToken parameter present on public async methods
```

Check manually:

- [ ] All public async methods accept `CancellationToken ct = default`
- [ ] Token passed through to all downstream async calls
- [ ] No `Task.Run` wrapping synchronous code unnecessarily

---

## Category 5 — Security Surface

```powershell
# Missing Authorize on controllers
rg "\[ApiController\]" -A 5 --type cs
# Check no public controller lacks [Authorize] or [AllowAnonymous]

# Direct user input in queries
rg "FromSql\(|ExecuteSqlRaw\(" --type cs

# Hardcoded secrets
rg "(password|secret|apikey|token)\s*=\s*\"[^\"]{4,}\"" --type cs -i
```

Check manually:

- [ ] Inputs validated before use (FluentValidation or DataAnnotations)
- [ ] Response DTOs do not expose internal IDs, passwords, or tokens
- [ ] File paths and user-supplied values sanitised before use
