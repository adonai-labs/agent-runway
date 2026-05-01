# Review Search Configuration

Controls which of the 21 mandatory search categories from `systematic-searches.md` apply to this project.
Maintained by the tech lead or architect. If this file does not exist, all 21 categories run by default.

---

## How to use

Set each category to `enabled` or `disabled`. Disabled categories must include a reason.
The `/review` and `/security-scan` skills read this file at the start of Phase 2a.

---

## Categories

| # | Category | Status | Reason (if disabled) |
|---|----------|--------|----------------------|
| 1 | Blocking Async Calls | enabled | |
| 2 | async void | enabled | |
| 3 | Thread.Sleep in Async Code | enabled | |
| 4 | Direct Service Instantiation | enabled | |
| 5 | Direct HttpClient Instantiation | enabled | |
| 6 | Swallowed Exceptions | enabled | |
| 7 | Raw SQL / SQL Injection Risk | enabled | |
| 8 | Hardcoded Secrets | enabled | |
| 9 | Missing Authorisation | enabled | |
| 10 | Sensitive Data in Logs | enabled | |
| 11 | BinaryFormatter Usage | enabled | |
| 12 | N+1 Query Risk | enabled | |
| 13 | Unbounded Queries | enabled | |
| 14 | Magic Numbers and Strings | enabled | |
| 15 | Missing CancellationToken | enabled | |
| 16 | String Interpolation in Log Calls | enabled | |
| 17 | ConfigureAwait Missing (Library Code) | enabled | |
| 18 | TODO / FIXME / HACK Comments | enabled | |
| 19 | Console.WriteLine (Production Code) | enabled | |
| 20 | Test Quality Signals | enabled | |
| 21 | IaC Security Signals | enabled | |

---

## Examples of when to disable

- **Category 17** (ConfigureAwait): disable if the project has no library/shared projects — only ASP.NET Core applications
- **Category 21** (IaC Security): disable if the project has no Bicep or Terraform files
- **Category 12/13** (N+1 / Unbounded): disable if the project does not use EF Core
