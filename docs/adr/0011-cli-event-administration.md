# 0011 Event administration from the CLI

- Status: accepted

## Context

Maintainers, and coding agents working for them, need to list, read, add, update and delete events in the
production Azure SQL database (`L1-025`, `L2-105` to `L2-114`), and in local SQL Server or SQLite databases for
trying it safely. `SixStack.Cli` already runs `migrate`, `seed` and `reset` against `ConnectionStrings__Default`,
and the deploy workflow reaches production through a temporary SQL firewall rule. Writes must follow the web app's
rules, be audited (`L2-086`), be guarded and keep contact details private (`L2-099`). The detailed design is
`docs/detailed-designs/platform/event-admin-cli/`.

## Decision

- **Extend `SixStack.Cli`** with an `events` command group; no new project. `migrate`, `seed` and `reset` keep
  their code path and output.
- **Hand-rolled argument parsing** (`CliArguments`), as `CliApp` already does. Five commands with a fixed option
  set do not justify a new package dependency such as `System.CommandLine`, and a small parser keeps the exit codes
  and `--json` error shape under the CLI's own control.
- **Handlers in `SixStack.Application/EventAdmin/`.** Updates send the existing `UpdateOrganizerEventCommand` as a
  moderator, so validation, `Event.Edit`, time-change alerts, `SEQUENCE`, the owner's email and the `EventEdited`
  audit entry are the app's own. Adds reuse `EventDetailsValidator<T>`, `IEventDetailsInput.ToDetails()` and the
  slug rule (extracted to `EventSlugs`). `CliApp` and `EventsCommand` hold no business rule.
- **The actor is a moderator account.** `--actor <email>` or `SIXSTACK_ACTOR` must name an existing user with the
  `Moderator` role. The CLI's `ICurrentUser` reports that user, so `EventAccess` and `AuditLog` work unchanged and
  `AuditEntry.ActorId` is a real user id with no schema change. A free-text actor would need a new audit column
  and could not be checked.
- **CLI audit entries are marked** by decorating `IAuditLog` in the CLI composition root, which appends
  "via CLI" to the details. Application handlers do not know about the CLI.
- **`events add` publishes immediately.** The actor is a moderator, so adding is the approval: `ApprovedAtUtc`
  and `PublishedAtUtc` are now and the entry is `EventAdded`. The event has no submitter email, so no
  confirmation or verification email goes out. Sending it to the review queue instead would leave it held as
  unverified after approval (`L2-085`), because nobody verified an address for it.
- **Soft delete.** `events delete` sets `EventStatus.Deleted` through `Event.Delete()`. Public queries already
  show only `Published`, and organizer queries exclude `Deleted`, so no query changes. Rows, audit entries and
  moderation history stay; there is no strong reason to remove rows, and soft delete keeps a mistake recoverable
  by hand.
- **Write guard.** Every write previews first (the handler with `Apply = false`). `--dry-run` stops there;
  `--yes` applies; an interactive terminal is asked "Apply? [y/N]"; anything else writes nothing and exits 6.
  The apply passes the previewed `Version` as `--if-version`, so a change in between is a conflict.
- **Exit codes** 0 success, 1 usage, 2 validation, 3 not found, 4 conflict, 5 actor, 6 not confirmed,
  10 unexpected; `--json` prints one document (`event`, `events`, `result` or `error`).
- **No secrets in output.** The CLI never prints configuration or a driver exception's message; an unexpected
  error prints only the exception type. `submitterEmail` appears only with `events get --show-contact`.

## Consequences

- The production procedure (firewall rule, connection string, commands, close the rule) is documented in
  `infra/README.md`; nothing in the deploy workflow or infrastructure changes.
- Only someone with a moderator account in the target database can write. A fresh local database needs `seed`
  (which creates `jordan@6ixstack.dev`) before writes work.
- Emails the edit path queues are sent by the API's outbox processor, which shares the database.
- Entra ID sign-in (`Authentication=Active Directory Default`) needs an Entra administrator on `sixstack-sql`,
  which `infra/main.bicep` does not configure yet; until then operators use the SQL administrator login.
- Deferred: communities, speakers, venues, users and moderation decisions from the CLI; bulk import and export;
  undoing a delete; a guard on `reset` against production.
