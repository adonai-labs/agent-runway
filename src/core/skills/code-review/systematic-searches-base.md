# Universal Code Review Searches

These searches apply to all codebases regardless of language or stack.

---

## Category: Hardcoded Secrets

```bash
rg "(password|secret|apikey|api_key|connectionstring|token)\s*=\s*[\"'][^{\"']{4,}[\"']" -i
```

Critical. Any match is a security incident. Move to environment variables or secrets management.

---

## Category: Sensitive Data in Logs

```bash
rg "(password|token|secret|apikey|api_key)" --type log -i
rg "log.*password|log.*token|log.*secret" -i
```

Critical. PII, passwords, and tokens must never appear in log output.

---

## Category: Missing Authorisation Checks

Review authentication and authorization manually:
- Are protected endpoints/routes properly guarded?
- Are authorization checks at the right layer?
- Is RBAC or permission system correctly applied?

This requires manual review - automated searches cannot fully validate authorization logic.

---

## Category: Magic Numbers and Strings

```bash
rg "^\s*(if|while|return|const|let|var)\s+.*[^a-zA-Z\"']\d{2,}[^a-zA-Z\d]"
```

Medium. Constants should be named. Review matches for unexplained numeric literals.

---

## Category: TODO / FIXME / HACK Comments

```bash
rg "TODO|FIXME|HACK|XXX" -i
```

Medium. Each match must be accompanied by a linked issue or be removed before merge.

---

## Category: Commented-out Code

```bash
rg "^\s*//\s*(function|class|const|let|var|def|public|private)"
rg "^\s*#\s*(def|class)"
rg "^\s*/\*[\s\S]*?function|class"
```

Low-Medium. Commented code should be removed. Use version control instead.

---

## Category: IaC Security Signals

For infrastructure-as-code files (Bicep, Terraform, CloudFormation):

```bash
# Hardcoded values in IaC
rg "\"password\"|\"secret\"|\"key\"" --glob "**/*.bicep"
rg "password\s*=" --glob "**/*.tf"

# Public network access enabled
rg "publicNetworkAccess.*Enabled|public_network_access_enabled.*true" --glob "**/*.bicep" --glob "**/*.tf"
```

Critical for IaC changes. All secrets must be Key Vault references or parameter inputs. Public network access must be intentional and documented.

---

## Category: Debugging Statements

Look for common debugging patterns:
- Print/debug statements that shouldn't be in production code
- Temporary workarounds or test data
- Development-only code paths

This often requires manual review based on project conventions.

---

## Notes

- Stack-specific searches are in separate files (e.g., `code-review-searches.md` in each stack directory)
- These universal searches should be run on every code review regardless of technology
- Combine these results with stack-specific search results for a complete review
