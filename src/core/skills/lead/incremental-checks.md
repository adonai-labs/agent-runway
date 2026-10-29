# Incremental Checks — Phase 4b

Run after every file created or modified. Fix findings before moving to the next file.

The scans below are language-neutral starting points. If the stack skill is installed and provides `../<stack>-core/delivery-checks.md` (or a checks section in its `SKILL.md`), run its stack-specific scans as well. Scope every scan to the files touched by this change.

---

## Category 1 — Anti-Patterns

Scan for items in [antipatterns.md](antipatterns.md):

```bash
# Swallowed errors (C-family / Python / Go)
rg "catch\s*(\([^)]*\))?\s*\{\s*\}|except[^:]*:\s*pass|if err != nil \{\s*\}" <files>

# Queries or shell commands built by string concatenation / interpolation
rg "\"(SELECT|INSERT|UPDATE|DELETE)\s[^\"]*\"\s*(\+|%)|f\"(SELECT|INSERT|UPDATE|DELETE)|`(SELECT|INSERT|UPDATE|DELETE)[^`]*\$\{" -i <files>

# Secrets in code
rg "(password|secret|apikey|api_key|connectionstring|token)\s*[:=]\s*[\"'][^\"'{$]{4,}" -i <files>

# Per-call construction of clients that should be shared (HTTP, DB)
rg "new (HttpClient|Pool|Client)\(|requests\.Session\(\)|http\.Client\{" <files>
```

**Expected**: 0 unexplained matches in files touched by this change.

---

## Category 2 — Naming & Readability

- [ ] Type, function, and variable names express intent without abbreviation
- [ ] Boolean names use `is`, `has`, `can`, `should` prefixes (or the language's idiom)
- [ ] No single-letter variables outside short loop counters
- [ ] Functions ≤ ~30 lines; longer ones flagged for extraction
- [ ] Magic numbers and strings replaced with named constants

---

## Category 3 — Structure & Layer Boundaries

- [ ] Domain/core code has no framework, persistence, or transport imports
- [ ] Application/use-case code reaches I/O only through abstractions (repositories, ports, clients injected in)
- [ ] Infrastructure implements interfaces defined by the inner layers
- [ ] HTTP handlers, controllers, CLI commands, and UI components contain no business rules — they delegate
- [ ] New code sits in the correct feature/module folder

---

## Category 4 — Async & Concurrency Correctness

- [ ] No blocking on async work (e.g. `.Result`/`.Wait()` in C#, sync I/O in a Node request path, `block_on` inside async Rust)
- [ ] No fire-and-forget promises/tasks/goroutines without error handling (`await`, `.catch`, error channel, `JoinHandle`)
- [ ] Cancellation propagated (`CancellationToken`, `context.Context`, `AbortSignal`, task cancellation)
- [ ] Shared mutable state protected or eliminated
- [ ] No sleeps used for synchronisation

---

## Category 5 — Security Surface

- [ ] Every new or changed endpoint has explicit authorisation (anonymous access is deliberate and justified)
- [ ] Inputs validated before use with the project's validation approach
- [ ] Response contracts do not expose internal IDs, credentials, tokens, or persistence models
- [ ] File paths, URLs, and other user-supplied values sanitised before use
- [ ] No sensitive data written to logs
