# Systematic Searches — Universal Categories

Mandatory, language-agnostic searches for Phase 2a. Run every enabled category, then run the stack-specific searches injected into [SKILL.md](SKILL.md) (`searches-<stack>.md`, one per installed stack).

Document pattern, match count, and file locations for each category.
Expected result for all Critical categories: **0 unexplained matches in files under review**.

## Project-specific configuration

Before running searches, check whether `{{config}}/review-config.md` exists. If it does, read it and skip any category marked `disabled` (universal or stack-specific). If it does not exist, run every category.

Scope searches to the changed files when reviewing a diff (append the file list or a `--glob` to each command). Patterns are starting points: adapt the file globs to the languages actually present in the repository.

---

## U1 — Hardcoded Secrets

```bash
rg "(password|secret|apikey|api_key|connectionstring|token)\s*[:=]\s*[\"'][^{\"'$]{4,}[\"']" -i
```

Critical. Any real match is a security incident. Move to environment variables or a secrets manager.

---

## U2 — Sensitive Data in Logs

```bash
rg "(log|logger|console|print|fmt\.Print|tracing::)\S*.*(password|token|secret|apikey|api_key)" -i
```

Critical. PII, passwords, and tokens must never appear in log output.

---

## U3 — Missing Authorisation Checks

Review authentication and authorisation manually:
- Are protected endpoints/routes guarded?
- Are authorisation checks at the right layer (not only in the UI)?
- Is the role/permission model applied consistently to the changed surface?

Critical. Automated searches cannot fully validate authorisation; the stack search files list the framework-specific markers to inspect.

---

## U4 — Injection via String-Built Queries or Commands

```bash
rg "\"(SELECT|INSERT|UPDATE|DELETE)\s[^\"]*\"\s*(\+|%|\.format)|f\"(SELECT|INSERT|UPDATE|DELETE)|`(SELECT|INSERT|UPDATE|DELETE)[^`]*\$\{" -i
rg "(exec|system|popen|spawn|shell_exec)\(" -i
```

Critical. Every query and shell command built from input must be parameterised or escaped by the driver/library.

---

## U5 — Swallowed Errors

```bash
rg "catch\s*(\([^)]*\))?\s*\{\s*\}"          # C-family languages
rg "except[^:]*:\s*pass" --type py            # Python
rg "_ = err\b|if err != nil \{\s*\}" --type go # Go
```

Critical. Failures must be logged, propagated, or converted into an explicit error result.

---

## U6 — Magic Numbers and Strings

```bash
rg "^\s*(if|while|return|const|let|var)\s+.*[^a-zA-Z\"'_]\d{2,}[^a-zA-Z\d]"
```

Medium. Name constants or move them to configuration.

---

## U7 — TODO / FIXME / HACK Comments

```bash
rg "TODO|FIXME|HACK|XXX" -i
```

Medium. Each new match must link to an issue or be removed before merge.

---

## U8 — Commented-out Code

```bash
rg "^\s*//\s*(function|class|const|let|var|def|public|private|return|if)\b"
rg "^\s*#\s*(def|class|return|import)\b"
```

Low-Medium. Remove commented code; version control keeps history.

---

## U9 — Debugging Statements

Look for print/debug output, temporary workarounds, test data, and development-only code paths in production code (for example `console.log`, `print(`, `fmt.Println`, `dbg!`, `Console.WriteLine`). The stack search files carry the precise pattern for each language.

Medium. Production code logs through the project's structured logger.

---

## U10 — Test Quality Signals

```bash
# Skipped / focused tests
rg "\.(skip|only)\(|@pytest\.mark\.skip|t\.Skip\(|#\[ignore\]|\[(Ignore|Skip)\]|xit\(|fit\("
# Sleeps in tests (flaky timing)
rg "sleep\(|Sleep\(|setTimeout\(" --glob "**/*test*" --glob "**/*spec*" -i
```

High. Skipped or focused tests hide regressions; sleeps make tests flaky.

---

## U11 — IaC Security Signals

For infrastructure-as-code files (Bicep, Terraform, CloudFormation, Pulumi):

```bash
# Hardcoded secret values
rg "\"password\"|\"secret\"|\"key\"" --glob "**/*.bicep"
rg "password\s*=\s*\"" --glob "**/*.tf"
rg "(Password|Secret):\s*['\"][^{]" --glob "**/*.yaml" --glob "**/*.yml" --glob "**/*.json"

# Public network exposure
rg "publicNetworkAccess.*Enabled|public_network_access_enabled.*true|0\.0\.0\.0/0|publicly_accessible\s*=\s*true" --glob "**/*.bicep" --glob "**/*.tf"
```

Critical for IaC changes. Secrets come from the cloud provider's secret store or parameter inputs. Public network access must be intentional and documented.

---

## Notes

- Stack-specific searches (async misuse, framework auth markers, ORM query risks, unsafe APIs) live in the `searches-<stack>.md` files next to this one; they are installed per selected stack.
- Combine universal and stack-specific results in the report's "Systematic Search Results" table.
