# 6ixstack design system

Extracted from [docs/mocks](../mocks/README.md) on 30 October 2026 (36 screens, 151 mocks). Open [index.html](index.html) locally.

6ixstack is an event calendar for tech events in Toronto, the GTA and online. The system keeps the mocks' decisions: warm neutral surfaces, ink-black primary actions, the 6ix orange for the brand mark and focus ring, one hue per topic (AI, .NET, Azure, Angular, React, AWS), and light and dark themes that both meet WCAG 2.2 AA.

## Foundations

| Page | Covers |
|---|---|
| [Color](foundations/color.html) | Primitive ramps, semantic roles, 6ixstack brand/topic/map colours, both themes, every contrast pair live |
| [Typography](foundations/typography.html) | Geist and Geist Mono, scale, weights, role shorthands, measure |
| [Spacing](foundations/spacing.html) | 4px scale, inside vs between rules, padding by size |
| [Layout](foundations/layout.html) | Breakpoints, columns, gutters, margins, live grid, page templates |
| [Elevation](foundations/elevation.html) | Shadow levels, surface hierarchy, z-order |
| [Shape](foundations/shape.html) | Radii and border widths |
| [Motion](foundations/motion.html) | Durations (incl. event-map motion), easings, demos, reduced motion |
| [Iconography](foundations/iconography.html) | 24-unit 2px-stroke icon set from the mocks |
| [Theming](foundations/theming.html) | data-theme, prefers-color-scheme, token tiers, adding a theme, tokens.json |
| [Responsive](foundations/responsive.html) | Mobile-first rules, per-component breakpoint behaviour, testing matrix |
| [Accessibility](foundations/accessibility.html) | WCAG 2.2 AA commitments, testing, component contract |
| [Content](foundations/content.html) | Voice, casing, dates/times, error and empty-state formulas, microcopy |

## Components

### Actions

| Component | Variants | States | Source mocks |
|---|---|---|---|
| [Button](components/button.html) | Primary, Secondary, Ghost, Link, Danger | Default, Hover, Focus, Active, Disabled, Loading | [pages/submit-event/default](../mocks/pages/submit-event/default.html), [pages/contact/submitting](../mocks/pages/contact/submitting.html), [pages/sign-in/default](../mocks/pages/sign-in/default.html) +2 |
| [Button group](components/button-group.html) | Segmented item, Group button | Default, Hover, Focus, Pressed, Disabled | [pages/events/default](../mocks/pages/events/default.html), [pages/calendar/default](../mocks/pages/calendar/default.html), [dialogs/subscribe-feed/default](../mocks/dialogs/subscribe-feed/default.html) |
| [Link](components/link.html) | Inline, Arrow, Back | Default, Hover, Focus, Visited, Disabled | [pages/events/default](../mocks/pages/events/default.html), [pages/event-detail/default](../mocks/pages/event-detail/default.html), [pages/sign-in/default](../mocks/pages/sign-in/default.html) |
| [Menu](components/menu.html) | Item | Default, Hover / focus, Disabled, Checked, Danger | [pages/organizer-dashboard/default](../mocks/pages/organizer-dashboard/default.html), [pages/settings/default](../mocks/pages/settings/default.html) |

### Inputs

