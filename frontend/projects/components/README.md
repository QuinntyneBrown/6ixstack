# components

The 6ixstack component library (`sx-*`). Components keep the BEM classes of the mocks in `docs/mocks/` and
read Fluent UI v9 design tokens by role.

- `src/lib/tokens/theme.ts` is the source of the light and dark themes. Run `npm run tokens` after changing
  it; `npm run tokens:check` fails when `styles/_tokens.scss` or `tokens/tokens.ts` are stale.
- `src/lib/styles/sixstack.scss` holds the global foundations (tokens, base typography, focus ring, layout
  utilities). Component styles stay encapsulated.
- Every component has a story folder in `stories/src/<Name>/` and a perf-test scenario in
  `../perf-test/src/scenarios/`.
- `npm run storybook` / `npm run build-storybook` from `frontend/`.
