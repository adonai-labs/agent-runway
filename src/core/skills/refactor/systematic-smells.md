# Systematic Smell Detection — Search Commands

Run these searches against the target code to identify refactoring candidates systematically. Document count and file locations for each.

---

## 1 — Large Classes

```powershell
# Files with high line count (likely god classes)
Get-ChildItem -Recurse -Filter *.cs -Exclude *Tests*,*Migrations* | Where-Object { (Get-Content $_.FullName | Measure-Object -Line).Lines -gt 300 } | Select-Object FullName, @{N='Lines';E={(Get-Content $_.FullName | Measure-Object -Line).Lines}} | Sort-Object Lines -Descending
```

Signal: classes over 300 lines are candidates for decomposition by SRP.

---

## 2 — Long Methods

```powershell
# Methods with excessive line count — look for opening braces at method level
rg "^\s+(public|private|protected|internal)\s+(static\s+)?(async\s+)?(void|Task|IActionResult|Result|string|int|bool|decimal|Guid|IEnumerable|IReadOnlyList|IList|IDictionary)" --type cs -c | Sort-Object
```

Manually inspect the top results. Methods over 30 lines are candidates for Extract Method.

---

## 3 — Deep Nesting (3+ Levels)

```powershell
rg "^\s{16,}(if|else|foreach|for|while|switch|try|catch)" --type cs
```

Signal: code indented 4+ levels (16+ spaces / 4 tabs). Candidate for guard clauses or method extraction.

---

## 4 — God Constructors (Excessive Dependencies)

```powershell
rg "public\s+\w+\(" -A 10 --type cs | rg "(I[A-Z]\w+\s+\w+,|I[A-Z]\w+\s+\w+\))"
```

Manually count constructor parameters. Classes with 6+ injected dependencies likely violate SRP.

---

## 5 — Primitive Obsession

```powershell
# String parameters where value objects might be appropriate
rg "(string\s+(email|phone|address|currency|country|postcode|url|uri|path))" --type cs -i
rg "(int\s+(amount|price|total|quantity|count|age|year|month|day))" --type cs -i
rg "(decimal\s+(amount|price|total|cost|fee|rate|tax|discount))" --type cs -i
```

Signal: domain concepts represented as primitives instead of value objects.

---

## 6 — Feature Envy

```powershell
# Methods accessing another object's properties extensively
rg "\.\w+\.\w+\.\w+" --type cs
```

Signal: chains of 3+ property accesses suggest the method belongs on the accessed object.

---

## 7 — Anemic Domain — Logic in Services

```powershell
# Services with domain logic (setting properties on entities)
rg "\.\w+\s*=\s*" --type cs --glob "*Service.cs"
rg "\.\w+\s*=\s*" --type cs --glob "*Handler.cs"
```

Cross-reference with entity files — if entities have only public getters/setters and services mutate them, the domain model is anemic.

---

## 8 — Duplicate Logic Blocks

```powershell
# Same validation or logic pattern appearing in multiple files
rg "if\s*\(\w+\s*==\s*null\)\s*(throw|return)" --type cs -c | Where-Object { $_ -match ":\d{2,}" }
```

Also look for repeated try/catch blocks, repeated LINQ chains, or repeated mapping code across handlers.

---

## 9 — Magic Numbers and Strings

```powershell
rg "^\s*(if|while|return|case|var\s+\w+\s*=).*[^a-zA-Z\"']\d{2,}[^a-zA-Z\d]" --type cs
rg "\"[A-Za-z]{3,}\"" --type cs --glob "!*Tests*" --glob "!*appsettings*"
```

Signal: unexplained numeric literals or string constants that should be named constants or configuration.

---

## 10 — Switch / If-Else on Type

```powershell
rg "switch\s*\(" -A 15 --type cs
rg "if\s*\(\w+\s*==\s*\"" --type cs
rg "case\s+\"" --type cs
```

Signal: type-switching logic repeated across methods. Candidate for Strategy or polymorphism.

---

## 11 — Missing Abstractions (Repeated Patterns)

```powershell
# Same method signature pattern across multiple files
rg "public async Task<Result" --type cs -c
rg "public async Task<IActionResult>" --type cs -c
```

If many handlers follow the exact same structure (validate → fetch → mutate → save → return), consider a pipeline behaviour or base handler.

---

## 12 — Coupling Signals

```powershell
# Infrastructure types in Domain or Application layers
rg "using.*Infrastructure" --type cs --glob "**/Domain/**"
rg "using.*Infrastructure" --type cs --glob "**/Application/**"
rg "DbContext|SqlConnection|HttpClient|BlobClient" --type cs --glob "**/Domain/**"
rg "DbContext|SqlConnection|HttpClient|BlobClient" --type cs --glob "**/Application/**"
```

Signal: layer boundary violations — infrastructure leaking into core layers.

---

## Severity Guide

| Severity | Smells |
|----------|--------|
| High — refactor soon | God class, anemic domain, coupling violations, deep nesting, feature envy |
| Medium — refactor when touching | Primitive obsession, duplicate logic, long methods, switch on type |
| Low — refactor opportunistically | Magic values, long parameter lists, missing abstractions |
