# IaC Standards

Provider-neutral principles first. Code examples show Azure/Bicep and AWS or GCP/Terraform as options; apply the equivalent for the provider and tool in the repository.

## Principles (all providers)

- Everything environment-specific is a parameter/variable; no hardcoded SKUs, regions, or names.
- Every resource is tagged/labelled with `environment`, `application`, `owner`, `cost-centre`, `managed-by`.
- Secrets live in the provider's secret store and are referenced at deploy/run time — never in parameter files or state in plaintext.
- Workloads authenticate with workload identity (managed identity, IAM role, service account), not long-lived keys.
- Data services use private networking in production; public exposure is explicit and justified.
- Logs and metrics flow to the central monitoring workspace.
- Every change is previewed (plan / what-if / change set / preview) and reviewed before apply.
- Remote, locked, encrypted state for Terraform/Pulumi.

---

## Folder Structure

Bicep (Azure option):

```
infra/
  main.bicep                        # Entry point — orchestrates modules
  main.parameters.dev.json
  main.parameters.staging.json
  main.parameters.prod.json
  modules/
    app-service.bicep
    sql-database.bicep
    key-vault.bicep
    service-bus.bicep
    networking.bicep
    monitoring.bicep
  scripts/
    deploy.ps1
    what-if.ps1
```

Terraform (any provider):

```
infra/
  main.tf
  variables.tf
  outputs.tf
  terraform.tfvars.dev
  terraform.tfvars.prod
  modules/
    app-service/
      main.tf
      variables.tf
      outputs.tf
    database/
    networking/
```

---

## Naming Convention

Pattern: `{resourceAbbreviation}-{appName}-{environment}`. Use the provider's documented abbreviations and length/character limits; the Azure abbreviations below are one example.

| Resource | Abbreviation | Example |
|----------|-------------|---------|
| Resource Group | `rg` | `rg-orders-prod` |
| App Service Plan | `plan` | `plan-orders-prod` |
| App Service | `app` | `app-orders-prod` |
| Azure SQL Server | `sql` | `sql-orders-prod` |
| Azure SQL Database | `db` | `db-orders-prod` |
| Key Vault | `kv` | `kv-orders-prod` |
| Storage Account | `st` | `stordersprod` (no hyphens) |
| Service Bus | `sb` | `sb-orders-prod` |
| Container App | `ca` | `ca-orders-prod` |
| Container App Environment | `cae` | `cae-orders-prod` |
| Log Analytics Workspace | `log` | `log-orders-prod` |
| Application Insights | `appi` | `appi-orders-prod` |

Use `uniqueString()` for globally unique resource names in Bicep:

```bicep
var storageAccountName = 'st${appName}${uniqueString(resourceGroup().id)}'
```

---

## Parameterisation

```bicep
// ✅ All environment-specific values are parameters
@description('Name of the environment (dev, staging, prod)')
param environmentName string

@description('Azure region for all resources')
param location string = resourceGroup().location

@description('App Service SKU name')
@allowed(['B1', 'S1', 'P1v3'])
param appServiceSkuName string = 'B1'

// ❌ Never hardcode environment-specific values
var skuName = 'P1v3'
```

---

## Mandatory Resource Tagging

Every resource must have these tags (labels on GCP):

```hcl
# Terraform (AWS option) — provider-level default tags
provider "aws" {
  default_tags {
    tags = {
      environment = var.environment
      application = var.application
      owner       = var.owner
      cost-centre = var.cost_centre
      managed-by  = "terraform"
    }
  }
}
```

Bicep (Azure option):

```bicep
var commonTags = {
  environment: environmentName
  application: applicationName
  owner: ownerEmail
  costCentre: costCentreCode
  managedBy: 'bicep'
}
```

Apply via the `tags` property on every resource:

```bicep
resource appService 'Microsoft.Web/sites@2022-03-01' = {
  tags: commonTags
  ...
}
```

---

## Secrets — Secret Store References

```hcl
# Terraform (AWS option) — read at deploy time, never commit the value
data "aws_secretsmanager_secret_version" "db" {
  secret_id = "orders/${var.environment}/db"
}
```

```bicep
// Bicep (Azure option)
// ✅ Reference Key Vault at deploy time — never hardcode
resource keyVault 'Microsoft.KeyVault/vaults@2022-07-01' existing = {
  name: keyVaultName
}

resource appService 'Microsoft.Web/sites@2022-03-01' = {
  properties: {
    siteConfig: {
      appSettings: [
        {
          name: 'ConnectionStrings__Default'
          value: '@Microsoft.KeyVault(SecretUri=${keyVault.properties.vaultUri}secrets/DbConnectionString/)'
        }
      ]
    }
  }
}

// ❌ Never in parameter files in plaintext
// "ConnectionStrings__Default": "Server=prod-sql;Password=hunter2"
```

---

## Workload Identity

Grant the workload an identity and least-privilege access to exactly the secrets/resources it needs (AWS: IAM role + policy; GCP: service account + IAM binding; Azure: managed identity + role assignment or access policy).

```bicep
// Bicep (Azure option)
// ✅ System-assigned managed identity
resource appService 'Microsoft.Web/sites@2022-03-01' = {
  identity: {
    type: 'SystemAssigned'
  }
}

// Grant Key Vault access
resource kvAccessPolicy 'Microsoft.KeyVault/vaults/accessPolicies@2022-07-01' = {
  name: '${keyVaultName}/add'
  properties: {
    accessPolicies: [
      {
        tenantId: subscription().tenantId
        objectId: appService.identity.principalId
        permissions: { secrets: ['get', 'list'] }
      }
    ]
  }
}
```

---

## Diagnostics and Monitoring (All Resources)

Ship resource logs and metrics to the central workspace (Azure diagnostic settings → Log Analytics; AWS CloudWatch log groups/metrics; GCP Cloud Logging sinks).

```bicep
// Bicep (Azure option)
resource diagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'diag-${appServiceName}'
  scope: appService
  properties: {
    workspaceId: logAnalyticsWorkspaceId
    logs: [{ category: 'AppServiceHTTPLogs', enabled: true }]
    metrics: [{ category: 'AllMetrics', enabled: true }]
  }
}
```

---

## Security Posture

```hcl
# Terraform (AWS option)
resource "aws_db_instance" "orders" {
  publicly_accessible = false
  storage_encrypted   = true
  # ...
}
```

```bicep
// Bicep (Azure option)
// ✅ Disable public network access on SQL in production
resource sqlServer 'Microsoft.Sql/servers@2022-05-01-preview' = {
  properties: {
    publicNetworkAccess: environmentName == 'prod' ? 'Disabled' : 'Enabled'
    minimalTlsVersion: '1.2'
  }
}

// ✅ Private endpoint for SQL in production
resource privateEndpoint 'Microsoft.Network/privateEndpoints@2022-07-01' = if (environmentName == 'prod') {
  ...
}
```

---

## Module Pattern

Small, single-purpose modules with typed inputs, documented outputs, and tags passed in. Example (Bicep, Azure option):

```bicep
// modules/app-service.bicep
@description('Environment name')
param environmentName string

@description('App name')
param appName string

param location string = resourceGroup().location
param skuName string = 'B1'
param tags object

output appServiceId string = appService.id
output appServicePrincipalId string = appService.identity.principalId

// --- resources defined here ---
```

```bicep
// main.bicep — invoke the module
module appServiceModule './modules/app-service.bicep' = {
  name: 'appServiceDeploy'
  params: {
    environmentName: environmentName
    appName: applicationName
    skuName: appServiceSkuName
    tags: commonTags
  }
}
```