| Component | Variants | States | Source mocks |
|---|---|---|---|
| [Text field](components/text-field.html) | Text, Placeholder | Default, Hover, Focus, Invalid, Disabled, Read-only | [pages/submit-event/invalid](../mocks/pages/submit-event/invalid.html), [pages/sign-in/default](../mocks/pages/sign-in/default.html), [pages/events/default](../mocks/pages/events/default.html) +2 |
| [Textarea](components/textarea.html) | Textarea | Default, Hover, Focus, Invalid, Disabled, Read-only | [pages/submit-event/default](../mocks/pages/submit-event/default.html), [pages/contact/default](../mocks/pages/contact/default.html), [dialogs/cancel-event/invalid](../mocks/dialogs/cancel-event/invalid.html) +1 |
| [Select](components/select.html) | Select | Default, Hover, Focus, Invalid, Disabled | [pages/submit-event/default](../mocks/pages/submit-event/default.html), [pages/communities/default](../mocks/pages/communities/default.html) |
| [Checkbox](components/checkbox.html) | Checkbox, Checked + disabled | Default, Hover, Focus, Checked, Indeterminate, Invalid, Disabled | [pages/submit-event/invalid](../mocks/pages/submit-event/invalid.html), [dialogs/subscribe-feed/default](../mocks/dialogs/subscribe-feed/default.html), [pages/settings/default](../mocks/pages/settings/default.html) |
| [Radio group](components/radio-group.html) | Radio, Card | Default, Hover, Focus, Checked, Invalid, Disabled | [pages/submit-event/default](../mocks/pages/submit-event/default.html), [pages/edit-event/default](../mocks/pages/edit-event/default.html), [dialogs/subscribe-feed/default](../mocks/dialogs/subscribe-feed/default.html) |
| [Switch](components/switch.html) | Switch | Off, Hover, Focus, On, Disabled off, Disabled on | [pages/settings/default](../mocks/pages/settings/default.html), [pages/settings/success](../mocks/pages/settings/success.html) |
| [Form field](components/form-field.html) | Field | Default, Focus, Invalid, Disabled | [pages/submit-event/invalid](../mocks/pages/submit-event/invalid.html), [pages/settings/invalid](../mocks/pages/settings/invalid.html), [dialogs/delete-account/invalid](../mocks/dialogs/delete-account/invalid.html) |
| [Form layout](components/form-layout.html) | Actions bar | Idle, Submitting, Invalid, Failed | [pages/submit-event/default](../mocks/pages/submit-event/default.html), [pages/submit-event/invalid](../mocks/pages/submit-event/invalid.html), [pages/contact/submitting](../mocks/pages/contact/submitting.html) +2 |

### Navigation

| Component | Variants | States | Source mocks |
|---|---|---|---|
| [Site header](components/site-header.html) | Nav link, Submit event, Menu button | Default, Hover, Focus, Active, Current / expanded | [pages/events/default](../mocks/pages/events/default.html), [pages/calendar/default](../mocks/pages/calendar/default.html), [pages/communities/default](../mocks/pages/communities/default.html) +3 |
| [Sidebar navigation](components/sidebar-nav.html) | Item (with icon), Item (text) | Default, Hover, Focus, Active, Current | [pages/settings/default](../mocks/pages/settings/default.html), [pages/settings/invalid](../mocks/pages/settings/invalid.html), [pages/organizer-dashboard/default](../mocks/pages/organizer-dashboard/default.html) +1 |
| [Tabs](components/tabs.html) | Underline, Pill | Default, Hover, Focus, Active, Disabled, Selected | [pages/event-detail/default](../mocks/pages/event-detail/default.html), [pages/organizer-dashboard/default](../mocks/pages/organizer-dashboard/default.html), [pages/events/default](../mocks/pages/events/default.html) |
| [Breadcrumb](components/breadcrumb.html) | Ancestor link, Back link | Default, Hover, Focus, Current | [pages/event-detail/default](../mocks/pages/event-detail/default.html), [pages/speaker-detail/default](../mocks/pages/speaker-detail/default.html), [pages/edit-event/default](../mocks/pages/edit-event/default.html) +1 |
| [Pagination](components/pagination.html) | Page link, Load more | Default, Hover, Focus, Active, Disabled / busy, Current / complete | [pages/communities/default](../mocks/pages/communities/default.html), [pages/speakers/default](../mocks/pages/speakers/default.html), [pages/events/long](../mocks/pages/events/long.html) +1 |
| [Stepper](components/stepper.html) | Where | Upcoming, Current, Complete, Error | [pages/submit-event/default](../mocks/pages/submit-event/default.html), [pages/submit-event/success](../mocks/pages/submit-event/success.html), [pages/contact/success](../mocks/pages/contact/success.html) |
| [Footer](components/footer.html) | Footer link | Default, Hover, Focus | [pages/events/default](../mocks/pages/events/default.html), [pages/communities/default](../mocks/pages/communities/default.html), [pages/not-found/default](../mocks/pages/not-found/default.html) +1 |
| [Skip link](components/skip-link.html) | Skip link | Hidden (default), Focused | [pages/events/default](../mocks/pages/events/default.html), [pages/sign-in/default](../mocks/pages/sign-in/default.html), [dialogs/mobile-nav/default](../mocks/dialogs/mobile-nav/default.html) |

