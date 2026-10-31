# Scaffold: 6ixstack solution

## Goal

Create the 6ixstack solution exactly as `AGENTS.md` lays it out, so that every journey prompt in `docs/prompts/`
can start straight away. Today the repository holds only `docs/` and agent instructions. After this run it has
a building .NET solution, an Angular workspace, a Playwright harness, CI, demo-video tooling, and the app shell
every journey sits in.

- Detailed designs: `docs/detailed-designs/site/app-shell/`, `docs/detailed-designs/site/toasts-and-banners/`, `docs/detailed-designs/site/status-pages/`,
  `docs/detailed-designs/platform/` (all six), and the system architecture in `docs/detailed-designs/README.md`.
- Requirements: L2-074, L2-075, L2-076, L2-077, L2-083, L2-095, L2-096, L2-097, L2-101, L2-102, L2-103 in
  `docs/specs/L2.md`.
- Mocks: `docs/mocks/dialogs/mobile-nav/`, `docs/mocks/pages/not-found/`, `docs/mocks/pages/forbidden/`,
  `docs/mocks/pages/server-error/`, `docs/mocks/notifications/app-toast/`, `docs/mocks/notifications/site-banner/`.
- Journeys that follow: `docs/journey.md`, prompts `01` to `29` in this folder.

## Finish the whole scaffold in one run. Do not stop. (CRITICAL)

- You are authorised to take this scaffold all the way: the solution scaffold; the app shell, status pages and feedback slices; demo-video tooling; a narrated demo video; a pull request with green checks; and the merge. Go through every phase and every slice in one
  continuous run. Do not pause between phases to report, ask for approval, or wait for "continue".
- Do not end your turn until the "Done means" list at the bottom is fully true. A partial result, a plan, or
  "the next steps would be..." is not done.
