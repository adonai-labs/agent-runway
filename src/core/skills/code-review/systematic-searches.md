# Systematic Searches — 21 Mandatory Categories

Run every search in Phase 2a. Document count and file locations for each.
Expected result for all critical categories: **0 matches in files under review**.

## Project-specific configuration

Before running searches, check whether `.cursor/config/review-config.md` exists. If it does, read it and skip any category marked as `disabled`. If the file does not exist, run all 21 categories (default behaviour).

---

## Category 1 — Blocking Async Calls

```powershell
rg "\.Result\b|\.Wait\(\)|\.GetAwaiter\(\)\.GetResult\(\)" --type cs
```

Critical. Causes deadlocks in ASP.NET Core sync context.

---

## Category 2 — async void

```powershell
rg "async void " --type cs
```

Critical (except event handlers). Exceptions from `async void` are uncatchable.

---

## Category 3 — Thread.Sleep in Async Code

```powershell
rg "Thread\.Sleep\(" --type cs
```

High. Blocks a thread pool thread. Replace with `await Task.Delay()`.

---

## Category 4 — Direct Service Instantiation

```powershell
rg "= new [A-Z]\w*(Service|Repository|Client|Manager|Handler)\(" --type cs
```

High. Tight coupling and untestable. Use constructor injection.

---

## Category 5 — Direct HttpClient Instantiation

```powershell
rg "new HttpClient\(\)" --type cs
```

High. Causes socket exhaustion. Use `IHttpClientFactory`.

---

## Category 6 — Swallowed Exceptions

```powershell
rg "catch\s*\([^)]*\)\s*\{[\s\r\n]*\}" --type cs
```

Critical. Silent failures. At minimum log and rethrow or return `Result.Failure`.

---

## Category 7 — Raw SQL / SQL Injection Risk

```powershell
rg "FromSqlRaw\(|ExecuteSqlRaw\(|\"SELECT |\"INSERT |\"UPDATE |\"DELETE " --type cs
```

Critical. Verify every match uses parameterised values — no string interpolation or concatenation.

---

## Category 8 — Hardcoded Secrets

```powershell
rg "(password|secret|apikey|api_key|connectionstring|token)\s*=\s*\"[^{\"]{4,}\"" --type cs -i
```

Critical. Any match is a security incident. Move to Key Vault.

---

## Category 9 — Missing Authorisation

```powershell
# Find all controllers and check for [Authorize]
rg "\[ApiController\]" -B 2 -A 10 --type cs
# Find all [AllowAnonymous] usages
rg "\[AllowAnonymous\]" --type cs
```

Critical. Manually verify every controller and endpoint either has `[Authorize]` or an intentional `[AllowAnonymous]`.

---

## Category 10 — Sensitive Data in Logs

```powershell
rg "Log(Information|Warning|Error|Debug|Trace).*[Pp]assword|Log(Information|Warning|Error|Debug|Trace).*[Tt]oken|Log(Information|Warning|Error|Debug|Trace).*[Ss]ecret" --type cs
```

Critical. PII, passwords, and tokens must never appear in log output.

---

## Category 11 — BinaryFormatter Usage

```powershell
rg "BinaryFormatter" --type cs
```

Critical. Arbitrary code execution via deserialisation. Use `System.Text.Json`.

---

## Category 12 — N+1 Query Risk

```powershell
# Queries inside loops
rg "foreach.*\n.*await.*repository|foreach.*\n.*_db\." --type cs --multiline

# Missing Include on navigation properties
rg "\.FirstOrDefault\(|\.ToList\(|\.ToListAsync\(" -B 5 --type cs
```

High. Manually verify that navigation properties loaded in loops use `.Include()` or batch queries.

---

## Category 13 — Unbounded Queries

```powershell
rg "\.ToList\(\)|\.ToListAsync\(\)" --type cs
```

High. Verify every materialised query applies `.Take()` pagination or is otherwise bounded.

---

## Category 14 — Magic Numbers and Strings

```powershell
rg "^\s*(if|while|return|var\s+\w+\s*=).*[^a-zA-Z\"']\d{2,}[^a-zA-Z\d]" --type cs
```

Medium. Constants should be named. Review matches for unexplained numeric literals.

---

## Category 15 — Missing CancellationToken

```powershell
rg "public.*Task.*Async\(" --type cs
```

Medium. Verify every public `*Async` method accepts `CancellationToken ct = default` and propagates it downstream.

---

## Category 16 — String Interpolation in Log Calls

```powershell
rg "Log(Information|Warning|Error|Debug|Trace)\(\$\"" --type cs
```

Medium. String interpolation in log calls prevents structured logging. Use message templates.

---

## Category 17 — ConfigureAwait Missing (Library Code)

```powershell
rg "await [^;]+" --type cs
# In Infrastructure and Domain projects only — check for missing .ConfigureAwait(false)
```

Low-Medium (library projects). Application and API projects do not require `ConfigureAwait(false)`.

---

## Category 18 — TODO / FIXME / HACK Comments

```powershell
rg "TODO|FIXME|HACK|XXX" --type cs -i
```

Medium. Each match must be accompanied by a linked issue or be removed before merge.

---

## Category 19 — Console.WriteLine (Production Code)

```powershell
rg "Console\.Write(Line)?\(" --type cs
```

Medium. Use `ILogger<T>`. Console output is invisible in hosted environments.

---

## Category 20 — Test Quality Signals

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

## Category 21 — IaC Security Signals

```powershell
# Hardcoded values in Bicep
rg "\"password\"|\"secret\"|\"key\"" --type bicep 2>$null
rg "\"password\"|\"secret\"|\"key\"" --glob "**/*.bicep"

# Terraform secrets in state
rg "password\s*=" --glob "**/*.tf"

# Public network access enabled
rg "publicNetworkAccess.*Enabled|public_network_access_enabled.*true" --glob "**/*.bicep" --glob "**/*.tf"
```

Critical for IaC changes. All secrets must be Key Vault references. Public network access must be intentional and documented.
