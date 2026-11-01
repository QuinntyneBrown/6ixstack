# 6ixstack detailed designs

Each folder below holds one vertically sliced feature: a `README.md` with the
detailed design and a `diagrams/` folder with PlantUML sources and the rendered
PNG images the README shows. Every design traces to L2 requirements in
`docs/specs/L2.md`, which refine the L1 requirements in `docs/specs/L1.md`.

## System architecture

6ixstack is a calendar of developer events in Toronto and the Greater Toronto Area
(GTA), plus online events. The system consists of these containers:

| Container | Technology | Responsibility |
|-----------|------------|----------------|
| 6ixstack web app (`sixstack`) | Angular single-page application, service worker | Pages, dialogs and notifications from `docs/mocks/`; built from the `components` library; calls the API through typed clients in the `api` project |
| 6ixstack API (`SixStack.Api`) | ASP.NET Core | Controllers, authentication, authorization policies, rate limiting, problem details, background job host |
| Application layer (`SixStack.Application`) | .NET class library, MediatR, FluentValidation | Command and query handlers, validators, DTO contracts, `IAppDbContext` |
| Domain (`SixStack.Domain`) | .NET class library | Entities and enums with no dependencies |
| Infrastructure (`SixStack.Infrastructure`) | .NET class library, EF Core | `AppDbContext`, migrations, email sender, geocoder, link checker, outbox processor, clock |
| 6ixstack database | SQL Server | Events, communities, speakers, accounts, tokens, reports, notifications, audit entries, outbox |
| 6ixstack CLI (`SixStack.Cli`) | .NET console | Migrate, seed and reset the database; list, read, add, update and soft-delete events (`platform/event-admin-cli`) |

External systems: an email delivery provider `<TO SUPPLY>`, a geocoding service
`<TO SUPPLY>`, a map basemap provider `<TO SUPPLY>`, and the calendar
applications (Google Calendar, Outlook, Apple Calendar) that consume feeds.

The API never applies migrations on startup; the CLI `migrate` command does.
Business rules live in handlers and domain entities, never in controllers.

## Subsystems and features

| Subsystem | Features |
|-----------|----------|
| `discovery` | `browse-events`, `featured-event`, `event-map`, `view-event-detail`, `month-calendar` |
| `directory` | `browse-communities`, `view-community`, `browse-speakers`, `view-speaker` |
| `feeds-and-sharing` | `ready-made-feeds`, `build-custom-feed`, `serve-calendar-feed`, `add-to-calendar`, `share-event` |
| `submissions` | `submit-event`, `report-problem` |
| `identity` | `magic-link-sign-in`, `sessions-and-sign-out`, `account-settings`, `delete-account` |
| `organizer` | `organizer-dashboard`, `edit-event`, `cancel-event` |
| `moderation` | `review-queue`, `automated-checks`, `approve-submission`, `reject-submission` |
| `notifications` | `in-app-notifications`, `email-notifications` |
| `site` | `app-shell`, `static-pages`, `contact-form`, `toasts-and-banners`, `status-pages` |
| `platform` | `time-zones`, `security-hardening`, `privacy-and-retention`, `performance-budgets`, `accessibility`, `observability`, `event-admin-cli` |