- Where `AGENTS.md` says "stop and ask", treat this prompt as the confirmation in advance for everything in
  scope here. Choose the simplest option that fits the existing architecture, record it (an architecture
  decision record or the detailed design's open-questions section), and keep going.
- If the `components` library lacks something, that is not a reason to stop. Update the design system and the
  library first, as the project rules require, then go on.
- When a test, build or command fails, find the root cause and fix it, then go on. Never weaken a test to make
  it pass, and never skip a step quietly.
- Only stop for a real blocker you cannot resolve yourself, such as missing credentials, a download that needs
  a human, or branch protection that needs a human review. If that happens, finish everything else first, then
  report the blocker clearly.
- Keep track of progress (a todo list), so that nothing gets left out after context is summarised.

## Rules (read first, binding)

- Follow `AGENTS.md` exactly, especially:
  - The mandatory folder structure. Don't add top-level folders or projects without updating its tree.
  - Strict backend layering: Domain, Application, Infrastructure, Api, Cli. Business rules in handlers and
    domain, never controllers. The API never migrates on startup.
  - Backend acceptance tests are API integration tests on per-fixture in-memory SQLite. No database server.
  - Frontend acceptance tests are Playwright with the Page Object Model: one page object per screen in
    `frontend/e2e/pages/`, tests in `frontend/e2e/tests/`, never a selector in a test. Chromium only.
  - The `components` library (`sx-*` selectors, Fluent UI v9 tokens read by role, BEM classes from the
    mocks). A new component gets its Storybook story folder and a perf-test scenario.
  - Pages depend on API injection tokens, not concrete services. Editing opens a CDK Dialog or a screen,
    never an inline form.
  - Prettier and angular-eslint must pass (`npm run lint`, `npm run format:check` in `frontend/`).
  - Never write architecture tests. Never weaken a test.
- Invoke and follow `implementing-incrementally` before any code, with ATDD for every slice.
- If something seems to need more scope, leave it out, note it as deferred, and continue.
- If this scaffold needs behaviour from a journey later in `docs/journey.md`, depend on an interface or seam
  and leave that behaviour to its own journey. Do not build it here.
- Work through the phases below **in order**, using the skill each phase names.
- Copy the house style of each folder. Read the existing neighbours before you write anything new.

## Start

- `git checkout main && git pull`, then `git checkout -b journey/00-scaffold`.

## Phase 1: Solution skeleton (no production behaviour yet)

- `SixStack.sln` with the five `src/` projects and one `tests/SixStack.<Layer>.Tests` project each, on the
  current .NET LTS. Reference direction exactly as `AGENTS.md` states.
- Infrastructure: `AppDbContext` on SQL Server, SQLite for tests and Playwright, an initial migration, an
  idempotent seeder using the cast in `docs/mocks/README.md` (Priya the organizer, a moderator, the
  communities, speakers and events the mocks show), an `IEmailSender` with a dev mailbox sink, an outbox, and a
  clock abstraction.
- Cli: `migrate`, `seed`, `reset`.
- Api: `Program.cs`, Swagger, authentication and the organizer and moderator policies (no sign-in flow yet;
  journey 05 adds it), and a test-only sign-in seam that integration tests and Playwright use to act as a role.
  Request logging outside the exception middleware, Swagger ordering preserved.
- Test fixtures: per-fixture in-memory SQLite for Api and Infrastructure, EF InMemory for Application and Cli,
  `[SqlServerFact]` with `SIXSTACK_TEST_SQLSERVER`. API tests run sequentially.
- `frontend/`: Angular workspace with `sixstack`, `api`, `components`, `perf-test`; Prettier,
  angular-eslint, husky pre-commit; the Fluent UI v9 token theme in `components/src/lib/tokens/` with
  `npm run tokens` and `tokens:check`; Storybook with the story folder layout `AGENTS.md` requires; the
  perf-test project modelled on Fluent UI's `apps/perf-test` with its README.
- `frontend/e2e/`: Playwright, Chromium only, page objects in `pages/`, tests in `tests/`, visual baselines,
  and a global setup that starts the API on a seeded SQLite database.
- `.github/workflows/`: on every PR run `dotnet build`, `dotnet test`, lint, format check, `tokens:check`,
  `build-storybook`, and Playwright in Chromium.
- Git LFS for `*.mp4` (`.gitattributes`).
- Add `docs/demos/` to the `AGENTS.md` folder tree.
- Make the root `README.md` true: its prerequisites, commands, npm script names (`start`, `e2e`, `perf-test`,
  `demo`, ...), the `ci.yml` workflow its badge points at, and the `ConnectionStrings__Default` setting. Change
  the README only where a better choice is recorded in an ADR. Commit.

## Phase 2: Docs alignment

- `docs/screen-composition.md` (`writing-screen-composition`), which also adds the components-library section
  to `AGENTS.md`.
- `docs/estimates/` (`estimating-designs`), every design at 0% to start.

## Phase 3: Incremental implementation (ATDD)

- Plan thin vertical slices, for example:
  1. App shell: header, footer, navigation, skip link (L2-095, L2-091).
  2. Mobile menu as a CDK Dialog (L2-096).
  3. Light and dark themes (L2-097).
  4. Status pages: not found 404, forbidden 403, server error 500 with reference code (L2-076, L2-102).
  5. Problem details, structured logging with correlation IDs, health endpoint (L2-101, L2-102, L2-103).
  6. Security headers and cookie settings (L2-083).
  7. Toasts and site banners, as shared services and components (L2-074, L2-075).
  8. Inline failure handling pattern (L2-077).
- For each slice:
  - Write the Given-When-Then criteria from the requirement.
  - Write the acceptance test (API integration test or Playwright with a page object), traced to the
    requirement.
  - Run it and show it fails for the expected reason.
  - Implement the minimum that makes it pass, and refactor while green.
  - Run the regression checks, then commit.

## Phase 4: Demo-video tooling (`recording-demo-videos`)

Build reusable tooling under `frontend/e2e/demo/` that every journey prompt uses:

- A Playwright runner that executes `journeys/<nn>-<slug>.ts`, takes screenshots at named beats, and writes them
  to `docs/demos/<nn>-<slug>/screenshots/`.
- A text-to-speech script using Kokoro-82M (`hexgrad/Kokoro-82M`) from Hugging Face, run locally, default
  voice `af_heart`. Pin the package version and document the setup in a README.
- Background music: find an upbeat, fun soca track on Pixabay Music (pixabay.com/music, search "soca"),
  download it into `frontend/e2e/demo/music/`, and record title, artist, URL and the Pixabay Content License in
  `frontend/e2e/demo/music/CREDITS.md`. If the download needs a human (sign-in or bot check), finish
  everything else and report this as the blocker with the track URL.
- An ffmpeg build script: screenshots with gentle zoom and crossfades, narration per screenshot, music looped,
  faded and ducked under the voice, H.264 + AAC MP4 at 1280 × 720. **No captions by default**; a `--captions`
  flag is the only way to add them.
- A verify script: ffprobe streams and duration, ebur128 loudness, three frames extracted for a look.

## Phase 5: Narrated demo video (`recording-demo-videos`)

Follow the skill, with these overrides:

- Use the demo tooling the scaffold added under `frontend/e2e/demo/`. Do not use edge-tts.
- Run the app and API locally against the seeded SQLite database, as Playwright does.
- Storyboard (adjust to what was built; show only what works):
  1. The events page shell in light theme.
  2. Switch to dark theme.
  3. Open the mobile menu at phone width.
  4. Visit an unknown URL to show the not-found page.
  5. Show a toast and a site banner.
- Drive it with `frontend/e2e/demo/journeys/00-scaffold.ts` in Chromium. Take a screenshot at each beat at
  1280 × 720, light theme. Add a dark-theme or phone-width shot where the mocks differ. Save them as
  `docs/demos/00-scaffold/screenshots/NN-<beat>.png`.
- Write one short narration paragraph per screenshot: second person, warm, plain, no jargon. Open with what
  "the 6ixstack app shell" lets you do, close with a one-line recap. Save it as `docs/demos/00-scaffold/narration.md`.
- Voice: synthesize the narration with Kokoro-82M (`hexgrad/Kokoro-82M` from Hugging Face) run locally, voice
  `af_heart` at normal speed.
- Video: build it from the screenshots. Hold each for its narration plus 0.6 s, with 0.4 s crossfades and a
  slow, gentle zoom. H.264 + AAC MP4 at 1280 × 720.
- Music: the upbeat soca track from Pixabay in `frontend/e2e/demo/music/`. Loop or trim it to length, fade in
  over 1 s and out over 2 s, and duck it under the voice (sidechain compression). Voice around -16 LUFS, music
  well below it, so every word is clear.
- **No captions.** No burned-in subtitles, no on-screen caption overlay, no `.vtt` or `.srt`, no `<track>`.
- Verify: `ffprobe` shows one video and one audio stream and the duration you expect; `ebur128` loudness is in
  range; look at three extracted frames and confirm there is no caption text.
- Save `docs/demos/00-scaffold/demo.mp4` (tracked with Git LFS) and `credits.md` (voice model and its licence;
  music title, artist, Pixabay URL and the Pixabay Content License).

## Phase 6: Pull request

- Run the full regression: `dotnet test`, and in `frontend/`: `npm run lint`, `npm run format:check`,
  `npm run tokens:check`, `npm run build-storybook`, the Playwright suite in Chromium including visual
  regression.
- `git fetch origin && git rebase origin/main`, then push the `journey/00-scaffold` branch.
- `gh pr create --base main --title "chore(solution): scaffold the 6ixstack solution"`. In the body: what the user can now
  do, the requirements covered, the tests added, decisions made, anything deferred, and the path to
  `docs/demos/00-scaffold/demo.mp4` in the branch.
- `gh pr checks --watch`. If a check fails, fix the cause, push, and watch again.

## Phase 7: Merge

- When every check is green, merge: `gh pr merge --squash --delete-branch`. This prompt authorises the merge.
- `git checkout main && git pull`, then build once more to confirm main is green.
- If branch protection needs a human review, report that as the blocker with the PR link.

## Deferred

- Every journey in `docs/journey.md`. Offline saved events (L2-078).

## Done means

- The solution builds, migrates, seeds and runs locally, and every journey prompt can start from `main`.
- The app shell, themes, mobile menu, status pages, toasts and banners work as the requirements state.
- All tests pass, in Chromium only, and CI runs every check on the PR.
- The demo tooling produces a narrated MP4 with the Kokoro voice, soca music and no captions;
  `docs/demos/00-scaffold/demo.mp4` proves it.
- The documentation agrees with the code.
- The pull request is merged to `main` with green checks, and `main` builds.
- Only then end the run, with a short summary of what was built, the decisions made, the PR link, and anything
  deferred.
