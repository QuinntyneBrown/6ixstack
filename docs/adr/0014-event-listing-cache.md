# 0014 Event listings are cached in API memory, evicted on save, and in the browser

- Status: accepted

## Context

`L2-087` budgets the public list endpoints at 300 ms p95 under 50 requests a second, and every visit to `/`, the
map and the calendar queried SQL Server through MediatR. Only the feeds and the About stats sent `Cache-Control`.
The listings change only when an event, its community, venue or speakers change, or when the Toronto day rolls
over. Production runs one App Service instance (ADR 0010, `infra/`). The CLI (ADR 0011) writes the same database
from another process, which cannot reach the API's memory.

## Decision

- **Where.** An MVC resource filter, `EventListingCacheAttribute`, on the four listing actions of
  `EventsController`. It runs before model binding, so a hit never reaches the handler or the database. It buffers
  the body of a miss, hashes it for the `ETag` (as the feeds do) and stores 200 and 204 responses. Errors
  propagate untouched to `ExceptionHandlingMiddleware` and are never stored. ASP.NET Core output caching was
  rejected because it refuses authenticated requests and responses that set cookies by default, does not compute
  an `ETag`, and its expiry runs on the system clock, which tests cannot move. A MediatR caching behaviour was
  rejected because the `ETag` belongs to the HTTP body and would be computed twice.
- **Store.** `IEventListingCache` (Application) with `MemoryEventListingCache` (Infrastructure, singleton): a
  dictionary capped at 1,000 entries, since search text makes keys unbounded. Each entry expires at
  `min(stored + EventListingCache:Lifetime, next Toronto midnight)`, measured with `IClock`. The default lifetime is
  5 minutes.
- **Eviction.** `ListingChangeInterceptor`, an EF Core `SaveChangesInterceptor` on `AppDbContext`. It notes before
  a save whether any `Event`, `Community`, `Venue`, `Speaker` or `EventSpeaker` is added, modified or deleted, and
  evicts every entry after the save succeeds. Every write path in the API process (moderation, organizer, admin
  API, background jobs, and any future handler) goes through `SaveChanges`, so none needs its own call. A
  generation counter stops a request that started before an eviction from storing its now-stale result. The
  outbox was rejected for eviction because it is polled, so changes would show seconds late.
- **CLI writes.** They are bounded by the absolute lifetime: they show within 5 minutes. A database version
  stamp checked on every request would make them immediate, but it adds a query to every hit for a path used by a
  maintainer a few times a month.
- **Browser.** `Cache-Control: public, max-age=10, stale-while-revalidate=60` on 200, 204 and 304. A 10-second
  reuse window keeps a moderator's own change visible almost at once while absorbing bursts. The web app keeps the
  last 20 listing responses in `HttpEventsApi` for the visit, shows a saved one at once and refreshes it in the
  background, keeping it if the refresh fails.

## Consequences

- If the API scales out, each instance holds its own entries and evicts only on its own saves. A change made on
  one instance shows on the others within the lifetime. A shared cache (Redis) with tag eviction can then replace
  `MemoryEventListingCache` behind the same interface; it is not built.
- A write through raw SQL or `ExecuteUpdate` bypasses the interceptor and shows within the lifetime. No production
  path does this today, and API tests use it to prove hits.
- Listings must stay free of user-specific data. A listing that ever depends on the viewer must leave the cache or
  add the user to the key.
