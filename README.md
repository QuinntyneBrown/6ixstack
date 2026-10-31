<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/assets/logo-dark.svg">
    <img src="docs/assets/logo.svg" alt="6ixstack" width="280">
  </picture>
</p>

<p align="center">
  <strong>Every dev event in the 6ix.</strong><br>
  Meetups and conferences across Toronto and the GTA, plus global talks you can stream. All in one calendar.
</p>

<p align="center">
  <a href="https://github.com/QuinntyneBrown/6ixstack/actions/workflows/ci.yml"><img src="https://github.com/QuinntyneBrown/6ixstack/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI"></a>
  <img src="https://img.shields.io/badge/.NET-10-512BD4" alt=".NET 10">
  <img src="https://img.shields.io/badge/Angular-workspace-DD0031" alt="Angular">
  <img src="https://img.shields.io/badge/WCAG-2.2%20AA-2E7D32" alt="WCAG 2.2 AA">
</p>

<p align="center">
  <a href="#getting-started">Getting started</a> ·
  <a href="#documentation">Documentation</a> ·
  <a href="CONTRIBUTING.md">Contributing</a> ·
  <a href="https://github.com/QuinntyneBrown/6ixstack/issues">Report a bug</a>
</p>

---

## About

6ixstack is a free, community-run calendar of developer events in Toronto, the Greater Toronto Area (GTA) and
online. Visitors find events without an account. Organizers submit events with only an email address.
Volunteer moderators review every submission before it is published.

## Features

| Area           | What you can do                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Discovery      | Browse upcoming events by day in Toronto time, filter by format and topic, search, and open a month calendar. |
| Event map      | See where events happen on a map, with stream origins and a two-week timeline you can play.                   |
| Event detail   | Read full details for in-person, hybrid, streaming, past and cancelled events.                                |
| Directory      | Browse communities and speakers, each with their own page and events.                                         |
| Calendar feeds | Subscribe to ready-made or custom iCalendar feeds in Google Calendar, Outlook or Apple Calendar.              |
| Add and share  | Add a single event to your calendar or share its link.                                                        |
| Submissions    | Submit an event for free; report a problem with a listing.                                                    |
| Organizers     | Sign in with a magic link, see your events and their status, edit or cancel them.                             |
| Moderation     | Review submissions with automated checks, then approve or reject with a reason.                               |
| Notifications  | Get in-app and email notifications about review outcomes, reports and event changes.                          |
| Accounts       | Manage your profile and notification preferences, sign out, or delete your account.                           |

Every screen is responsive from phone to desktop, supports light and dark themes, meets WCAG 2.2 AA, and
uses no tracking.

## Architecture

```mermaid
flowchart LR
  browser[Web app<br/>Angular SPA] -->|HTTPS / JSON| api[SixStack.Api<br/>ASP.NET Core]
  cal[Calendar apps] -->|iCalendar feeds| api
  api --> app[SixStack.Application<br/>MediatR handlers]
  app --> domain[SixStack.Domain]
  api --> infra[SixStack.Infrastructure<br/>EF Core, email, outbox]
  infra --> db[(SQL Server)]
  cli[SixStack.Cli] --> infra
```

| Component                      | Technology                | Responsibility                                                              |
| ------------------------------ | ------------------------- | --------------------------------------------------------------------------- |
| `frontend/projects/sixstack`   | Angular, service worker   | The web app: pages, dialogs and notifications.                              |
| `frontend/projects/components` | Angular, Storybook        | The `sx-*` component library on Fluent UI v9 design tokens.                 |
| `frontend/projects/api`        | TypeScript                | Typed API contracts, injection tokens and clients.                          |
| `src/SixStack.Api`             | ASP.NET Core              | Controllers, authentication, authorization, rate limiting, problem details. |
| `src/SixStack.Application`     | MediatR, FluentValidation | Commands, queries, validators and DTOs.                                     |
| `src/SixStack.Domain`          | .NET                      | Entities and enums, with no dependencies.                                   |
| `src/SixStack.Infrastructure`  | EF Core, SQL Server       | Persistence, migrations, email, geocoding, outbox, seeder.                  |
| `src/SixStack.Cli`             | .NET console              | Migrate, seed and reset the database.                                       |

The API never applies migrations on startup. Run the CLI `migrate` command instead. See the
[detailed designs](docs/detailed-designs/README.md) for the full architecture.

