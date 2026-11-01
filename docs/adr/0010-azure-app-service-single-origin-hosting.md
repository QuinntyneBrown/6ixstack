# 0010 Azure App Service hosts the API and the web app on one origin

- Status: accepted

## Context

The web app calls the API on its own origin (`API_BASE_URL` is `''`), and sign-in relies on a `SameSite=Lax`
session cookie and an antiforgery cookie. In development `ng serve` proxies `/api`, `/auth`, `/health`, `/feeds`
and `/e` to the API. Production needs the same single origin, for about two users, at the lowest cost that is
still production grade (SLA, always on for the outbox and weekly-summary background jobs, managed TLS).

## Decision

- One Linux App Service plan, **B1** (Basic), in **Canada Central**, running one web app. Free/Shared tiers have
  no SLA and no Always On, which the hosted background jobs need.
- The API serves the Angular build from `wwwroot` (`UseDefaultFiles`, `UseStaticFiles`) and falls back to
  `index.html` for every non-file path outside the server routes. No proxy, CDN or Static Web App.
- **Azure SQL Database, Basic (5 DTU, 2 GB)** stays on the SQL Server provider and its migrations (ADR 0001).
- GitHub Actions deploys on every push to `main` after build and tests pass, signing in to Azure with OIDC
  through a user-assigned managed identity (no stored Azure secrets). The workflow runs the CLI `migrate`
  command before deploying the app, opening a temporary SQL firewall rule for the runner.
- Infrastructure is declared in `infra/main.bicep`.
- Data-protection keys use App Service's default persisted key folder (`/home/ASP.NET/DataProtection-Keys`).

## Consequences

- Monthly cost is roughly B1 plus SQL Basic (about US$18). Scale up the plan or the database when traffic grows.
- Email still goes to the in-process dev mailbox, which production does not expose. Magic-link sign-in needs a
  real `IEmailSender` (for example Azure Communication Services Email) before organizers can sign in.
- The web app's security headers now cover the HTML as well as the API responses.
