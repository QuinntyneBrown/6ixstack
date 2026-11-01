# 0012 Event administration over the API with personal bearer tokens

- Status: accepted

## Context

ADR 0011 lets maintainers and their agents change production events through the CLI, but every session needs
the Azure SQL connection string and a temporary firewall rule. `L1-026` and `L2-115` to `L2-124` ask for the same
operations over HTTPS, with the web app's rules, audited, guarded and abuse-limited, and with neither the
connection string nor the firewall. The API already authenticates people with a session cookie (ADR 0009) that
the anti-forgery check of `L2-083` protects. The detailed design is
`docs/detailed-designs/platform/event-admin-api/`.

## Decision

- **Personal API tokens, sent as `Authorization: Bearer`.** A cookie session needs a browser sign-in by email
  link and an anti-forgery token on every write, both awkward for an agent, and a cookie is sent automatically
  by browsers, which is what CSRF exploits. A bearer header is never attached by a browser on its own, so the
  admin API skips the anti-forgery check for token principals only. Tokens are not JWTs: a random reference
  token can be revoked at once by a row update and leaks no claims; a signed self-contained token would need a
  key, an expiry check and a deny list for revocation.
- **Format `sxk_<id>_<secret>`.** `<id>` is the row's `Guid` in 32 hex digits, so lookup is a primary-key read;
  `<secret>` is 32 bytes from `RandomNumberGenerator` in Base64Url (256 bits). The `sxk_` prefix makes a leaked
  token recognisable to secret scanners and in logs.
- **Hashing: SHA-256 over a 16-byte random salt and the secret,** compared in fixed time. The database holds
  only the salt and the hash; the plaintext is shown once. A slow password hash (PBKDF2, bcrypt, Argon2) defends
  low-entropy secrets against guessing; a 256-bit random secret cannot be guessed, and a slow hash would add tens
  of milliseconds to every API request. The salt keeps equal secrets from producing equal hashes, as
  `L2-120` asks, and costs nothing.
- **Tokens expire** after 1 to 365 days (default 90), can be revoked, and are deleted with their owner's account.
  The owner's role is read on every request, so demoting a moderator turns their tokens into 403s at once.
- **Separate scheme and policy.** The `ApiToken` scheme is not the default. The `AdminApi` policy names it as
  its only scheme and requires the `Moderator` role, so a session cookie cannot reach the admin API and a token
  cannot reach any other endpoint. The fallback policy and the organizer and moderator policies are unchanged.
- **Issuance is CLI-only.** `sixstack tokens create|list|revoke` runs as the named moderator actor of ADR 0011,
  through Application handlers, guarded and audited. A web page would need a mock, a design-system entry and a
  screen-composition entry for a tool a handful of maintainers use; the CLI already has a moderator identity and
  a write guard. Issuing a token needs the firewall once; every later call does not.
- **Same handlers.** `AdminEventsController` sends `ListAdminEventsQuery`, `GetAdminEventQuery`,
  `AddAdminEventCommand`, `UpdateAdminEventCommand` and `DeleteAdminEventCommand`. `HttpCurrentUser` reports the
  token owner from the principal's claims, and `ApiAuditLog` decorates `AuditLog` to append "via API", as
  `CliAuditLog` appends "via CLI".
- **Concurrency through `If-Match` and `ETag`.** The version is an HTTP validator, so it belongs in the standard
  headers rather than in the body; an applied `PATCH` or `DELETE` without `If-Match` is 428, so an agent cannot
  overwrite blindly. A stale version is 409 with `reason: changed`, not 412, so the admin API reports a conflict
  the way the edit page, the moderation endpoints and the CLI do.
- **Preview through `?dryRun=true`,** which runs the handler with `Apply = false`, as the CLI's `--dry-run` does.
- **Abuse limits:** a chained global limiter for `/api/admin` paths, 60 requests a minute per token and 120 per
  IP address, in memory; bodies over 64 KB are 413.

## Consequences

- One new table (`ApiTokens`) and migration; the deploy workflow's `sixstack migrate` applies it.
- Agents need only the token and the site's URL. The firewall procedure in `infra/README.md` is needed only to
  issue or revoke a token.
- Requests from the admin API write `LastUsedAtUtc` on each call; at 60 a minute per token the cost is small.
- The limiter is per instance; App Service runs one. Scaling out would need a shared limiter.
- Deferred: a web page for tokens; a `--api` transport for the CLI's `events` commands; admin endpoints for
  communities, speakers, venues or users; bulk import; undoing a delete; revoking another moderator's token.
