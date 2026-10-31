# 0001 SQLite for tests and demos

- Status: accepted (journey 00)

## Context

`AGENTS.md` requires that no test needs a database server and that Playwright runs against a seeded SQLite
database. The EF Core migrations target SQL Server, and SQLite cannot compare `DateTimeOffset` values.

## Decision

- `Database:Provider` selects `SqlServer` (default) or `Sqlite`; `ConnectionStrings:Default` is the
  connection string for either.
- On SQLite, the CLI `migrate` command builds the schema from the model (`EnsureCreated`) instead of applying
  the SQL Server migrations. `reset` drops, recreates and seeds.
- `AppDbContext` stores `DateTimeOffset` as sortable binary on SQLite only.
- `Clock:FixedUtcNow` fixes "today" (Monday, November 2, 2026 in tests, Playwright and demos).

## Consequences

SQL Server-only behaviour is covered by `[SqlServerFact]` tests that run when `SIXSTACK_TEST_SQLSERVER` is set.
The README's SQL Server setup stays the production path; SQLite is for tests, Playwright and local demos.
