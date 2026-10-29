# Review Search Configuration

Controls which systematic search categories the code-review skill runs in Phase 2a.
Maintained by the tech lead or architect. If this file is missing, every category runs.

---

## How to use

Set each category to `enabled` or `disabled`. Disabled categories must include a reason.
The code-review skill reads this file at the start of Phase 2a.

- **Universal categories** (`U1`–`U11`) come from `systematic-searches-base.md` in the code-review skill.
- **Stack categories** come from the installed `searches-<stack>.md` files. Add a row using the category title exactly as it appears in that file (for example `dotnet: Blocking Async Calls`). Stack categories not listed here are enabled.

---

## Universal categories

| ID | Category | Status | Reason (if disabled) |
|----|----------|--------|----------------------|
| U1 | Hardcoded Secrets | enabled | |
| U2 | Sensitive Data in Logs | enabled | |
| U3 | Missing Authorisation Checks | enabled | |
| U4 | Injection via String-Built Queries or Commands | enabled | |
| U5 | Swallowed Errors | enabled | |
| U6 | Magic Numbers and Strings | enabled | |
| U7 | TODO / FIXME / HACK Comments | enabled | |
| U8 | Commented-out Code | enabled | |
| U9 | Debugging Statements | enabled | |
| U10 | Test Quality Signals | enabled | |
| U11 | IaC Security Signals | enabled | |

## Stack categories (optional overrides)

| Stack: Category | Status | Reason (if disabled) |
|-----------------|--------|----------------------|
| | | |

---

## Examples of when to disable

- **U11** (IaC Security): the repository contains no Bicep, Terraform, CloudFormation, or Pulumi files.
- **U6** (Magic Numbers): a generated-code-heavy project where the search is all noise — prefer narrowing the glob before disabling.
- **Stack category, e.g. `dotnet: ConfigureAwait Missing (Library Code)`**: the solution has no shared library projects.
- **Stack category, e.g. ORM N+1 / unbounded query checks**: the project does not use an ORM.
