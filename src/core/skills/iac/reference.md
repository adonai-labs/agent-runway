# Reference — Azure Services & CLI Commands

---

## Common Azure Services for .NET

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
| Application Insights | `Microsoft.Insights/components@2020-02-02` | APM for .NET |
| Log Analytics Workspace | `Microsoft.OperationalInsights/workspaces@2022-10-01` | Centralised log sink |
| Azure Cache for Redis | `Microsoft.Cache/redis@2022-06-01` | Distributed cache |
| Azure Container Registry | `Microsoft.ContainerRegistry/registries@2022-02-01-preview` | Docker images |
| Virtual Network | `Microsoft.Network/virtualNetworks@2022-07-01` | Network isolation |
| Private Endpoint | `Microsoft.Network/privateEndpoints@2022-07-01` | Private connectivity |

---

## Useful CLI Commands

### Bicep

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

### Terraform

```powershell
# Initialise
terraform init

# Plan (what-if equivalent)
terraform plan -var-file=terraform.tfvars.dev

# Apply
terraform apply -var-file=terraform.tfvars.prod

# Destroy (use with extreme caution)
terraform destroy -var-file=terraform.tfvars.dev
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

## Parameter File Template

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

## CI/CD Pipeline Pattern (GitHub Actions)

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
