# 0003 Fluent UI v9 token roles for the mock palette

- Status: accepted (journey 00)

## Context

`AGENTS.md` requires Fluent UI v9 tokens read by role. The mocks use their own names
(`docs/mocks/assets/tokens.css`) and an ink primary action rather than a coloured brand fill.

## Decision

- `frontend/projects/components/src/lib/tokens/theme.ts` is typed against `@fluentui/tokens`' `Theme`, so
  every name is a real Fluent token.
- Primary fills are `--colorBrandBackground` (ink in light, paper in dark). Brand-coloured text is
  `--colorBrandForeground1` (orange 700 / orange 300). The orange mark is `--sx-color-brand`.
- Canvas is `--colorNeutralBackground2`, surfaces `--colorNeutralBackground1`, raised surfaces
  `--colorNeutralBackground4`, sunken `--colorNeutralBackground3`; control borders `--colorNeutralStroke1`,
  dividers `--colorNeutralStroke2`; status roles use `--colorStatus{Success,Warning,Danger}*`, info uses
  `--colorPaletteBlue*` and `--colorPaletteRoyalBlueForeground2`.
- Values Fluent has no token for keep the `--sx-` prefix: topics, the always-dark map, the feature card,
  typography shorthands, layout, z-order and spacing above 32 px.
- Light values are on `:root`; dark values apply under `prefers-color-scheme: dark` and on
  `[data-theme='dark']` (used by Storybook and the mocks' theme toggle). The app has no theme switch.
