## Project overview

6ixstack is an event calendar for events in Toronto and the Greater Toronto Area (GTA), as well as online events. The .NET backend owns event data, persistence, and authentication; the Angular frontend provides the app, and Playwright covers behavior and visual parity with the design reference.

## Folder structure - mandatory

```text
SixStack.sln
README.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md, SUPPORT.md
src/
  SixStack.Domain/            entities and enums; no dependencies
  SixStack.Application/       MediatR handlers, validators, DTOs, IAppDbContext
  SixStack.Infrastructure/    AppDbContext, migrations, external clients, auth, seeder
  SixStack.Api/               controllers, Program.cs, DI, middleware, Swagger
  SixStack.Cli/               migrate, seed, and reset commands
tests/
  SixStack.<Layer>.Tests/     one test project per src project, same name + .Tests
frontend/                     Angular workspace (package.json, angular.json, lint/format config)
  projects/
    sixstack/                 the app; pages under src/app/, dialogs under src/app/dialogs/
    api/                      API service contracts, injection tokens, implementations
    components/               sx-* component library; tokens in src/lib/tokens/, stories/ for Storybook
    perf-test/                perf scenarios in src/scenarios/
  e2e/                        Playwright: tests/, pages/ (one page object per screen), visual baselines
docs/
  assets/                     repository assets, such as the logo the README shows
  specs/                      L1 and L2 requirements
  detailed-designs/           detailed designs, one folder per subsystem
  mocks/                      static HTML mocks (design artifact)
  design-system/              design system extracted from mocks (design artifact)
  journey.md                  planned user journeys, in value order
  prompts/                    ordered implementation prompts: 00 scaffold, then one per journey in journey.md
.claude/skills/, .agents/skills/  agent skills; keep both copies in sync
.github/                      CI workflows and copilot-instructions.md
```

New code goes in the folder that owns it; don't add top-level folders or new projects without updating this tree.

## Backend architecture

Layer dependency direction (strict):

- `SixStack.Domain` — entities + enums, zero deps
- `SixStack.Application` — MediatR handlers, validators, DTO contracts, `IAppDbContext`
- `SixStack.Infrastructure` — `AppDbContext`, EF migrations, SQL Server, external clients, auth services, seeder
- `SixStack.Api` — controllers, `Program.cs`, DI composition, Swagger, middleware
- `SixStack.Cli` — database migration, seeding, and reset commands

Non-obvious rules:

- Business rules live in handlers/domain services, not controllers.
- The API does **not** apply EF migrations on startup. Run the CLI `migrate` command explicitly.
- Seed data is idempotent and safe to re-run.
- Preserve Swagger middleware ordering when changing API auth.
- Keep request logging outside the exception-handling middleware so handled response statuses are logged correctly.

### Tests

Tests never need a database server: API and Infrastructure tests run on a per-fixture in-memory SQLite database, and Application and CLI tests on EF Core InMemory. Tests of SQL Server-only behaviour use `[SqlServerFact]` with `[Trait("Category", "SqlServer")]` and are skipped unless `SIXSTACK_TEST_SQLSERVER` is set. API tests run sequentially. Follow the existing test-project patterns when adding coverage.

Playwright runs against the API backed by a seeded SQLite database (no LocalDB).

## Frontend architecture

Angular workspace in `frontend/` with projects `sixstack` (the app), `api`, `components` (the component library, documented in Storybook), and `perf-test`.

### Conventions enforced across the codebase

- Prettier (`frontend/.prettierrc`) owns formatting and angular-eslint (`frontend/eslint.config.js`) owns lint; CI fails on either. Run `npm run lint` and `npm run format:check` in `frontend/`. The husky pre-commit hook fixes staged frontend files.
- Component selectors use `sx-*`; TypeScript class, file, and folder names omit the `Sx` prefix.
- Components should preserve the mock design's BEM classes and accessible state semantics; e2e locators depend on that parity.
- Keep component styles encapsulated and global styles limited to shared foundations and utilities.
- **Design tokens follow Fluent UI v9.** The TypeScript theme in `frontend/projects/components/src/lib/tokens/` is the source; `styles/_tokens.scss` and `tokens/tokens.ts` are generated — run `npm run tokens` in `frontend/` after changing it (CI runs `tokens:check`). Read tokens by role (`var(--colorBrandForeground1)` for text, `--colorBrandBackground` for fills, `--colorBrandStroke1` for borders), never hex values; component-scoped knobs keep the `--sx-` prefix.
- **Declare each `ng-content` slot once.** A component that renders `<a>` or `<button>` by condition puts its slots in one `<ng-template>` and renders it with `ngTemplateOutlet` in both branches; slots repeated per `@if` branch project into one branch only. On the consumer side, a `@if` wrapping several `[slot=…]` nodes loses the slot (NG8011) — one `@if` per node.
- API services have a contract and injection token; app pages depend on the token, not the concrete implementation.
- **No inline forms in pages**. Button-triggered editing always opens a CDK Dialog (`frontend/projects/sixstack/src/app/dialogs/`) or navigates to a screen.
- Use Angular CDK Dialog/Overlay for modal behavior; don't hand-roll modals.
- Every component has a story folder `frontend/projects/components/stories/src/<Name>/`: `index.stories.ts` (meta + re-exports; the only file Storybook globs), one `<Name><Story>.stories.ts` per example (`Default` first), and `<Name>Description.md` + `<Name>BestPractices.md`, laid out like the Fluent UI v9 docsite. Run `npm run build-storybook` from `frontend/` after changing a component's API; CI builds it on every PR.
- New components also get a perf-test scenario in `frontend/projects/perf-test/src/scenarios/`, modelled on Fluent UI's `apps/perf-test`; see that project's README for running it.

## E2E architecture (Playwright)

- Run the relevant Playwright tests for UI changes, including visual regression; update baselines only for intentional design changes.

## Incremental Implementation and ATDD - mandatory

Mocks and the design system are design artifacts. ATDD does not apply to their
development. Do not write tests for mocks or the design system.

Every new feature or change to production behavior MUST have a requirement, a
detailed design, and a mock before implementation begins. This includes
behavioral changes to existing features, such as changing how a page behaves.
This requirement applies to production-code changes only; documentation-only,
design-system-only, mock-only, and test-only changes are out of scope unless
they are part of implementing a production behavior change.

Every production behavior implementation MUST invoke and follow the
`implementing-incrementally` skill (`.claude/skills/implementing-incrementally`
and `.agents/skills/implementing-incrementally`) before any code is written,
combined with acceptance test-driven development (ATDD). Plan small,
reviewable slices, then complete one slice at a time: write Given-When-Then
acceptance criteria, write the acceptance test, and run it to prove it fails for
the expected reason BEFORE writing production code. Implement only what satisfies
that slice, refactor with tests green, and run the relevant regression checks.
Do not move to the next slice until those checks pass. No bulk implementation,
no tests added afterward, and no weakening tests to manufacture a pass. Keep
the requirement, detailed design, mock, criteria, tests, and implementation
aligned until the entire feature or behavior change is complete.

Back end: integration tests against the API. Front end: Playwright, using the
Page Object Model - one page object per screen, owning the selectors and the
interactions. Tests state intent; page objects know the DOM. Never put a
selector in a test.

Run frontend tests in Chromium only. Do not configure or run Firefox, WebKit,
or any other browser for frontend testing.

### Never write architecture tests

Never add a test that asserts the shape of the codebase rather than its behavior:
no structure, layout, or naming tests; no banned-API scans; no traceability tests
that parse the specifications. Those constraints belong to the compiler, the
formatter, and review. A test suite exists to prove behavior.
