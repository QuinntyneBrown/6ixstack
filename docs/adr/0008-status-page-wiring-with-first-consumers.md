# 0008 Forbidden and server-error wiring arrive with their first consumers

- Status: accepted (journey 00)

## Context

The scaffold prompt lists the forbidden (403) and server-error (500) pages and the inline failure pattern
(`L2-076`, `L2-077`). Both depend on a page-level data load: the server-error page shows when a route's primary
data fails with 500 before any content exists, and the forbidden page when an API call returns 403. The scaffold
has no page that loads data, so that behaviour could not be acceptance-tested here, and `AGENTS.md` forbids
code without a failing test first.

## Decision

The scaffold delivers what can be proven now:

- `StatusPage` (`sx-status-page`), used by the not-found page and documented with a 500 story.
- `Alert` (`sx-alert`), the inline failure surface.
- `apiErrorInterceptor`, which maps every failure to `ApiError` with only the status, field errors, the
  `referenceCode` and the forbidden extensions (`ownerName`, `resourceTitle`), and reports network failures.
- The API's problem details: 500 with a logged reference code, 403 with extensions, 400 with field errors.

The rest lands with its first consumer, test first:

- Journey 01 (browse events): `LoadState<T>`, the inline "We couldn't load events" failure with Try again
  (`L2-008`, `L2-077`), `StatusPageNavigator.serverError()` and `ServerErrorPage` showing "Ref 7F3A-21C9".
- Journey 06 (review submissions) and 14 (edit event): `StatusPageNavigator.forbidden()` and `ForbiddenPage`.
- Journeys 19 and 24: the not-found page for a missing community or speaker.
