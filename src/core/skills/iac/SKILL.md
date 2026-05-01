---
name: iac
description: Infrastructure as Code for .NET on Azure — defines, reviews, and troubleshoots Bicep and Terraform for .NET applications. Use when the user says "/iac", "infrastructure", "Bicep", "Terraform", "ARM template", "provision resources", "Azure resources", "deploy infra", "cloud setup", "new environment", or wants to create, review, or fix infrastructure for a .NET application.
---

# Infrastructure as Code

## Invoke Command

```
/iac <what you need>
```

Examples:
- `/iac new App Service + SQL Database for the orders service`
- `/iac review infra/main.bicep`
- `/iac add Key Vault and update app settings references`
- `/iac create dev and prod parameter files`

> Not sure which skill to use? Start with `/start` — it classifies intent and routes to the right skill.

---

## Workflow

**Follow these steps in order.**

### Step 1 — Understand Requirements

Before writing any IaC, clarify:

- What Azure services are needed?
- What environments? (dev / staging / prod)
- Scaling and availability requirements
- Compliance or data residency constraints
- Existing IaC base to extend, or greenfield?

Refer to [reference.md](reference.md) for the standard Azure service list and naming conventions.

### Step 2 — Establish Structure

All IaC lives in `infra/` at the repo root. See [standards.md](standards.md) for the full folder layout.

### Step 3 — Write / Review IaC

Apply all standards from [standards.md](standards.md):

- Parameterise everything environment-specific
- Tag every resource
- Reference secrets via Key Vault
- Use managed identity over service principals
- Enable diagnostic settings

### Step 4 — Security Review

Run the security checks from [standards.md](standards.md) before any deployment.

### Step 5 — Deployment Validation

Always run `what-if` before applying:

```powershell
az deployment group what-if `
  --resource-group rg-<appname>-<env> `
  --template-file infra/main.bicep `
  --parameters infra/main.parameters.<env>.json
```

Document the `what-if` output in the PR description.

### Step 6 — Review Checklist

```
IaC Review Checklist
- [ ] All resources parameterised
- [ ] Resources tagged (environment, application, owner, cost-centre)
- [ ] Secrets via Key Vault — not in plaintext params
- [ ] Managed identity used where possible
- [ ] Private endpoints on data services (prod)
- [ ] Diagnostic settings enabled → Log Analytics
- [ ] what-if run and documented
- [ ] Module outputs documented
- [ ] Naming conventions consistent
- [ ] IaC reviewed in PR before deployment
```

---

## Supporting Files

- [standards.md](standards.md) — folder structure, naming, Bicep/Terraform patterns, tagging
- [reference.md](reference.md) — Azure service resource types, CLI commands, parameter examples
