# Journey 02: View event detail

## Goal

A visitor opens an event from the list and sees its time (in ET, with the source time for streams), venue, description, speakers, community, tickets and status. Upcoming, streaming, past and cancelled events each look as the mocks show. Anyone can do this without signing in.

- Detailed design: `docs/detailed-designs/discovery/view-event-detail/`
- Requirements: L2-017, L2-018, L2-019, L2-020, L2-021, L2-022, L2-023, L2-024 in `docs/specs/L2.md`, plus the cross-cutting ones the design cites.
- Mocks: `docs/mocks/pages/event-detail/default.html`, `docs/mocks/pages/event-detail/streaming.html`, `docs/mocks/pages/event-detail/past.html`, `docs/mocks/pages/event-detail/cancelled.html`, `docs/mocks/pages/event-detail/loading.html`, `docs/mocks/pages/event-detail/error.html`, `docs/mocks/notifications/event-alert/`
- Prerequisites: `docs/prompts/00-scaffold.md` and journey 01 are merged to `main`.
- Unchanged: every other screen and API behaviour.

## Finish the whole journey in one run. Do not stop. (CRITICAL)

- You are authorised to take this journey all the way: align the mocks, design system, requirements and design; implementation; a narrated demo video; a pull request with green checks; and the merge. Go through every phase and every slice in one
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
- If this journey needs behaviour from a journey later in `docs/journey.md`, depend on an interface or seam
  and leave that behaviour to its own journey. Do not build it here.
- Work through the phases below **in order**, using the skill each phase names.
- Copy the house style of each folder. Read the existing neighbours before you write anything new.

## Start

- `git checkout main && git pull`, then `git checkout -b journey/02-view-event-detail`.

## Phase 1: Mocks (`writing-html-mocks`)

- The mocks above exist. Check them against the requirements. Add only missing states, light and dark, at
  phone, tablet and desktop widths, and update the manifest, gallery and coverage matrix.

## Phase 2: Design system (`extracting-design-systems`, `writing-screen-composition`)

- Check `docs/design-system/` covers every component these screens use. Add or update only what is missing.
- Update `docs/screen-composition.md` for these screens.

## Phase 3: Requirements (`writing-requirements`)

- L2-017, L2-018, L2-019, L2-020, L2-021, L2-022, L2-023, L2-024 exist. Fix gaps or ambiguity in their acceptance criteria only. New requirements, if any, take the
  next free number after L2-103.

## Phase 4: Detailed design (`writing-design-documents`)

- `docs/detailed-designs/discovery/view-event-detail/` exists. Update it only where the work shows it is wrong or silent, and record decisions in its
  open-questions section or an ADR.

## Phase 5: Estimate (`estimating-designs`)

- Refresh `docs/estimates/` for this design before you start, and again at the end with the true percent
  complete.

## Phase 6: Incremental implementation (ATDD)

- Plan thin vertical slices, for example:
  1. API: event detail query by slug, 404 for unknown or unpublished events (L2-017, L2-024).
  2. Event detail page content (L2-017).
  3. Actions for upcoming events: the buttons render and route; their dialogs come with their own journeys (L2-018).
  4. Streaming event detail (L2-019).
  5. Past event detail (L2-020).
  6. Cancelled event detail (L2-021).
  7. Event status alerts (L2-022).
  8. Docked ticket action on phones (L2-023).
  9. Loading, error and not-found states (L2-024).
- For each slice:
  - Write the Given-When-Then criteria from the requirement.
  - Write the acceptance test (API integration test or Playwright with a page object), traced to the
    requirement.
  - Run it and show it fails for the expected reason.
  - Implement the minimum that makes it pass, and refactor while green.
  - Run the regression checks, then commit.
- Add the Playwright visual baselines for the new screens and states, compared against the mocks.
- When all slices are green, keep the mocks, design system, screen composition, design and estimate aligned
  with what was built.

## Phase 7: Narrated demo video (`recording-demo-videos`)

Follow the skill, with these overrides:

- Use the demo tooling the scaffold added under `frontend/e2e/demo/`. Do not use edge-tts.
- Run the app and API locally against the seeded SQLite database, as Playwright does.
- Storyboard (adjust to what was built; show only what works):
  1. Click an event in the list to open its page.
  2. Walk through time, venue, description, speakers and community.
  3. Open a streaming event and point out the source time zone.
  4. Open a past event, then a cancelled one, and show the status alert.
  5. Shrink to phone width to show the docked ticket button.
- Drive it with `frontend/e2e/demo/journeys/02-view-event-detail.ts` in Chromium. Take a screenshot at each beat at
  1280 × 720, light theme. Add a dark-theme or phone-width shot where the mocks differ. Save them as
  `docs/demos/02-view-event-detail/screenshots/NN-<beat>.png`.
- Write one short narration paragraph per screenshot: second person, warm, plain, no jargon. Open with what
  "View event detail" lets you do, close with a one-line recap. Save it as `docs/demos/02-view-event-detail/narration.md`.
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
- Save `docs/demos/02-view-event-detail/demo.mp4` (tracked with Git LFS) and `credits.md` (voice model and its licence;
  music title, artist, Pixabay URL and the Pixabay Content License).

## Phase 8: Pull request

- Run the full regression: `dotnet test`, and in `frontend/`: `npm run lint`, `npm run format:check`,
  `npm run tokens:check`, `npm run build-storybook`, the Playwright suite in Chromium including visual
  regression.
- `git fetch origin && git rebase origin/main`, then push the `journey/02-view-event-detail` branch.
- `gh pr create --base main --title "feat(discovery): view event detail"`. In the body: what the user can now
  do, the requirements covered, the tests added, decisions made, anything deferred, and the path to
  `docs/demos/02-view-event-detail/demo.mp4` in the branch.
- `gh pr checks --watch`. If a check fails, fix the cause, push, and watch again.

## Phase 9: Merge

- When every check is green, merge: `gh pr merge --squash --delete-branch`. This prompt authorises the merge.
- `git checkout main && git pull`, then build once more to confirm main is green.
- If branch protection needs a human review, report that as the blocker with the PR link.

## Deferred

- Add to calendar dialog (journey 3).
- Share dialog (journey 12).
- Report a problem dialog (journey 22).
- Venue and stream-origin maps (journey 16).

## Done means

- A visitor opens an event from the list and sees its time (in ET, with the source time for streams), venue, description, speakers, community, tickets and status, end to end, as the requirements state.
- All new and existing tests pass, in Chromium only.
- The documentation agrees with the code.
- `docs/demos/02-view-event-detail/demo.mp4` is narrated with the Kokoro voice, has soca music under it, and has no
  captions.
- The pull request is merged to `main` with green checks, and `main` builds.
- Only then end the run, with a short summary of what was built, the decisions made, the PR link, and anything
  deferred.