### Containers and overlays

| Component | Variants | States | Source mocks |
|---|---|---|---|
| [Card](components/card.html) | Directory (link card), Static card | Default, Hover, Focus, Active, Selected, Disabled | [pages/communities/default](../mocks/pages/communities/default.html), [pages/speakers/default](../mocks/pages/speakers/default.html), [pages/review-queue/default](../mocks/pages/review-queue/default.html) +2 |
| [Feature card](components/feature-card.html) | On-feature button | Default, Hover, Focus, Active, Disabled | [pages/events/default](../mocks/pages/events/default.html), [pages/events/playing](../mocks/pages/events/playing.html), [dialogs/mobile-nav/default](../mocks/dialogs/mobile-nav/default.html) |
| [Accordion](components/accordion.html) | Item | Default (closed), Hover, Focus, Expanded | [pages/about/default](../mocks/pages/about/default.html), [pages/code-of-conduct/default](../mocks/pages/code-of-conduct/default.html) |
| [Dialog](components/dialog.html) | Destructive form | Default, Invalid, Busy, Failed | [dialogs/cancel-event/default](../mocks/dialogs/cancel-event/default.html), [dialogs/cancel-event/invalid](../mocks/dialogs/cancel-event/invalid.html), [dialogs/cancel-event/busy](../mocks/dialogs/cancel-event/busy.html) +8 |
| [Drawer](components/drawer.html) | Right drawer | Default, Busy | [dialogs/mobile-nav/default](../mocks/dialogs/mobile-nav/default.html), [pages/events/filtered](../mocks/pages/events/filtered.html) |
| [Popover](components/popover.html) | Popover | Closed, Hover (trigger), Focus (trigger), Open | [pages/events/default](../mocks/pages/events/default.html) |
| [Tooltip](components/tooltip.html) | Icon button | Hidden (default), Visible on hover, Visible on focus | [pages/organizer-dashboard/default](../mocks/pages/organizer-dashboard/default.html), [dialogs/cancel-event/default](../mocks/dialogs/cancel-event/default.html), [pages/notifications/default](../mocks/pages/notifications/default.html) +1 |
| [Divider](components/divider.html) | Single form | Static (no interactive states) | [dialogs/mobile-nav/default](../mocks/dialogs/mobile-nav/default.html) |
| [Layout primitives](components/layout-primitives.html) | Single form | Static (no interactive states) | [pages/events/default](../mocks/pages/events/default.html), [pages/event-detail/default](../mocks/pages/event-detail/default.html), [pages/communities/default](../mocks/pages/communities/default.html) +2 |

### Data display

