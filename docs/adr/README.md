# Architecture decision records

Short records of choices the requirements and designs left open. One file per decision, numbered in order.

| ADR | Decision |
|-----|----------|
| [0001](0001-sqlite-for-tests-and-demos.md) | SQLite runs Playwright and demos; SQL Server stays the product database |
| [0002](0002-cookie-session-placeholder-and-test-sign-in.md) | Cookie session and a test-only sign-in seam until journey 05 |
| [0003](0003-fluent-token-roles.md) | How the mock palette maps onto Fluent UI v9 token roles |
| [0004](0004-header-navigation-breakpoint.md) | Header navigation appears at 992 px, as `L2-096` states |
| [0005](0005-self-hosted-geist.md) | Geist and Geist Mono are self-hosted |
| [0006](0006-security-headers-and-csrf.md) | Security headers, HSTS and CSRF with ASP.NET Core Antiforgery |
| [0007](0007-toasts-and-banners.md) | Toast and banner choices, and what waits for the offline cache |
| [0008](0008-status-page-wiring-with-first-consumers.md) | Forbidden and server-error wiring arrive with their first consumers |
| [0009](0009-server-side-sessions-behind-the-cookie.md) | Server-side sessions behind the data-protected cookie |
| [0010](0010-azure-app-service-single-origin-hosting.md) | Azure App Service hosts the API and the web app on one origin |
| [0011](0011-cli-event-administration.md) | The CLI manages events through Application handlers, as a named moderator, with guarded writes and soft delete |
| [0012](0012-event-administration-api.md) | Events are administered over the API with personal bearer tokens issued from the CLI, stored salted and hashed, with `If-Match` concurrency |
| [0013](0013-venue-coordinates-from-a-background-geocoding-job.md) | Venue coordinates come from a background geocoding job, with OpenStreetMap Nominatim in production |
