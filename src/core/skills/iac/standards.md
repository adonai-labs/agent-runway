# IaC Standards

---

## Folder Structure

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

Terraform equivalent:

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

Pattern: `{resourceAbbreviation}-{appName}-{environment}`

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

Every resource must have these tags:

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

## Secrets — Key Vault References

```bicep
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

## Managed Identity

```bicep
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

## Diagnostic Settings (All Resources)

```bicep
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

```bicep
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