| Component | Variants | States | Source mocks |
|---|---|---|---|
| [Table](components/table.html) | Published event | Default, Hover, Focus within, Selected | [pages/organizer-dashboard/default](../mocks/pages/organizer-dashboard/default.html), [pages/organizer-dashboard/loading](../mocks/pages/organizer-dashboard/loading.html), [pages/organizer-dashboard/empty](../mocks/pages/organizer-dashboard/empty.html) +1 |
| [List](components/list.html) | Option button, Person | Default, Hover, Focus, Active, Busy, Disabled | [pages/calendar-feeds/default](../mocks/pages/calendar-feeds/default.html), [dialogs/add-to-calendar/default](../mocks/dialogs/add-to-calendar/default.html), [dialogs/add-to-calendar/busy](../mocks/dialogs/add-to-calendar/busy.html) +2 |
| [Description list](components/description-list.html) | Single form | Static (no interactive states) | [pages/event-detail/default](../mocks/pages/event-detail/default.html), [pages/event-detail/streaming](../mocks/pages/event-detail/streaming.html), [pages/review-queue/default](../mocks/pages/review-queue/default.html) |
| [Avatar](components/avatar.html) | Account button | Default, Hover, Focus | [pages/speakers/default](../mocks/pages/speakers/default.html), [pages/speaker-detail/default](../mocks/pages/speaker-detail/default.html), [pages/community-detail/default](../mocks/pages/community-detail/default.html) +2 |
| [Badge](components/badge.html) | Single form | Static (no interactive states) | [pages/organizer-dashboard/default](../mocks/pages/organizer-dashboard/default.html), [pages/edit-event/default](../mocks/pages/edit-event/default.html), [pages/events/edge](../mocks/pages/events/edge.html) +2 |
| [Topic chip](components/topic-chip.html) | AI | Default, Hover, Focus, Active, Pressed, Pressed + focus, Disabled | [pages/calendar/default](../mocks/pages/calendar/default.html), [pages/events/default](../mocks/pages/events/default.html), [pages/events/filtered](../mocks/pages/events/filtered.html) +1 |
| [Stat](components/stat.html) | Going | Default, Delta up, Delta down, Loading | [pages/organizer-dashboard/default](../mocks/pages/organizer-dashboard/default.html), [pages/organizer-dashboard/loading](../mocks/pages/organizer-dashboard/loading.html), [pages/events/default](../mocks/pages/events/default.html) |
| [Event row](components/event-row.html) | Meetup | Default, Hover, Focus, Cancelled | [pages/events/default](../mocks/pages/events/default.html), [pages/events/edge](../mocks/pages/events/edge.html), [pages/events/long](../mocks/pages/events/long.html) +2 |
| [Date tile](components/date-tile.html) | Single form | Static (no interactive states) | [pages/events/default](../mocks/pages/events/default.html), [pages/event-detail/default](../mocks/pages/event-detail/default.html), [pages/event-detail/cancelled](../mocks/pages/event-detail/cancelled.html) |
| [Calendar](components/calendar.html) | Event chip, Day cell | Default, Hover, Focus, Today, Outside month | [pages/calendar/default](../mocks/pages/calendar/default.html), [pages/calendar/empty](../mocks/pages/calendar/empty.html), [pages/calendar/loading](../mocks/pages/calendar/loading.html) +3 |
| [Event map](components/event-map.html) | Day button, Play button | Default, Hover, Focus, Pressed (day chosen), Playing, Disabled (no events) | [pages/events/default](../mocks/pages/events/default.html), [pages/events/day-focus](../mocks/pages/events/day-focus.html), [pages/events/playing](../mocks/pages/events/playing.html) +3 |
| [Notification item](components/notification-item.html) | Approval | Unread, Read, Hover, Focus | [pages/notifications/default](../mocks/pages/notifications/default.html), [pages/notifications/read](../mocks/pages/notifications/read.html), [pages/notifications/empty](../mocks/pages/notifications/empty.html) +2 |

### Feedback

| Component | Variants | States | Source mocks |
|---|---|---|---|
| [Toast](components/toast.html) | Dismiss, Action, Success | Default, Hover, Focus, Active, Disabled | [notifications/app-toast/info](../mocks/notifications/app-toast/info.html), [notifications/app-toast/success](../mocks/notifications/app-toast/success.html), [notifications/app-toast/warning](../mocks/notifications/app-toast/warning.html) +7 |
| [Alert and banner](components/alert.html) | Dismiss, Action | Default, Hover, Focus, Active | [notifications/event-alert/info](../mocks/notifications/event-alert/info.html), [notifications/event-alert/warning](../mocks/notifications/event-alert/warning.html), [notifications/event-alert/danger](../mocks/notifications/event-alert/danger.html) +9 |
| [Inline message](components/inline-message.html) | With hint | Default, Focus, Invalid, Invalid + focus, Disabled | [pages/contact/invalid](../mocks/pages/contact/invalid.html), [pages/submit-event/invalid](../mocks/pages/submit-event/invalid.html), [pages/settings/invalid](../mocks/pages/settings/invalid.html) +3 |
| [Progress bar](components/progress.html) | Determinate, Indeterminate | 0%, In progress, Complete, Failed | [dialogs/subscribe-feed/busy](../mocks/dialogs/subscribe-feed/busy.html), [notifications/app-toast/success](../mocks/notifications/app-toast/success.html) |
| [Spinner](components/spinner.html) | Surface, On accent | Small, Medium, Large | [pages/settings/submitting](../mocks/pages/settings/submitting.html), [pages/contact/submitting](../mocks/pages/contact/submitting.html), [dialogs/add-to-calendar/busy](../mocks/dialogs/add-to-calendar/busy.html) +1 |
| [Skeleton](components/skeleton.html) | Text, Circle, Rect | Loading (shimmer), Reduced motion (static) | [pages/events/loading](../mocks/pages/events/loading.html), [pages/communities/loading](../mocks/pages/communities/loading.html), [pages/speakers/loading](../mocks/pages/speakers/loading.html) +4 |
| [Empty state](components/empty-state.html) | Events list, Notifications, Review queue, Event detail | Never had content, Filters remove all, Can't access, Failed to load | [pages/events/empty](../mocks/pages/events/empty.html), [pages/events/no-results](../mocks/pages/events/no-results.html), [pages/calendar/empty](../mocks/pages/calendar/empty.html) +8 |
| [Error page](components/error-page.html) | 500, Offline | Default, Retrying | [pages/not-found/default](../mocks/pages/not-found/default.html), [pages/forbidden/default](../mocks/pages/forbidden/default.html), [pages/server-error/default](../mocks/pages/server-error/default.html) +2 |