## Getting started

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 24 LTS](https://nodejs.org/) and npm
- SQL Server 2022, SQL Server Express LocalDB, or the SQL Server container image
- [Git LFS](https://git-lfs.com/), for the demo videos

### Clone and build

```bash
git clone https://github.com/QuinntyneBrown/6ixstack.git
cd 6ixstack
git lfs pull
dotnet build SixStack.sln
cd frontend && npm ci
```

### Set up the database

Set the connection string, then migrate and seed:

```bash
export ConnectionStrings__Default="Server=localhost;Database=SixStack;Trusted_Connection=True;TrustServerCertificate=True"
dotnet run --project src/SixStack.Cli -- migrate
dotnet run --project src/SixStack.Cli -- seed
```

Seeding is idempotent and safe to re-run. `reset` drops and recreates the database.

### Run the app

```bash
# Terminal 1: the API, with Swagger at /swagger
dotnet run --project src/SixStack.Api

# Terminal 2: the web app at http://localhost:4200
cd frontend && npm start
```

In development, emails such as sign-in links go to a local dev mailbox instead of being sent.

## Development

### Tests

| Suite           | Command                                                             | Notes                                                                                       |
| --------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Backend         | `dotnet test`                                                       | In-memory SQLite and EF Core InMemory. No database server needed.                           |
| SQL Server only | `SIXSTACK_TEST_SQLSERVER=1 dotnet test --filter Category=SqlServer` | Runs `[SqlServerFact]` tests against a real SQL Server.                                     |
| End to end      | `cd frontend && npm run e2e`                                        | Playwright in Chromium against the API on a seeded SQLite database, with visual regression. |

### Frontend tasks

Run these from `frontend/`:

| Command                                         | Purpose                                                    |
| ----------------------------------------------- | ---------------------------------------------------------- |
| `npm run lint`                                  | angular-eslint                                             |
| `npm run format` / `npm run format:check`       | Prettier                                                   |
| `npm run tokens` / `npm run tokens:check`       | Generate or verify design tokens from the TypeScript theme |
| `npm run storybook` / `npm run build-storybook` | Component library docs                                     |
| `npm run perf-test`                             | Component performance scenarios                            |
| `npm run demo -- <nn>-<journey>`                | Record a journey's narrated demo video into `docs/demos/`  |

A husky pre-commit hook formats and lints staged frontend files. CI runs every check above on each pull request.

## Repository structure

```text
SixStack.sln
src/                 .NET projects: Domain, Application, Infrastructure, Api, Cli
tests/               one test project per src project
frontend/            Angular workspace: sixstack, api, components, perf-test, e2e
docs/                requirements, designs, mocks, design system, journeys, prompts, demos
.github/             CI workflows
```

[AGENTS.md](AGENTS.md) holds the full, binding layout and conventions.

## Documentation

| Document                                            | Contents                                                                                |
| --------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [Requirements](docs/specs/L1.md)                    | L1 high-level and [L2 detailed](docs/specs/L2.md) requirements with acceptance criteria |
| [Detailed designs](docs/detailed-designs/README.md) | One design per feature, with C4, class and sequence diagrams                            |
| [Mocks](docs/mocks/README.md)                       | Static HTML mocks of every page, dialog and notification, in every state                |
| [Design system](docs/design-system/README.md)       | Tokens, foundations, components and patterns                                            |
| [User journeys](docs/journey.md)                    | Planned journeys in value order, with effort                                            |
| [Implementation prompts](docs/prompts/)             | The scaffold prompt, then one prompt per journey                                        |
| [Demo videos](docs/demos/)                          | A narrated walkthrough of each journey                                                  |
| [Agent instructions](AGENTS.md)                     | Architecture rules and the delivery workflow                                            |

## Contributing

Contributions are welcome. Every change to behaviour starts with a requirement, a detailed design and a mock,
and is built in small slices with acceptance tests written first. Read [CONTRIBUTING.md](CONTRIBUTING.md)
before you open a pull request.

This project follows the [Code of Conduct](CODE_OF_CONDUCT.md).

## Security

Please don't report security issues in public issues. See [SECURITY.md](SECURITY.md).

## Support

See [SUPPORT.md](SUPPORT.md) for how to get help and where to report a problem with an event listing.

## License

No license has been published yet. Until a `LICENSE` file is added, all rights are reserved.
