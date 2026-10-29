# Systematic Smell Detection — Search Commands

Run these searches against the target code to identify refactoring candidates. Document count and file locations for each.

The commands are language-neutral starting points using `rg` and standard shell tools. Narrow them with a file filter for the project's language (`--type ts`, `--type py`, `--type go`, `--type rust`, `--type cs`, `--type java`) and scope them to the refactoring target. If the stack skill is installed, also run its language-specific smell searches (for .NET: `../<stack>-core/delivery-checks.md` in `dotnet-core`).

---

## 1 — Large Files / Classes

```bash
# Files over 300 lines, excluding tests, migrations, and generated code
rg --files -g '!**/*test*' -g '!**/*spec*' -g '!**/migrations/**' -g '!**/generated/**' <src> \
  | xargs wc -l | awk '$1 > 300' | sort -rn | head -20
```

Signal: files/classes over ~300 lines are candidates for decomposition by SRP.

---

## 2 — Long Functions

Use the project's linter or complexity tool first — it measures function length precisely:

| Language | Tool |
|----------|------|
| TypeScript / JavaScript | ESLint `max-lines-per-function`, `complexity` |
| Python | Ruff `PLR0915` / `C901`, Radon `cc` |
| Go | `gocyclo`, `gocognit`, `funlen` (golangci-lint) |
| Rust | Clippy `too_many_lines`, `cognitive_complexity` |
| C# | .NET code metrics, analyzers (`CA1502`) |

Manually inspect the top results. Functions over ~30 lines are Extract Function candidates.

---

## 3 — Deep Nesting (3+ Levels)

```bash
rg "^(\s{12,}|\t{3,})(if|else|for|foreach|while|switch|match|try|catch|except)\b" <src>
```

Signal: control flow indented 3+ levels below the function body. Candidate for guard clauses or extraction.

---

## 4 — Too Many Dependencies

```bash
# Constructors / factories / __init__ with long parameter lists (5+ commas)
rg "(constructor|__init__|func New\w*|fn new|public \w+)\s*\(([^,)]*,){5,}" <src>
```

Signal: 6+ injected dependencies usually means more than one responsibility.

---

## 5 — Primitive Obsession

```bash
rg "(email|phone|currency|country|postcode|url|uri)\s*[:=]?\s*(string|str|String)\b" -i <src>
rg "(string|str|String)\s+(email|phone|currency|country|postcode|url|uri)\b" -i <src>
rg "(amount|price|total|cost|fee|rate|tax|discount)\s*[:=]?\s*(number|float|double|f64|float64|decimal)\b" -i <src>
```

Signal: domain concepts represented as primitives instead of value types.

---

## 6 — Feature Envy / Message Chains

```bash
rg "\w+\.\w+\.\w+\.\w+" <src>
```

Signal: chains of 3+ property accesses suggest the logic belongs on the accessed object.

---

## 7 — Anemic Domain — Logic in Services

```bash
# Services/handlers assigning fields on other objects
rg "\b\w+\.\w+\s*=\s*[^=]" -g '*[Ss]ervice*' -g '*[Hh]andler*' -g '*use[-_]case*' <src>
```

Cross-check the entity/model files: if they are pure data and services mutate them, behaviour should move onto the entity.

---

## 8 — Duplicate Logic Blocks

Prefer a duplication detector: `jscpd` (multi-language), `pylint --enable=duplicate-code`, `dupl` (Go), SonarQube.

```bash
npx jscpd --min-lines 6 --reporters console <src>
```

Also look for repeated try/catch blocks, repeated query chains, and repeated mapping code.

---

## 9 — Magic Numbers and Strings

```bash
rg "^\s*(if|while|return|case|const|let|var)\b.*[^a-zA-Z\"'_]\d{2,}[^a-zA-Z\d]" <src>
rg "(==|!=|===|case)\s*[\"'][A-Za-z]{3,}[\"']" <src>
```

Signal: unexplained literals that should be named constants or configuration.

---

## 10 — Switch / If-Else on Type

```bash
rg "(switch|match)\s*\(?\s*\w*(type|kind|status)\b" -i -A 10 <src>
rg "(type|kind)\s*(==|===)\s*[\"']" -i <src>
```

Signal: the same type switch repeated across functions. Candidate for strategy, polymorphism, or a lookup table.

---

## 11 — Missing Abstractions (Repeated Shapes)

Look for many handlers/endpoints with the same structure (validate → fetch → mutate → save → return). Count them with a signature search for the project's convention (for example `rg -c "async function handle"` or `rg -c "def handle_"`). Consider middleware, a pipeline step, or a shared helper — only when the repetition is real.

---

## 12 — Coupling Signals (Layer Leaks)

```bash
# Infrastructure imports inside domain/application code
rg "(import|from|using|use)\s+.*(infrastructure|infra|persistence|db|orm|http)" -i \
  -g '**/domain/**' -g '**/application/**' -g '**/core/**' <src>
```

Signal: infrastructure leaking into core layers. Adjust the folder globs to the project's layout.

---

## Severity Guide

| Severity | Smells |
|----------|--------|
| High — refactor soon | God class, anemic domain, coupling violations, deep nesting, feature envy |
| Medium — refactor when touching | Primitive obsession, duplicate logic, long functions, switch on type |
| Low — refactor opportunistically | Magic values, long parameter lists, missing abstractions |
