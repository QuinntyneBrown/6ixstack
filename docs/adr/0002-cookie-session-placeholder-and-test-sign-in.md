# 0002 Cookie session placeholder and test sign-in seam

- Status: accepted (journey 00); journey 05 replaces the session store

## Context

The scaffold needs authentication and the organizer and moderator policies before the magic-link flow
(journey 05) exists, and integration tests and Playwright need to act as a role.

## Decision

- ASP.NET Core cookie authentication issues the `sixstack.session` cookie with `Secure`, `HttpOnly`,
  `SameSite=Lax`, `Path=/` (`L2-083`). Unauthenticated API calls get 401, forbidden ones 403, never a redirect.
- The fallback policy requires an authenticated user; `Organizer` and `Moderator` policies require the role.
- `POST /api/test/sign-in { email }` signs in a seeded user. The controller is removed from the application
  model unless `Auth:TestSignIn:Enabled` is true, which only tests, Playwright and demos set.

## Consequences

Journey 05 swaps the cookie handler for `SessionAuthenticationHandler` with server-side sessions; the
policies and the seam keep their contract.
