# End-to-end tests

Playwright in Chromium only, with the Page Object Model.

- `pages/` holds one page object per screen. Page objects own every selector and interaction.
- `tests/` holds the acceptance tests. Tests state intent through page objects and never contain a selector.
- `visual-baselines/` holds the screenshot baselines. Update them only for intentional design changes:
  `npm run e2e:update`.
- `support/global-setup.ts` builds the solution, resets `e2e/.data/e2e.db` with the CLI and starts the API
  on it (port 5100) with the clock fixed at Monday, November 2, 2026 and the test sign-in seam on.
  Playwright starts `ng serve` (port 4200), which proxies `/api` and `/health` to the API.
- `demo/` holds the demo-video tooling (see `demo/README.md`).

```bash
cd frontend
npm run e2e                       # whole suite
npx playwright test app-shell     # one file
E2E_API_LOGS=1 npm run e2e        # show API output
```
