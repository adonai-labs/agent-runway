# Python-Specific Code Review Searches

These searches complement the universal searches in `code-review/systematic-searches-base.md`.

---

## Category: Bare Except

```bash
rg "except\s*:" --type py
```

Critical. A bare `except:` catches everything including `SystemExit` and `KeyboardInterrupt`. Catch specific exception types.

---

## Category: Mutable Default Arguments

```bash
rg "def \w+\([^)]*=\s*(\[\]|\{\})" --type py
```

High. Mutable default arguments are shared across calls. Default to `None` and create the value inside the function.

---

## Category: SQL Injection Risk

```bash
rg "execute\(.*(%|\+|f\")" --type py
```

Critical. String formatting in SQL enables injection. Use parameterised queries.

---

## Category: Shell Injection Risk

```bash
rg "subprocess\.(run|call|Popen)\(.*shell\s*=\s*True" --type py
```

Critical. `shell=True` with interpolated input enables command injection. Pass an argument list and avoid `shell=True`.

---

## Category: Insecure Deserialisation

```bash
rg "pickle\.loads?\(" --type py
rg "yaml\.load\(" --type py
```

Critical. `pickle` on untrusted data and `yaml.load` without a safe loader allow code execution. For each `yaml.load` hit, check a safe `Loader=` is passed; prefer `yaml.safe_load` and avoid `pickle` for untrusted input.

---

## Category: Print Statements

```bash
rg "\bprint\(" --type py
```

Medium. Use the `logging` module instead of `print` in production code.

---

## Category: Missing Type Hints (public functions)

```bash
rg "def \w+\([^)]+\)\s*:" --type py
```

Medium. Public functions should annotate parameters and return type. This is a broad heuristic (it lists function definitions); manually confirm hints are present and complete.

---

## Category: Broad Type Ignore

```bash
rg "# type: ignore\s*$" --type py
```

Low-Medium. A bare `# type: ignore` (no `[code]` suffix) hides all type errors on the line. Narrow it (`# type: ignore[code]`) or fix the cause.

---

## Category: Assert in Production

```bash
rg "^\s*assert " --type py
```

Medium. `assert` is stripped when Python runs with `-O`. Do not use it for runtime validation in production paths.

---

## Category: Test Coverage

```bash
rg "def test_|@pytest" --type py
```

Info. Verify critical functionality has tests. Use `pytest --cov` for coverage reports.