## Patterns

| Pattern | Covers |
|---|---|
| [Forms](patterns/forms.html) | How 6ixstack collects input: sections, fields, validation timing, the error summary, submit states and destructive confirmations. |
| [Feedback and loading](patterns/feedback-and-loading.html) | Which feedback answers which action — inline, toast, banner or dialog — and how 6ixstack shows loading with skeletons, spinners and progress. |
| [Empty and error states](patterns/empty-and-error-states.html) | What 6ixstack shows when there is nothing to show: first run, no results, all caught up, no permission, and failures at region and page level. |
| [Navigation and page structure](patterns/navigation.html) | How people move around 6ixstack: the site header and phone menu, back links, the settings section nav, the footer, and the page templates they frame. |
| [Dialogs and overlays](patterns/dialogs-and-overlays.html) | When 6ixstack interrupts with a dialog, and when a popover, tooltip, menu or a full page does the job better. |
| [Data tables and lists](patterns/tables-and-lists.html) | How 6ixstack lays out collections: day-grouped event lists, card lists, the organizer table, sorting, status, row actions and load more. |
| [Notifications](patterns/notifications.html) | How 6ixstack tells people what happened: toasts for the moment, banners for lasting conditions, and the notification list as history — with priority, grouping and dismissal rules. |
| [Content and tone](patterns/content-and-tone.html) | How 6ixstack sounds: voice rules, message formulas, state-by-state labels and a microcopy library taken from the mocks. |

## Tokens

- `tokens/tokens.css` — source of truth: primitives, semantic tokens, light (`:root`, `[data-theme="light"]`), dark (`[data-theme="dark"]` and `prefers-color-scheme: dark`), reduced motion, more contrast, forced colours.
- `tokens/tokens.json` — DTCG export generated from `tokens.css` (338 tokens; dark values under `$extensions`).
- `tokens/contrast-pairs.json` — every foreground/background pairing the components rely on, checked in both themes.
- `assets/components.css` — the component stylesheet: token-only, with real pseudo-class states and `data-state` hooks for documentation.

`docs/mocks/assets/tokens.css` and `ui.css` now import these files, so the mocks render from the system.

## Drift found in the mocks

Values and markup the mocks used inconsistently, and how the system resolved each.

