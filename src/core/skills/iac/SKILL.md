---
name: iac
description: Infrastructure as Code for .NET on Azure - defines, reviews, and troubleshoots Bicep and Terraform for .NET applications. Use when the user says "/iac", "infrastructure", "Bicep", "Terraform", "ARM template", "provision resources", "Azure resources", "deploy infra", "cloud setup", "new environment", or wants to create, review, or fix infrastructure for a .NET application.
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

> Not sure which skill to use? Start with `/start` - it classifies intent and routes to the right skill.

---

## Workflow

Follow these steps in order.

### Step 0 - Risk Classification and Routing Gate

Before any IaC change, classify:

- Impact: low/medium/high
- Reversibility: reversible/hard-to-reverse/irreversible
- Uncertainty: low/medium/high
- Cost of error: low/medium/high

Contrarian trigger (any true):
- impact is high and reversibility is hard-to-reverse or irreversible
- uncertainty is high
- migration/cutover with ambiguous rollback
- architecture decision with multiple viable infrastructure patterns

Execution mode:
- Execution-only: low risk + reversible + low uncertainty
- Execution+validation: medium risk or multi-resource change
- Execution+contrarian: contrarian trigger active

Policy:
- Execution-only: continue with minimal questions and minimal process overhead.
- Execution+validation: continue with normal IaC workflow.
- Execution+contrarian: run mandatory contrarian review before writing IaC.

Decision action table:

| Profile | Action |
|---|---|
| High impact + irreversible + high uncertainty | `Block` - stop and escalate before changes |
| Medium risk profile | `Warn` - continue only with explicit risk notes and validation checks |
| Low risk + reversible + low uncertainty | `Execute` - use short path |

### Step 0.5 - Contrarian Review (Required when triggered)

When triggered, document:
- recommended infrastructure approach
- strongest counter-argument
- at least one viable alternative
- top operational/security risks and invalidation signals
- verdict: `Go`, `Go with conditions`, or `Stop`

If verdict is `Stop`, halt and escalate.
If verdict is `Go with conditions`, convert conditions to explicit validation checks.

Contrarian output template:

```markdown
### IaC Contrarian Review
- Recommended path: [option]
- Strongest counter-argument: [brief]
- Viable alternative: [brief]
- Invalidation signals: [what would prove recommendation wrong]
- Verdict: [Go | Go with conditions | Stop]
- Conditions to enforce (if any): [validation/rollback checks]
```

### Step 1 - Understand Requirements

Before writing any IaC, clarify:

- What Azure services are needed?
- What environments? (dev / staging / prod)
- Scaling and availability requirements
- Compliance or data residency constraints
- Existing IaC base to extend, or greenfield?

Question budget:
- Execution-only: max 1 targeted question
- Execution+validation: max 2 targeted questions
- Execution+contrarian: ask only blocking questions needed for safe decision

Refer to [reference.md](reference.md) for the standard Azure service list and naming conventions.

If Execution-only, apply short path:
- skip non-blocking deep discovery
- proceed to Step 3 after requirements are clear
- still enforce security review and what-if validation

### Step 2 - Establish Structure

All IaC lives in `infra/` at the repo root. See [standards.md](standards.md) for the full folder layout.

### Step 3 - Write / Review IaC

Apply all standards from [standards.md](standards.md):

- Parameterise everything environment-specific
- Tag every resource
- Reference secrets via Key Vault
- Use managed identity over service principals
- Enable diagnostic settings

Simplicity guardrail:
- choose the smallest infra shape that meets requirements
- do not introduce extra modules/resources without clear need
- if structural complexity is added, include a one-line justification in the summary

### Step 4 - Security Review

Run the security checks from [standards.md](standards.md) before any deployment.

### Step 5 - Deployment Validation

Always run `what-if` before applying:

```powershell
az deployment group what-if `
  --resource-group rg-<appname>-<env> `
  --template-file infra/main.bicep `
  --parameters infra/main.parameters.<env>.json
```

Document the `what-if` output in the PR description.

For high-impact or hard-to-reverse changes, include:
- rollback path
- blast radius estimate
- dependency order for safe apply/revert

### Step 6 - Review Checklist

```
IaC Review Checklist
- [ ] All resources parameterised
- [ ] Resources tagged (environment, application, owner, cost-centre)
- [ ] Secrets via Key Vault - not in plaintext params
- [ ] Managed identity used where possible
- [ ] Private endpoints on data services (prod)
- [ ] Diagnostic settings enabled -> Log Analytics
- [ ] what-if run and documented
- [ ] Module outputs documented
- [ ] Naming conventions consistent
- [ ] IaC reviewed in PR before deployment
- [ ] Risk profile recorded (impact/reversibility/uncertainty/cost of error)
- [ ] Contrarian review documented when triggered
- [ ] Rollback and blast radius documented for high-impact changes
```

### Step 7 - Memory Sync (Repeated Patterns)

If repeated patterns are detected, update memory artifacts automatically.

Detection signals:
- same IaC failure mode repeats (mis-tagging, missing diagnostics, unsafe exposure, rollback gaps)
- same decision doubt repeats (same rejected option resurfaces, assumption repeatedly fails)

Write rules:
- append max 1 entry to `.agent-runway/memory/execution-memory.md`
- append max 1 entry to `.agent-runway/memory/reasoning-memory.md`
- deduplicate near-identical entries (update existing instead of append)
- keep entries concise, non-sensitive, and linked to affected IaC artifact paths

---

## Supporting Files

- [standards.md](standards.md) - folder structure, naming, Bicep/Terraform patterns, tagging
- [reference.md](reference.md) - Azure service resource types, CLI commands, parameter examples
