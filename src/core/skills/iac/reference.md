# Reference — Cloud Services & CLI Commands

Provider-neutral first; provider-specific sections are options, not defaults. Pick the one matching the repository.

---

## Cross-Provider Service Map

| Need | Azure | AWS | GCP |
|------|-------|-----|-----|
| Managed web/app hosting | App Service | Elastic Beanstalk / App Runner | App Engine / Cloud Run |
| Serverless containers | Container Apps | ECS Fargate / App Runner | Cloud Run |
| Kubernetes | AKS | EKS | GKE |
| Functions | Azure Functions | Lambda | Cloud Functions |
| Relational database | Azure SQL / Database for PostgreSQL | RDS / Aurora | Cloud SQL / AlloyDB |
| Secrets | Key Vault | Secrets Manager / SSM Parameter Store | Secret Manager |
| Messaging | Service Bus / Event Grid | SQS / SNS / EventBridge | Pub/Sub |
| Object storage | Storage Account (Blob) | S3 | Cloud Storage |
| Cache | Azure Cache for Redis | ElastiCache | Memorystore |
| Container registry | Container Registry | ECR | Artifact Registry |
| Monitoring / logs | Application Insights + Log Analytics | CloudWatch / X-Ray | Cloud Monitoring / Cloud Logging / Cloud Trace |
| Workload identity | Managed Identity | IAM Role | Service Account |
| Private connectivity | Private Endpoint / VNet | VPC Endpoint / PrivateLink | Private Service Connect / VPC |

| IaC tool | Providers | Preview | Apply |
|----------|-----------|---------|-------|
| Terraform / OpenTofu | All | `terraform plan` | `terraform apply` |
| Pulumi | All | `pulumi preview` | `pulumi up` |
| Bicep / ARM | Azure | `az deployment group what-if` | `az deployment group create` |
| CloudFormation / CDK | AWS | change set / `cdk diff` | `aws cloudformation deploy` / `cdk deploy` |
| Deployment Manager / Infrastructure Manager | GCP | preview | apply |

---

## Azure Option — Common Resource Types (Bicep)

| Service | Bicep Resource Type | Notes |
|---------|---------------------|-------|
| App Service Plan | `Microsoft.Web/serverfarms@2022-03-01` | SKU drives cost and scale |
| App Service | `Microsoft.Web/sites@2022-03-01` | `kind: 'app'` for Web App |
| Container App Environment | `Microsoft.App/managedEnvironments@2022-10-01` | Required for Container Apps |
| Container App | `Microsoft.App/containerApps@2022-10-01` | Serverless containers |
| Azure SQL Server | `Microsoft.Sql/servers@2022-05-01-preview` | Logical server |
| Azure SQL Database | `Microsoft.Sql/servers/databases@2022-05-01-preview` | Child of server |
| Key Vault | `Microsoft.KeyVault/vaults@2022-07-01` | Secrets, keys, certs |
| Service Bus Namespace | `Microsoft.ServiceBus/namespaces@2022-10-01-preview` | Queues and topics |
| Storage Account | `Microsoft.Storage/storageAccounts@2022-09-01` | Blobs, queues, tables |
| Application Insights | `Microsoft.Insights/components@2020-02-02` | APM |
| Log Analytics Workspace | `Microsoft.OperationalInsights/workspaces@2022-10-01` | Centralised log sink |
| Azure Cache for Redis | `Microsoft.Cache/redis@2022-06-01` | Distributed cache |
| Azure Container Registry | `Microsoft.ContainerRegistry/registries@2022-02-01-preview` | Docker images |
| Virtual Network | `Microsoft.Network/virtualNetworks@2022-07-01` | Network isolation |
| Private Endpoint | `Microsoft.Network/privateEndpoints@2022-07-01` | Private connectivity |

---

## Useful CLI Commands

### Terraform / OpenTofu (any provider)

```bash
terraform init
terraform fmt -check && terraform validate
terraform plan -var-file=<env>.tfvars -out=plan.tfplan   # preview
terraform apply plan.tfplan
terraform destroy -var-file=<env>.tfvars                  # extreme caution
```

### Pulumi (any provider)

```bash
pulumi preview --stack <env>
pulumi up --stack <env>
```

### AWS CloudFormation / CDK

```bash
aws cloudformation validate-template --template-body file://infra/template.yaml
aws cloudformation create-change-set --stack-name <app>-<env> --template-body file://infra/template.yaml --change-set-name preview
aws cloudformation describe-change-set --stack-name <app>-<env> --change-set-name preview
cdk diff && cdk deploy
```

### GCP

```bash
gcloud config set project <project-id>
gcloud projects get-iam-policy <project-id>   # review IAM before/after
```

### Azure Bicep

```powershell
# Validate Bicep (compile check)
az bicep build --file infra/main.bicep

# What-if (preview changes without applying)
az deployment group what-if `
  --resource-group rg-<appname>-<env> `
  --template-file infra/main.bicep `
  --parameters infra/main.parameters.<env>.json

# Deploy
az deployment group create `
  --resource-group rg-<appname>-<env> `
  --template-file infra/main.bicep `
  --parameters infra/main.parameters.<env>.json

# Decompile ARM template to Bicep
az bicep decompile --file template.json
```

### Azure Resource Management

```powershell
# Create resource group
az group create --name rg-<appname>-<env> --location australiaeast

# List resources in group
az resource list --resource-group rg-<appname>-<env> -o table

# Check deployment status
az deployment group show `
  --resource-group rg-<appname>-<env> `
  --name <deploymentName>

# View deployment operations (for failures)
az deployment operation group list `
  --resource-group rg-<appname>-<env> `
  --name <deploymentName>
```

---

## Parameter File Template (Azure Bicep option)

```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "environmentName": { "value": "dev" },
    "applicationName": { "value": "orders" },
    "location": { "value": "australiaeast" },
    "appServiceSkuName": { "value": "B1" },
    "ownerEmail": { "value": "team@example.com" },
    "costCentreCode": { "value": "CC-001" }
  }
}
```

---

## CI/CD Pipeline Pattern (GitHub Actions, Azure option)

The same shape applies to every provider: authenticate with OIDC (no stored keys), validate, preview, require review, then apply. For AWS use `aws-actions/configure-aws-credentials`; for GCP use `google-github-actions/auth`; for Terraform run `plan` then `apply` on the saved plan.

```yaml
name: Deploy Infrastructure

on:
  push:
    branches: [main]
    paths: ['infra/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Azure login
        uses: azure/login@v1
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      - name: Validate Bicep
        run: az bicep build --file infra/main.bicep

      - name: What-if
        run: |
          az deployment group what-if \
            --resource-group rg-orders-${{ vars.ENVIRONMENT }} \
            --template-file infra/main.bicep \
            --parameters infra/main.parameters.${{ vars.ENVIRONMENT }}.json

      - name: Deploy
        run: |
          az deployment group create \
            --resource-group rg-orders-${{ vars.ENVIRONMENT }} \
            --template-file infra/main.bicep \
            --parameters infra/main.parameters.${{ vars.ENVIRONMENT }}.json
```
