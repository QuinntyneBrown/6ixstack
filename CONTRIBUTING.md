# Contributing to 6ixstack

Thanks for helping make 6ixstack better. This guide explains how to propose a change and what a pull request
needs before it can be merged.

By taking part, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Ways to contribute

- **Report a bug.** Open an [issue](https://github.com/QuinntyneBrown/6ixstack/issues) with the steps to
  reproduce it, what you expected, what happened, and the reference code if the app showed one.
- **Suggest a feature.** Open an issue describing who it helps and what they can do with it.
- **Fix a listing.** Wrong event details are not code issues. Use **Report a problem** on the event's page.
- **Send a pull request.** For anything beyond a small fix, open an issue first so we can agree on the
  approach.

## Development setup

Follow [Getting started](README.md#getting-started) in the README. Read [AGENTS.md](AGENTS.md) before you
write code; its rules are binding for people and coding agents alike.

## How a change is delivered

Every change to production behaviour follows the same path:

1. **Requirement.** Add or update L2 requirements with Given-When-Then acceptance criteria in
   [docs/specs/L2.md](docs/specs/L2.md).
2. **Detailed design.** Add or update the feature's folder in
   [docs/detailed-designs/](docs/detailed-designs/README.md).
3. **Mock.** Add or update every affected state in [docs/mocks/](docs/mocks/README.md), and the
   [design system](docs/design-system/README.md) if a component changes.
4. **Build in slices, tests first.** For each small slice, write the acceptance test, run it and see it fail
   for the expected reason, then write only the code that makes it pass. Refactor while green and run the
   regression checks before the next slice.

Documentation-only, mock-only, design-system-only and test-only changes skip this path.

The prompts in [docs/prompts/](docs/prompts/) describe this workflow end to end for each planned journey.

## Tests

- **Backend:** integration tests against the API, on in-memory SQLite. No database server.
- **Frontend:** Playwright, Chromium only, using the Page Object Model. One page object per screen owns the
  selectors and interactions; tests state intent and never contain a selector.
- Never write tests that check the shape of the code (structure, naming, banned APIs). Tests prove behaviour.
- Never weaken a test to make it pass. Update visual baselines only for intentional design changes.

## Code style

- **Frontend:** Prettier formats and angular-eslint lints. The pre-commit hook fixes staged files, and CI fails
  on either.
- **Components:** `sx-*` selectors, BEM classes from the mocks, design tokens read by role (never hex values).
  A new component gets a Storybook story folder and a perf-test scenario.
- **Backend:** keep the layer direction Domain → Application → Infrastructure → Api. Business rules live in
  handlers and the domain, not controllers.
- Match the style of the code around your change.

## Pull requests

1. Branch from `main`, for example `journey/04-submit-event` or `fix/feed-time-zone`.
2. Commit in small steps using [Conventional Commits](https://www.conventionalcommits.org/), for example
   `feat(submissions): validate ticket links`.
3. Before you push, run:

   ```bash
   dotnet test
   cd frontend
   npm run lint && npm run format:check && npm run tokens:check
   npm run build-storybook
   npm run e2e
   ```

4. Rebase on `main` and open a pull request. Describe what users can now do, the requirements covered, the
   tests added, and anything deferred. Link a demo video for user-facing journeys.
5. CI must be green before merge. Pull requests are squash-merged.

## Questions

See [SUPPORT.md](SUPPORT.md).