| Mock | Issue | Resolution |
|---|---|---|
| [assets/ui.css](../mocks/assets/ui.css) | Raw letter-spacings `-0.02em`, `-0.035em`, `-0.04em` | `--letter-spacing-tighter` (-0.02em) and `--letter-spacing-display` (-0.035em; -0.04em collapsed into it) |
| [assets/ui.css](../mocks/assets/ui.css) | Raw line heights `1`, `1.02`, `1.3` | `--line-height-none` (1.02 snapped to 1) and `--line-height-snug` |
| [assets/ui.css](../mocks/assets/ui.css) | Raw animation durations `0.8s`, `1.4s`, `1.6s`; reduced-motion override used `0.01ms` | `--duration-spin`, `--duration-shimmer`, `--duration-pulse` (shimmer and pulse zeroed under reduced motion); override uses `--duration-instant` |
| [assets/ui.css](../mocks/assets/ui.css) | Off-scale radius `2px 2px 0 0` on the tab indicator | `--radius-xs` |
| [assets/tokens.css](../mocks/assets/tokens.css) | Translucent `rgba(255,255,255,.1/.16)` tiles and map controls could not be contrast-checked | Opaque equivalents `--palette-ink-tile` / `--palette-ink-tile-hover`, visually identical on ink |
| [assets/tokens.css](../mocks/assets/tokens.css) | Brand orange `#ff5a1f` is 2.89:1 on the canvas | Kept as decorative only (always beside the wordmark or a text label); meaningful orange uses `--color-fg-brand` |
| [notifications/app-toast/info](../mocks/notifications/app-toast/info.html) | In dark theme, tone icons and focus ring on the inverse toast surface were 1.47–1.87:1 | `--color-*-icon-on-inverse` and `--color-focus-ring-on-inverse`, ≥ 4.6:1 in both themes ([toast](components/toast.html)) |
| [notifications/app-toast/stacked](../mocks/notifications/app-toast/stacked.html) | Error toast with `role="alert"` nested in the polite status region | Two sibling live regions ([toast](components/toast.html)) |
| [pages/contact/invalid](../mocks/pages/contact/invalid.html) | Two error messages without a closing full stop | Error messages always end with a full stop ([inline message](components/inline-message.html)) |
| [assets/ui.css](../mocks/assets/ui.css) | `.banner` duplicated `.site-banner` and is unused | Removed; `.site-banner` is the banner ([alert](components/alert.html)) |
| [assets/tokens.css](../mocks/assets/tokens.css) | Reduced motion zeroed `--duration-map-ripple` but not the stream durations | Stream durations zeroed too; `--duration-map-step` kept because the timeline step is user-initiated |
| [assets/tokens.css](../mocks/assets/tokens.css) | Light values were declared on `:root` only, so a nested `data-theme="light"` region inherited dark values | Light block selector is `:root, [data-theme="light"]` |
| [pages/settings/default](../mocks/pages/settings/default.html) | `aria-current="page"` on in-page section anchors | Documented as `aria-current="true"` on the [sidebar navigation](components/sidebar-nav.html) page |
| [pages/communities/default](../mocks/pages/communities/default.html), [pages/speakers/default](../mocks/pages/speakers/default.html), [pages/events/long](../mocks/pages/events/long.html) | "Showing 10 of 86" result count is not a live region | Count gets `role="status"`; see [pagination](components/pagination.html) |
| [pages/contact/submitting](../mocks/pages/contact/submitting.html) | Busy button label changes to "Sending…" | Label is kept, `aria-busy="true"`, progress announced in a live region ([button](components/button.html)) |
| [pages/calendar/default](../mocks/pages/calendar/default.html) | `aria-pressed` on links in the view switcher | Links use `aria-current="page"`; `aria-pressed` only on buttons ([button group](components/button-group.html)) |
| [pages/submit-event/default](../mocks/pages/submit-event/default.html) | Inline colour override on every topic label | Labels inherit the field label colour ([checkbox](components/checkbox.html)) |
| [pages/submit-event/default](../mocks/pages/submit-event/default.html) | Inline margins on fieldsets and grids; fieldset forced to `display: block` | `.form-grid` gaps and a plain fieldset ([form layout](components/form-layout.html)) |
| [pages/submit-event/default](../mocks/pages/submit-event/default.html) | Price field disabled with no explanation | Price field shown only when "Paid" is chosen ([text field](components/text-field.html)) |
| [pages/communities/default](../mocks/pages/communities/default.html) | Filter selects have visually hidden labels only | Kept, but the first "All …" option must name the filter ([select](components/select.html)) |
| [pages/settings/default](../mocks/pages/settings/default.html) | Switches sit above a Save button | Switches apply immediately; Save is for text fields only ([switch](components/switch.html)) |
| [dialogs/cancel-event/default](../mocks/dialogs/cancel-event/default.html) and all dialogs | Inline `style="flex: 1"` on the title block and an inline margin on the description | `.dialog__heading` and `.dialog__desc` ([dialog](components/dialog.html)) |
| [dialogs/mobile-nav/default](../mocks/dialogs/mobile-nav/default.html) | Inline margin on the divider | `.divider--tight` ([divider](components/divider.html)) |
| [pages/review-queue/default](../mocks/pages/review-queue/default.html) | `data-state="hover"` on a non-interactive review card | Review cards have no hover state; remove the attribute ([card](components/card.html)) |
| [assets/ui.css](../mocks/assets/ui.css) | Global `[data-state="focus"]` rule forces `--radius-sm`, squaring cards | Cards keep `--radius-lg` in the focus state ([card](components/card.html)) |
| Tooltips in [pages/events/default](../mocks/pages/events/default.html) | `role="tooltip"` without `aria-describedby` | Correct when the tooltip repeats the accessible name; rule documented, Esc dismisses ([tooltip](components/tooltip.html)) |
| [pages/calendar/default](../mocks/pages/calendar/default.html) | Day cells sit directly under `role="grid"` with no row elements | Week rows (`.cal__week`, `role="row"`) and the grid keyboard model ([calendar](components/calendar.html)) |
| [pages/events/edge](../mocks/pages/events/edge.html) | "Cancelled" repeated in the status badge and the price slot | The badge carries the status; the price slot keeps the price ([event row](components/event-row.html)) |
| [pages/events/default](../mocks/pages/events/default.html) | Featured card's date exists only in an `aria-hidden` date tile | Full date added as visible or visually hidden text ([date tile](components/date-tile.html)) |
| [pages/event-detail/default](../mocks/pages/event-detail/default.html) | Compact map label reads "1 events … 0 streams" | Descriptive, correctly pluralised text alternative ([event map](components/event-map.html)) |
| [pages/events/playing](../mocks/pages/events/playing.html) | Play button relabelled "Pause" and also `aria-pressed="true"` | One stable label with `aria-pressed` ([event map](components/event-map.html)) |
| [pages/events/loading](../mocks/pages/events/loading.html) and other loading mocks | Skeleton heights set inline on 4px-off-grid values (0.9rem, 0.85rem, 1.1rem, 1.3rem, 1.4rem, 1.8rem, 2.4rem) | Heights come from `.skeleton--text` / `.skeleton--title`; only widths are set inline ([skeleton](components/skeleton.html)) |
| [assets/ui.css](../mocks/assets/ui.css) | `.dialog__title` declared twice (h3 then h4 size) | h4 is the documented size ([dialog](components/dialog.html)) |
| [pages/offline/default](../mocks/pages/offline/default.html) | Redundant inline `margin: 0 auto` on the status icon | Dropped; `.status-page` centres its icon |
| [notifications/submission-banner/info](../mocks/notifications/submission-banner/info.html) | Called a banner but behaves as an inline alert | Documented as an inline alert; "banner" means the full-width site banner only ([alert](components/alert.html)) |
| [pages/organizer-dashboard/default](../mocks/pages/organizer-dashboard/default.html) | `white-space: nowrap` repeated inline on every table row | Kept; a `.nowrap` utility is the recommended fix ([table](components/table.html)) |
| Mock copy (several) | Straight and curly apostrophes mixed | Curly apostrophe (’) is the standard ([content](foundations/content.html)) |

## Verification

Run on 30 October 2026 from the repository root:

| Check | Command | Result |
|---|---|---|
| Structure, sections, links, labels, tokens-only colour | `python .claude/skills/extracting-design-systems/scripts/check_design_system.py docs/design-system` | 70 pages (12 foundations, 49 components, 8 patterns, index), 0 errors, 0 warnings |
| Contrast, both themes | `python .claude/skills/extracting-design-systems/scripts/check_contrast.py docs/design-system/tokens/tokens.css` | 188 pairs passed, 0 failed |
| Token coverage | every custom property in `tokens.css` appears in a `data-token` cell on exactly one foundation page | 0 missing, 0 duplicated |
| Mocks | `python .claude/skills/writing-html-mocks/scripts/check_mocks.py docs/mocks` | 36 screens, 152 mocks, 0 errors |

Not yet done: screenshot review at 360 and 1280 px in both themes, and re-pointing every mock at these files (the mocks were being changed by another session during extraction).
