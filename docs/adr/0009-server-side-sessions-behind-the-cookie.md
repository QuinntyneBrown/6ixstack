# 0009 Server-side sessions behind the data-protected cookie

- Status: accepted (journey 05); refines 0002

## Context

`L2-048` needs sessions that expire 14 days after the last activity, apply to one device and can be revoked.
The scaffold's ASP.NET Core cookie scheme (ADR 0002) already issues a `Secure`, `HttpOnly`, `SameSite=Lax`
cookie whose contents are encrypted and signed by data protection, but it holds no server-side record, so a
cookie cannot be revoked. The design names a custom `SessionAuthenticationHandler` with a hashed cookie secret.

## Decision

- Keep the cookie scheme. Every sign-in (the magic link, and the test seam) creates a `Session` row
  (`Id`, `UserId`, `CreatedAtUtc`, `LastSeenAtUtc`, `RevokedAtUtc`) and puts its id in a `sid` claim.
- `CookieAuthenticationEvents.OnValidatePrincipal` (`SessionValidator`) loads the session on each request and
  rejects the principal when the row is missing, revoked, or last seen more than 14 days ago; the request is
  then anonymous. It advances `LastSeenAtUtc` at most once every 5 minutes.
- The cookie's own sliding expiry stays at 14 days; the server-side check is the authority.
- No absolute maximum lifetime is set; it can be added to `SessionValidator` later.

The cookie never carries a plaintext secret that could be looked up in the database: the session id is only
readable after data-protection decryption, so a leaked database does not yield usable cookies. This meets the
intent of the design's hashed secret with less code.

## Consequences

- Sign out (journey 27) revokes by setting `RevokedAtUtc`; nothing else changes.
- The test seam keeps its contract and now creates a real session, so tests exercise the same validation.
- Until journey 15 (dashboard) and journey 06 (review queue), `/organize` and `/admin/review` are guarded
  routes showing only their page title and lead from the mocks, so a redeemed link has somewhere to land.
