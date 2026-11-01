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

## Managing production events

The CLI's `events` commands (ADR 0011) work against production the same way the deploy workflow runs `migrate`:
open the SQL firewall for your IP, point `ConnectionStrings__Default` at the database, run the commands, and close
the firewall again. You need a moderator account in the production database to write.

1. Open the firewall for your IP:

   ```sh
   ip=$(curl -fsS https://api.ipify.org)
   az sql server firewall-rule create -g rg-sixstack-prod -s sixstack-sql -n "cli-$USER" \
     --start-ip-address "$ip" --end-ip-address "$ip" -o none
   ```

2. Set the connection string without writing it to your shell history. With SQL authentication, use the
   administrator login (the value of the `SQL_CONNECTION_STRING` secret):

   ```sh
   read -rs ConnectionStrings__Default && export ConnectionStrings__Default
   ```

   Entra ID authentication (`Server=tcp:sixstack-sql.database.windows.net,1433;Database=sixstack;
   Authentication=Active Directory Default`, using your `az login`) needs an Entra administrator on
   `sixstack-sql`, which `main.bicep` does not configure yet.

3. Read first, preview writes with `--dry-run`, then apply with `--yes`:

   ```sh
   export SIXSTACK_ACTOR=you@example.org   # your moderator account
   dotnet run --project src/SixStack.Cli -- events list --search "azure"
   dotnet run --project src/SixStack.Cli -- events update <slug> --title "Corrected title" --dry-run
   dotnet run --project src/SixStack.Cli -- events update <slug> --title "Corrected title" --yes
   ```

   Deletes are soft: the event's status becomes `deleted`, it leaves the site and feeds, and the row stays.
   Every write records an audit entry naming your account and "via CLI".

4. Close the firewall:

   ```sh
   unset ConnectionStrings__Default
   az sql server firewall-rule delete -g rg-sixstack-prod -s sixstack-sql -n "cli-$USER"
   ```

Never run `reset` against production: it drops and recreates the database, and it has no guard yet.
