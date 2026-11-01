# Infrastructure

Production runs on the cheapest production-grade Azure setup for a handful of users (ADR 0010), in
`rg-sixstack-prod`, Canada Central:

| Resource | SKU | Purpose |
| --- | --- | --- |
| App Service plan `sixstack-plan` | Linux B1 | Always on, SLA, managed TLS |
| Web app `sixstack` | .NET 10 | The API, serving the Angular build from `wwwroot` |
| SQL server `sixstack-sql`, database `sixstack` | Basic, 5 DTU, 2 GB | The product database |
| Managed identity `sixstack-github-deployer` | | GitHub Actions OIDC sign-in, scoped to the web app and SQL server |

## Provision or update

```sh
az group create -n rg-sixstack-prod -l canadacentral
az deployment group create -g rg-sixstack-prod -f infra/main.bicep -p sqlAdminPassword='<password>'
```

The password must match the `SQL_CONNECTION_STRING` secret in GitHub.

## Continuous deployment

`.github/workflows/deploy.yml` runs after CI succeeds on a push to `main` (or by hand). It builds the web app,
publishes the API with the web app in `wwwroot`, runs the CLI `migrate` command through a temporary SQL firewall
rule, deploys, and smoke-tests `https://sixstack.azurewebsites.net`.

GitHub configuration:

- Variables: `AZURE_CLIENT_ID` (the deployer identity's client id), `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`,
  `AZURE_RESOURCE_GROUP`, `AZURE_WEBAPP_NAME`, `AZURE_SQL_SERVER`.
- Secret: `SQL_CONNECTION_STRING`.
