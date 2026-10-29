---
name: iac
description: Cloud-neutral Infrastructure as Code - defines, reviews, and troubleshoots IaC (Terraform/OpenTofu, Bicep, CloudFormation/CDK, Pulumi) for Azure, AWS, or GCP with risk scoring and contrarian review for high-impact changes. Use when the user says "/iac", "infrastructure", "Terraform", "Bicep", "CloudFormation", "Pulumi", "ARM template", "provision resources", "cloud resources", "deploy infra", "cloud setup", "new environment", or wants to create, review, or fix infrastructure.
---

# Infrastructure as Code

## Invoke Command

```
/iac <what you need>
```

Examples:
- `/iac new container service + managed Postgres for the orders service`
- `/iac review infra/main.tf`
- `/iac add a secrets store and reference it from app settings`
- `/iac create dev and prod parameter files`

Provider and tool are detected from the repository (`*.tf`, `*.bicep`, `template.yaml`/`cdk.json`, `Pulumi.yaml`) or asked once. Examples in [standards.md](standards.md) and [reference.md](reference.md) show Azure/Bicep alongside AWS and GCP equivalents; apply the same principles to whichever provider is in use.

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

- Which cloud provider and IaC tool? (detect from existing files first)
- Which managed services are needed?
- What environments? (dev / staging / prod)
- Scaling and availability requirements
- Compliance or data residency constraints
- Existing IaC base to extend, or greenfield?

Question budget:
- Execution-only: max 1 targeted question
- Execution+validation: max 2 targeted questions
- Execution+contrarian: ask only blocking questions needed for safe decision

Refer to [reference.md](reference.md) for the cross-provider service map, CLI commands, and naming conventions.

If Execution-only, apply short path:
- skip non-blocking deep discovery
- proceed to Step 3 after requirements are clear
- still enforce security review and plan/preview validation

### Step 2 - Establish Structure

All IaC lives in `infra/` at the repo root. See [standards.md](standards.md) for the full folder layout.

### Step 3 - Write / Review IaC

Apply all standards from [standards.md](standards.md):

- Parameterise everything environment-specific
- Tag every resource
- Reference secrets from the provider's secret store (Key Vault, Secrets Manager / SSM, Secret Manager)
- Use workload identity (managed identity, IAM roles, service accounts) over long-lived credentials
- Send logs and metrics to the central monitoring workspace

Simplicity guardrail:
- choose the smallest infra shape that meets requirements
- do not introduce extra modules/resources without clear need
- if structural complexity is added, include a one-line justification in the summary

### Step 4 - Security Review

Run the security checks from [standards.md](standards.md) before any deployment.

### Step 5 - Deployment Validation

Always preview changes before applying, with the tool in use:

| Tool | Preview command |
|------|-----------------|
| Terraform / OpenTofu | `terraform plan -var-file=<env>.tfvars` |
| Bicep / ARM | `az deployment group what-if --resource-group <rg> --template-file infra/main.bicep --parameters infra/main.parameters.<env>.json` |
| CloudFormation / CDK | `aws cloudformation create-change-set ...` / `cdk diff` |
| Pulumi | `pulumi preview --stack <env>` |

Document the preview output in the PR description.

For high-impact or hard-to-reverse changes, include:
- rollback path
- blast radius estimate
- dependency order for safe apply/revert

### Step 6 - Review Checklist

```
IaC Review Checklist
- [ ] All resources parameterised
- [ ] Resources tagged (environment, application, owner, cost-centre)
- [ ] Secrets from the provider's secret store - not in plaintext params
- [ ] Workload identity used where possible
- [ ] Private networking on data services (prod)
- [ ] Logs/metrics shipped to the central monitoring workspace
- [ ] Plan / what-if / change-set preview run and documented
- [ ] Module outputs documented
- [ ] Naming conventions consistent
- [ ] IaC reviewed in PR before deployment
- [ ] Risk profile recorded (impact/reversibility/uncertainty/cost of error)
- [ ] Contrarian review documented when triggered
- [ ] Rollback and blast radius documented for high-impact changes
```

### Step 7 - Memory Sync (Repeated Patterns Only)

Follow the automatic-sync rule in [../shared/memory-policy.md](../shared/memory-policy.md): write only when the same signal has been seen at least twice, at most two entries per run, one lesson per file.

Detection signals:
- same IaC failure mode repeats (mis-tagging, missing diagnostics, unsafe exposure, rollback gaps) → one entry in `.agent-runway/memory/execution-memory.md`
- same decision doubt repeats (same rejected option resurfaces, assumption repeatedly fails) → one entry in `.agent-runway/memory/reasoning-memory.md`

Keep entries concise, non-sensitive, and linked to the affected IaC paths. Report any memory write in the summary.

---

## Supporting Files

- [standards.md](standards.md) - principles, folder structure, naming, tagging, secrets, identity, with Azure/AWS/GCP examples
- [reference.md](reference.md) - cross-provider service map, CLI commands, parameter and pipeline examples
