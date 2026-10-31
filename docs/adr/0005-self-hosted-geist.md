# 0005 Self-hosted Geist fonts

- Status: accepted (journey 00)

## Context

The mocks use Geist and Geist Mono and note that "the product should self-host" its font. Without a bundled
font, Linux (CI) renders a different fallback than macOS, so visual baselines and the look of headings diverge.

## Decision

Bundle `@fontsource-variable/geist` and `@fontsource-variable/geist-mono` through `angular.json` styles for the
app, Storybook and perf-test. `fontFamilyBase` starts with "Geist Variable" and `fontFamilyMonospace` with
"Geist Mono Variable". Fonts load from the app's own origin, so the CSP stays `default-src 'self'`.
