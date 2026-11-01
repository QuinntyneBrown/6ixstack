// 6ixstack production: one Linux App Service (B1) hosting the API and the web app, and Azure SQL Basic.
// ADR 0010. Deploy with infra/README.md; GitHub Actions deploys the code on pushes to main.

@description('Azure region for every resource.')
param location string = resourceGroup().location

@description('Web app name; also the *.azurewebsites.net host name.')
param appName string = 'sixstack'

@description('SQL logical server name.')
param sqlServerName string = 'sixstack-sql'

@description('SQL administrator login.')
param sqlAdminLogin string = 'sixstackadmin'

@secure()
@description('SQL administrator password.')
param sqlAdminPassword string

@description('GitHub repository (owner/name) allowed to deploy through OIDC.')
param githubRepository string = 'QuinntyneBrown/6ixstack'

var connectionString = 'Server=tcp:${sqlServer.properties.fullyQualifiedDomainName},1433;Initial Catalog=${database.name};User ID=${sqlAdminLogin};Password=${sqlAdminPassword};Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'

resource plan 'Microsoft.Web/serverfarms@2024-04-01' = {
  name: '${appName}-plan'
  location: location
  kind: 'linux'
  sku: { name: 'B1', tier: 'Basic', capacity: 1 }
  properties: { reserved: true }
}

resource app 'Microsoft.Web/sites@2024-04-01' = {
  name: appName
  location: location
  kind: 'app,linux'
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'DOTNETCORE|10.0'
      alwaysOn: true
      http20Enabled: true
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      healthCheckPath: '/health/live'
      appSettings: [
        { name: 'ASPNETCORE_ENVIRONMENT', value: 'Production' }
        { name: 'ASPNETCORE_FORWARDEDHEADERS_ENABLED', value: 'true' }
        { name: 'Database__Provider', value: 'SqlServer' }
        { name: 'Site__PublicBaseUrl', value: 'https://${appName}.azurewebsites.net' }
        { name: 'Swagger__Enabled', value: 'false' }
        { name: 'DevMailbox__Expose', value: 'false' }
      ]
      connectionStrings: [
        { name: 'Default', type: 'SQLAzure', connectionString: connectionString }
      ]
    }
  }
}

resource ftpPolicy 'Microsoft.Web/sites/basicPublishingCredentialsPolicies@2024-04-01' = {
  parent: app
  name: 'ftp'
  properties: { allow: false }
}

resource scmPolicy 'Microsoft.Web/sites/basicPublishingCredentialsPolicies@2024-04-01' = {
  parent: app
  name: 'scm'
  properties: { allow: false }
}

resource sqlServer 'Microsoft.Sql/servers@2023-08-01' = {
  name: sqlServerName
  location: location
  properties: {
    administratorLogin: sqlAdminLogin
    administratorLoginPassword: sqlAdminPassword
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
  }
}

// 0.0.0.0 admits Azure services (the web app); the deploy workflow adds and removes a rule for its runner.
resource allowAzure 'Microsoft.Sql/servers/firewallRules@2023-08-01' = {
  parent: sqlServer
  name: 'AllowAzureServices'
  properties: { startIpAddress: '0.0.0.0', endIpAddress: '0.0.0.0' }
}

resource database 'Microsoft.Sql/servers/databases@2023-08-01' = {
  parent: sqlServer
  name: 'sixstack'
  location: location
  sku: { name: 'Basic', tier: 'Basic', capacity: 5 }
  properties: {
    maxSizeBytes: 2147483648
    requestedBackupStorageRedundancy: 'Local'
  }
}

// GitHub Actions signs in as this identity through OIDC; no Azure secret is stored in GitHub.
resource deployer 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: '${appName}-github-deployer'
  location: location
}

resource deployerMain 'Microsoft.ManagedIdentity/userAssignedIdentities/federatedIdentityCredentials@2023-01-31' = {
  parent: deployer
  name: 'github-main'
  properties: {
    issuer: 'https://token.actions.githubusercontent.com'
    subject: 'repo:${githubRepository}:ref:refs/heads/main'
    audiences: ['api://AzureADTokenExchange']
  }
}

resource deployerProduction 'Microsoft.ManagedIdentity/userAssignedIdentities/federatedIdentityCredentials@2023-01-31' = {
  parent: deployer
  name: 'github-production'
  dependsOn: [deployerMain] // federated credentials on one identity cannot be written concurrently
  properties: {
    issuer: 'https://token.actions.githubusercontent.com'
    subject: 'repo:${githubRepository}:environment:production'
    audiences: ['api://AzureADTokenExchange']
  }
}

var websiteContributor = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'de139f84-1756-47ae-9be6-808fbbe84772')
var sqlServerContributor = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '6d8ee4ec-f05a-4a1d-8b00-a9b17e38b437')

resource deployerOnApp 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: app
  name: guid(app.id, deployer.id, websiteContributor)
  properties: { roleDefinitionId: websiteContributor, principalId: deployer.properties.principalId, principalType: 'ServicePrincipal' }
}

resource deployerOnSql 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: sqlServer
  name: guid(sqlServer.id, deployer.id, sqlServerContributor)
  properties: { roleDefinitionId: sqlServerContributor, principalId: deployer.properties.principalId, principalType: 'ServicePrincipal' }
}

output webAppName string = app.name
output webAppUrl string = 'https://${app.properties.defaultHostName}'
output sqlServerName string = sqlServer.name
output deployerClientId string = deployer.properties.clientId
