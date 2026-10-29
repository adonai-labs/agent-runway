# .NET-Specific Code Review Searches

These searches complement the universal searches in `code-review/systematic-searches-base.md`.

---

## Category: Blocking Async Calls

```powershell
rg "\.Result\b|\.Wait\(\)|\.GetAwaiter\(\)\.GetResult\(\)" --type cs
```

Critical. Causes deadlocks in ASP.NET Core sync context.

---

## Category: async void

```powershell
rg "async void " --type cs
```

Critical (except event handlers). Exceptions from `async void` are uncatchable.

---

## Category: Thread.Sleep in Async Code

```powershell
rg "Thread\.Sleep\(" --type cs
```

High. Blocks a thread pool thread. Replace with `await Task.Delay()`.

---

## Category: Direct Service Instantiation

```powershell
rg "= new [A-Z]\w*(Service|Repository|Client|Manager|Handler)\(" --type cs
```

High. Tight coupling and untestable. Use constructor injection.

---

## Category: Direct HttpClient Instantiation

```powershell
rg "new HttpClient\(\)" --type cs
```

High. Causes socket exhaustion. Use `IHttpClientFactory`.

---

## Category: Swallowed Exceptions

```powershell
rg "catch\s*\([^)]*\)\s*\{[\s\r\n]*\}" --type cs
```

Critical. Silent failures. At minimum log and rethrow or return `Result.Failure`.

---

## Category: Raw SQL / SQL Injection Risk

```powershell
rg "FromSqlRaw\(|ExecuteSqlRaw\(|\"SELECT |\"INSERT |\"UPDATE |\"DELETE " --type cs
```

Critical. Verify every match uses parameterised values — no string interpolation or concatenation.

---

## Category: BinaryFormatter Usage

```powershell
rg "BinaryFormatter" --type cs
```

Critical. Arbitrary code execution via deserialisation. Use `System.Text.Json`.

---

## Category: N+1 Query Risk

```powershell
# Queries inside loops
rg "foreach.*\n.*await.*repository|foreach.*\n.*_db\." --type cs --multiline

# Missing Include on navigation properties
rg "\.FirstOrDefault\(|\.ToList\(|\.ToListAsync\(" -B 5 --type cs
```

High. Manually verify that navigation properties loaded in loops use `.Include()` or batch queries.

---

## Category: Unbounded Queries

```powershell
rg "\.ToList\(\)|\.ToListAsync\(\)" --type cs
```

High. Verify every materialised query applies `.Take()` pagination or is otherwise bounded.

---

## Category: Missing CancellationToken

```powershell
rg "public.*Task.*Async\(" --type cs
```

Medium. Verify every public `*Async` method accepts `CancellationToken ct = default` and propagates it downstream.

---

## Category: String Interpolation in Log Calls

```powershell
rg "Log(Information|Warning|Error|Debug|Trace)\(\$\"" --type cs
```

Medium. String interpolation in log calls prevents structured logging. Use message templates.

---

## Category: Console.WriteLine (Production Code)

```powershell
rg "Console\.Write(Line)?\(" --type cs
```

Medium. Use `ILogger<T>`. Console output is invisible in hosted environments.

---

## Category: Test Quality Signals

```powershell
# Thread.Sleep in tests
rg "Thread\.Sleep\(" --glob "**/*Tests*/**/*.cs"

# Tests without assertions
rg "public void|public async Task" -A 20 --glob "**/*Tests*/**/*.cs"

# Ignored tests
rg "\[Ignore\]|\[Skip\]" --type cs
```

High. Tests with `Thread.Sleep` are flaky. Tests without assertions provide false confidence.

---

## Category: Missing Authorisation (ASP.NET Core)

```powershell
# Find all controllers and check for [Authorize]
rg "\[ApiController\]" -B 2 -A 10 --type cs
# Find all [AllowAnonymous] usages
rg "\[AllowAnonymous\]" --type cs
# Minimal API endpoints without RequireAuthorization
rg "Map(Get|Post|Put|Patch|Delete)\(" --type cs
```

Critical. Manually verify every controller and endpoint either has `[Authorize]` / `RequireAuthorization()` or an intentional, justified `[AllowAnonymous]`.

---

## Category: Sensitive Data in Log Calls

```powershell
rg "Log(Information|Warning|Error|Debug|Trace|Critical).*([Pp]assword|[Tt]oken|[Ss]ecret|[Aa]pi[Kk]ey)" --type cs
```

Critical. PII, passwords, and tokens must never appear in `ILogger` output.

---

## Category: ConfigureAwait Missing (Library Code)

```powershell
rg "await [^;]+" --type cs --glob "**/*.Infrastructure/**" --glob "**/*.Domain/**"
# Check for missing .ConfigureAwait(false) in shared/library projects only
```

Low-Medium, library projects only. Application and ASP.NET Core API projects do not require `ConfigureAwait(false)`. Disable this category in the review config when the solution has no library/shared projects.
