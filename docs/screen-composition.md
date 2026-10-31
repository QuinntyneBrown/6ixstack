# Screen composition

This document maps every page, dialog, notification and shell part in
[`docs/mocks/`](mocks/README.md) to the components of the 6ixstack component
library (`frontend/projects/components`, selectors `sx-*`) that build it. It is
binding: implement each screen from exactly the components its entry lists.

- **Sources:** the mocks (`docs/mocks/manifest.json`, `docs/mocks/*/<screen>/<state>.html`),
  the design system component catalogue (`docs/design-system/README.md`,
  `docs/design-system/components/*.html`) and the component names the detailed
  designs chose (`docs/detailed-designs/**/README.md`).
- **Library component:** a public component of project `components`, named here by
  class name (`SiteHeader` = `sx-site-header`). Only `Icon` (`sx-icon`) exists
  today; every other entry in the [catalogue](#library-catalogue) is planned and
  must be added to the library, its stories and the design system before a
  screen uses it.
- **Local UI:** markup and styles built in project `sixstack` (page, dialog or
  shared app component) because no library component covers it. Local UI still
  uses library components inside it and reads tokens by role.
- **Excluded:** mock-only chrome (`mock-bar`, `mock-note`, the `index.html`
  coverage grid) and the page behind a dialog or notification mock.
- `Icon` is used wherever the mocks draw an `svg.icon`; it is not repeated in
  each entry. Layout utilities (`stack`, `cluster`, `grid`, `page-grid`,
  `stack-gap`, `map-col`, `page--narrow`, `visually-hidden`, `text-muted`,
  `text-caption`) are the library's global styles (design system *Layout
  primitives*), not components.

## Library catalogue

| Class | Selector | Design system page | Mock blocks it owns |
|---|---|---|---|
| `Icon` (exists) | `sx-icon` | foundations/iconography | `icon` |
| `Button` | `sx-button` | button | `btn` (primary, secondary, ghost, icon, sm, lg, block, danger, on-feature); `busy` input for `aria-busy` |
| `SegmentedControl` | `sx-segmented-control` | button-group (segmented) | `segmented`, `segmented__item`, `segmented__count` |
| `ButtonGroup` | `sx-button-group` | button-group | `btn-group` |
| `Link` | `sx-link` | link | inline link, `arrow-link`, `back-link` |
| `Menu` | `sx-menu` | menu | not used by any mock |
| `TextField` | `sx-text-field` | text-field | `input`, `search`, `input-group` + `addon`, `copy-field` |
| `Textarea` | `sx-textarea` | textarea | `textarea` |
| `Select` | `sx-select` | select | `select` |
| `Checkbox` | `sx-checkbox` | checkbox | `choice` (checkbox), `choice-row` |
| `RadioGroup` | `sx-radio-group` | radio-group | `choice` (radio), `choice-cards`, `choice-card` |
| `Switch` | `sx-switch` | switch | `switch` |
| `FormField` | `sx-form-field` | form-field | `field`, `field__label`, `field__help`, `field__error`, `optional` |
| `FormLayout` | `sx-form-layout` | form-layout | `form-card`, `form-section`, `form-grid`, `span-2`, `form-actions` |
| `ErrorSummary` | `sx-error-summary` | form-layout, alert | `form-summary` |
| `InlineMessage` | `sx-inline-message` | inline-message | `inline-status` |
| `SiteHeader` | `sx-site-header` | site-header | `site-header`, `brand`, `nav-link`, `site-header__menu` |
| `SidebarNav` | `sx-sidebar-nav` | sidebar-nav | `settings-nav`, `settings-layout` |
| `Tabs` | `sx-tabs` | tabs | not used by any mock |
| `Breadcrumb` | `sx-breadcrumb` | breadcrumb | not used by any mock (back links use `Link`) |
| `Pagination` | `sx-pagination` | pagination | `load-more` |
| `Stepper` | `sx-stepper` | stepper | `steps-next` |
| `SiteFooter` | `sx-site-footer` | footer | `site-footer` |
| `SkipLink` | `sx-skip-link` | skip-link | `skip-link` |
| `Card` | `sx-card` | card | `card`, `review-card`, `check-list` |
| `DirectoryCard` | `sx-directory-card` | card (directory) | `dir-card` |
| `FeatureCard` | `sx-feature-card` | feature-card | `feature-card` |
| `Accordion` | `sx-accordion` | accordion | not used by any mock |
| `DialogShell` | `sx-dialog-shell` | dialog | `backdrop`, `dialog`, `dialog__panel`, `dialog__header`, `dialog__icon`, `dialog__body`, `dialog__footer` |
| `Drawer` | `sx-drawer` | drawer | not used by any mock (the mobile menu is a `DialogShell` sheet) |
| `Popover` | `sx-popover` | popover | not used by any mock |
| `Tooltip` | `sx-tooltip` | tooltip | `has-tooltip`, `tooltip` |
| `Divider` | `sx-divider` | divider | `divider` |
| `Table` | `sx-table` | table | `table-wrap`, `table`, `num`, `status`, `row-actions` |
| `List` | `sx-list` | list | `list`, `option-list`, `option-btn`, `people`, `person` |
| `Facts` / `FactItem` | `sx-facts` / `sx-fact-item` | description-list | `facts`, `fact` |
| `Avatar` | `sx-avatar` | avatar | `avatar` |
| `LogoTile` | `sx-logo-tile` | avatar | `logo-tile` |
| `Badge` | `sx-badge` | badge | `badge` (count, danger, warning) |
| `TopicChip` | `sx-topic-chip` | topic-chip | `topic-chip`, `chip-row` (filter) |
| `TopicTag` | `sx-topic-tag` | topic-chip (tag) | `topic-tag`, `topic-dot` |
| `Stat` / `StatsRow` | `sx-stat` / `sx-stats-row` | stat | `stat`, `stats-row` |
| `EventRow` | `sx-event-row` | event-row | `event-row`, `event-list`, `meta-item`, `going` |
| `DayGroup` | `sx-day-group` | event-row | `day-group` |
| `DateTile` | `sx-date-tile` | date-tile | `date-tile` |
| `MonthGrid` | `sx-month-grid` | calendar | `cal`, `cal-legend` |
| `CalendarDayList` | `sx-calendar-day-list` | calendar (agenda) | `agenda` under the month grid (below 768 px) |
| `EventMap` | `sx-event-map` | event-map | `event-map` (full and `--compact`) |
| `MapTimeline` | `sx-map-timeline` | event-map | `map-day`, play control |
| `NotificationItem` | `sx-notification-item` | notification-item | `notif-list`, `notif` |
| `DetailHero` | `sx-detail-hero` | none (named in directory designs) | `detail-hero` |
| `DockedActionBar` | `sx-docked-action-bar` | none (named in view-event-detail design) | `sticky-cta` |
| `DescriptionRenderer` | `sx-description-renderer` | none (named in security-hardening design) | user-written description inside `prose` |
| `Toast` | `sx-toast` | toast | `toast`, `toast__action`, `toast__progress`, `close` |
| `ToastRegion` | `sx-toast-region` | toast | `toast-region` |
| `Alert` | `sx-alert` | alert | `alert`, `alert__actions`, `close`, `site-banner` |
| `Progress` | `sx-progress` | progress | not used outside `Toast` |
| `Spinner` | `sx-spinner` | spinner | busy indicator inside a busy `Button` |
| `Skeleton` | `sx-skeleton` | skeleton | `skeleton` (text, title, rect, circle) |
| `EmptyState` | `sx-empty-state` | empty-state | `empty` (incl. `--error`, `--compact`), `success-panel` |
| `StatusPage` | `sx-status-page` | error-page | `status-page` |

Services: dialogs open through Angular CDK `Dialog` with their content wrapped in
`DialogShell`; toasts go through `ToastService`, rendered by `ToastRegion` and
`Toast`. `ToastService` and `DialogLauncher` live in project `sixstack` per
`site/toasts-and-banners` and `platform/accessibility`.

## Shell

| Part | Library components | Local UI |
|---|---|---|
| Skip link | `SkipLink` | — |
| Site header (signed out) | `SiteHeader`, `Button` (Submit event, menu button), `Icon` | — |
| Site header (signed in: notifications, account) | `SiteHeader` actions slot: `Button` (icon link), `Badge` (count), `Tooltip`, `Avatar` (inside the account link) | `AccountControls` (`shell/account-controls`) |
| Site banner (`notifications/site-banner`) | `Alert` | `SiteBannerOutlet` (between header and `main`) |
| Main region | — | `AppShell` (`<main id="main" class="page">`, route focus) |
| Site footer | `SiteFooter` | — |
| Toast region | `ToastRegion`, `Toast` | — |
| Mobile menu (`dialogs/mobile-nav`) | see [Dialogs](#dialogs) | — |

## Shared local components

| Item | Used by | Notes |
|---|---|---|
| Page title (`page-title`, `lead`) | about, calendar, calendar-feeds, code-of-conduct, communities, contact, edit-event, notifications, organizer-dashboard, review-queue, settings, speakers, submit-event | `h1` + lead + optional action `Button`; candidate for the catalogue |
| Prose (`prose`) | about, code-of-conduct, event-detail, community-detail, speaker-detail | Long-form text styles; user text goes through `DescriptionRenderer` |
| Filter bar (`filter-bar`, `filter-row`) | events, calendar | Composes `TextField` (search), `SegmentedControl`, `TopicChip` row; shares `FilterStateStore` |
| Result line (`result-line`) | events, communities, speakers | `aria-live="polite"` count text (`ResultLine` in `platform/accessibility`) |
| Directory toolbar (`toolbar`) | communities, speakers | `TextField` (search) + `Select` (topic) |
| Feed choice form (`FeedBuilder`) | calendar-feeds, subscribe-feed | Topics `Checkbox` group + scope `RadioGroup`; app component per `build-custom-feed` |
| Feed link panel (`FeedLinkPanel`) | calendar-feeds (success), subscribe-feed (success) | `FormField` + `TextField` (copy-field) + `Button` (Copy) + `List` (option-list) |
| Event form (sections Event basics, When, Where, Tickets) | submit-event, edit-event | `FormSection`, `FormField`, `Input`, `FieldSet`, `Choice`, `Check`; build once |

## Pages

### Public

#### Events — `/` — `pages/events`: default, hover, day-focus, playing, loading, empty, error, filtered, no-results, partial, long, edge

- Library: `FeatureCard` (with `DateTile`, `Button` on-feature; journey 17), `SegmentedControl` (design system: button group, segmented), `TopicChip`, `SearchField` (design system: text field, search), `DayGroup`, `EventRow` (with `TopicTag`, `Badge`), `EventMap`, `MapTimeline` (journey 16), `Link` (arrow), `Button`; loading `Skeleton`; empty and no-results `EmptyState`; error `Alert` (list, with Try again and a link action) + `Skeleton` (map waits); long load more (`Button`, busy while loading); edge `Badge` (Waitlist open, Cancelled on `EventRow`).
- Local: hero (`hero`, `hero__stat`), filter bar, result line, `EventMapPanel` (map states), CTA band (`cta-band`: submit and subscribe sections). hover, day-focus, playing and partial change map/list state classes only (`is-dim`, `is-off`, `is-hot`).

#### Event detail — `/events/:slug` — `pages/event-detail`: default, loading, error, streaming, past, cancelled

- Library: `Icon` (back link), `DateTile` (lg), `TopicTag`, `Description` (the design's `DescriptionRenderer`), `PersonLink` with `Avatar` (speakers), `EventMap` (compact; journey 16), `FactItem` (facts), `Button` (primary, block, ghost), `DockedActionBar`; loading `Skeleton`; error `EmptyState` (error); not found `StatusPage` (`NotFoundPage`); streaming, past, cancelled and status alerts `Alert` (see `notifications/event-alert`).
- Local: page layout, back link, detail hero, facts panel frame (`.facts`), prose section, agenda (`ol.agenda`, `agenda__time`: no library component for an event agenda; flag for catalogue review), share/report/calendar action row.

#### Calendar — `/calendar` — `pages/calendar`: default, loading, empty, error, no-results

- Library: `SegmentedControl`, `TopicChip`, `Button`, `ButtonGroup` (month nav), `MonthGrid` (with `TopicTag` legend), `CalendarDayList`; loading `Skeleton`; empty, error and no-results use `Alert` (not `EmptyState`).
- Local: page title, filter bar, calendar toolbar (`cal-toolbar`: month heading and actions).

#### Communities — `/communities` — `pages/communities`: default, loading, empty, error, no-results

- Library: `TextField` (search), `Select`, `DirectoryCard` (with `LogoTile`, `TopicTag`, `meta-item`), `Pagination` (load more); loading `Skeleton`; empty and no-results `EmptyState`; error `Alert`.
- Local: page title, directory toolbar, card grid layout, result line (loading).

#### Speakers — `/speakers` — `pages/speakers`: default, loading, empty, error, no-results

- Same composition as Communities with `Avatar` in place of `LogoTile` in `DirectoryCard`.

#### Community detail — `/communities/:id` — `pages/community-detail`: default, loading, empty, error

- Library: `Link` (back), `DetailHero`, `LogoTile` (lg), `TopicTag`, `DescriptionRenderer`, `DayGroup`, `EventRow`, `List` (past events; people/person with `Avatar`), `Facts`/`FactItem`; loading `Skeleton`; empty `EmptyState` (no upcoming events); error `EmptyState` (error).
- Local: page layout, prose section, subscribe action opening `subscribe-feed`.

#### Speaker detail — `/speakers/:id` — `pages/speaker-detail`: default, loading, empty, error

- Library: `Link` (back), `DetailHero`, `Avatar` (xl), `TopicTag`, `DescriptionRenderer`, `EventRow`, `List`, `Facts`/`FactItem`; loading `Skeleton`; empty `EmptyState`; error `EmptyState` (error).
- Local: page layout, prose section.

#### Calendar feeds — `/feeds` — `pages/calendar-feeds`: default, loading, error, success

- Library: `List` (ready-made feeds) with `LogoTile`, `Button`; `FormLayout`, `Checkbox`, `RadioGroup`, `TopicTag`, `Stepper` (steps-next); loading `Skeleton`; error `Alert`; success `EmptyState` (success panel), `FormField`, `TextField` (copy-field), `List` (option-list).
- Local: page title, `FeedBuilder`, `FeedLinkPanel`.

#### About — `/about` — `pages/about`: default

- Library: `StatsRow`, `Stat`.
- Local: page title, prose.

#### Code of conduct — `/code-of-conduct` — `pages/code-of-conduct`: default

- Library: none beyond the shell.
- Local: page title, prose.

#### Contact — `/contact` — `pages/contact`: default, invalid, submitting, success, error

- Library: `FormLayout`, `FormField`, `TextField`, `Select`, `Textarea`, `Button` (busy when submitting), `Facts`/`FactItem` (contact facts); invalid `ErrorSummary` + `Alert`; error `Alert`; success `EmptyState` (success panel).
- Local: page title, two-column page layout.

#### Organizer sign in — `/sign-in` — `pages/sign-in`: default, invalid, submitting, success, error

- Library: `FormField`, `Input` (design system: text field), `Button` (lg, block, busy when submitting); invalid `ErrorSummary`; error `Alert`; success `SuccessPanel` (design system: empty state, success panel) with `Button` (Resend link with countdown, Use a different email).
- Local: auth layout (`auth-layout`, `auth-card`), the "No account needed" footnote.

#### Status pages — `pages/not-found` (`*`), `pages/forbidden` (`/organize/events/:id/edit`), `pages/server-error` (`*`), `pages/offline` (`*`): default

- Library: `StatusPage` (code, title, `empty__actions` with `Button`). Forbidden shows the signed-in header.
- Local: `NotFoundPage`, `ForbiddenPage`, `ServerErrorPage`, `OfflinePage` supply copy and actions only.

### Organizer and admin

#### Submit an event — `/submit` — `pages/submit-event`: default, loading, error, invalid, submitting, success

- Library: `FormSection` (design system: form layout), `FormField`, `Input` (design system: text field incl. `$` addon, textarea, select), `FieldSet` + `Choice` + `Check` (design system: checkbox for topics, radio group with cards for format and price), `Button` (busy when submitting); loading `Skeleton`; error `Alert`; invalid `ErrorSummary` + `Alert`; success `SuccessPanel` (design system: empty state, success panel) + `NextSteps` (design system: stepper, steps-next).
- Local: page title, event form (`shared/event-form`: form-card frame, grids, topic dots, price addon).

#### Edit event — `/organize/events/:id/edit` — `pages/edit-event`: default, loading, error, invalid, submitting, success, read-only

- Library: as Submit an event, plus `Link` (back), `InlineMessage` ("Saved" status); loading `Skeleton`; error `EmptyState` (error); invalid `ErrorSummary` + `Alert`; read-only `Alert` (inputs disabled, no actions); success `Alert` (dismissible).
- Local: page title, event form (shared).

#### Your events — `/organize` — `pages/organizer-dashboard`: default, loading, empty, error

- Library: `Button` (New event, row actions), `StatsRow`, `Stat`, `Table` (status cell, row actions), `Badge`; loading `Skeleton`; empty `FormLayout` (form-card) + `EmptyState`; error `Alert`; submission status `Alert` (see `notifications/submission-banner`).
- Local: page title.

#### Review queue — `/admin/review` — `pages/review-queue`: default, checking, loading, empty, error, forbidden

- Library: `ReviewCard` (design system: card, review card; meta items, `TopicTag`, check list with passed, warning and pending checks, actions slot), `Button` (Approve, Edit, Reject from journeys 07, 08 and 14); loading `Skeleton`; empty `EmptyState`; forbidden `EmptyState`; error `Alert`.
- Local: page title with the queue summary, review list layout (`review-list`), `ReviewQueueShortcuts`.

#### Keyboard shortcuts — dialog — `dialogs/keyboard-shortcuts`: default

- Library: `DialogShell`, `Button` (Close).
- Local: `KeyboardShortcutsDialog` content (description list of keys, `kbd`).

#### Notifications — `/notifications` — `pages/notifications`: default, loading, empty, error, read

- Library: `Button` (Mark all read), `NotificationItem` (unread and read); loading `Skeleton`; empty `FormLayout` (form-card) + `EmptyState`; error `Alert`.
- Local: page title.

#### Settings — `/settings` — `pages/settings`: default, loading, error, invalid, submitting, success

- Library: `SidebarNav`, `FormLayout`, `FormField`, `TextField`, `Switch`, `Button` (Save, Sign out, Delete account danger); loading `Skeleton`; error `Alert`; invalid `ErrorSummary` + `Alert`; submitting busy `Button`; success `Alert` (dismissible).
- Local: page title, danger zone (`danger-zone`).

## Dialogs

| Dialog (mock folder: states) | Overlay surface | Library components | Local UI |
|---|---|---|---|
| Mobile menu (`mobile-nav`: default) | CDK `Dialog` + `DialogShell` (bottom sheet) | `DialogShell`, `Divider`, `Button` (Submit event, block, lg) | `MobileMenuDialog`, `mobile-nav` link lists (`NAV_ITEMS`) |
| Subscribe to a feed (`subscribe-feed`: default, busy, invalid, failed, success) | CDK `Dialog` + `DialogShell` | `DialogShell`, `Checkbox`, `RadioGroup`, `Button` (busy); invalid `FormField` error; failed `Alert`; success `Alert`, `FormField`, `TextField` (copy-field), `List` (option-list) | `SubscribeFeedDialog`, `FeedBuilder`, `FeedLinkPanel` |
| Add to my calendar (`add-to-calendar`: default, busy, failed) | CDK `Dialog` + `DialogShell` | `DialogShell`, `OptionButton` (the design system's List option button; busy option); failed `Alert`; success `Toast` | `AddToCalendarDialog`, option list layout, `CalendarLinkBuilder`, `FileDownloader` |
| Share event (`share-event`: default, success) | CDK `Dialog` + `DialogShell` | `DialogShell`, `FormField`, `TextField` (copy-field), `Button` (Copy / Copied), `List` (option-list) | `ShareEventDialog` |
| Report a problem (`report-event`: default, busy, invalid, failed, success) | CDK `Dialog` + `DialogShell` | `DialogShell`, `RadioGroup`, `FormField`, `Textarea`, `TextField` (email), `Button` (busy); invalid `FormField` error; failed `Alert`; success `EmptyState` (success panel) | `ReportProblemDialog` |
| Cancel event (`cancel-event`: default, busy, invalid, failed, confirm) | CDK `Dialog` + `DialogShell` (danger icon) | `DialogShell`, `FormField`, `Textarea`, `Checkbox`, `Button` (danger, busy); confirm `TextField`; failed `Alert` | `CancelEventDialog` |
| Reject submission (`reject-submission`: default, busy, invalid, failed) | CDK `Dialog` + `DialogShell` (danger icon) | `DialogShell`, `RadioGroup`, `FormField`, `Textarea`, `Button` (danger, busy); failed `Alert` | `RejectSubmissionDialog` |
| Sign out (`sign-out`: default, busy) | CDK `Dialog` + `DialogShell` | `DialogShell`, `Button` (busy) | `SignOutDialog` |
| Delete account (`delete-account`: default, busy, invalid, failed, confirm) | CDK `Dialog` + `DialogShell` (danger icon) | `DialogShell`, `FormField`, `TextField` (confirm), `Button` (danger, busy); failed `Alert` | `DeleteAccountDialog` |

## Notifications

| Notification (mock folder: states) | Surface | Library components | Local UI |
|---|---|---|---|
| Toast (`app-toast`: info, success, warning, danger, with-action, stacked) | `ToastRegion` via `ToastService` | `ToastRegion`, `Toast` (action, dismiss, progress) | — |
| Moderation toast (`moderation-toast`: info, success, warning, danger, conflict, too-late, with-action, stacked) | `ToastRegion` via `ToastService` (on review queue) | `ToastRegion`, `Toast` (Undo action) | — |
| Event status alert (`event-alert`: info, success, warning, danger) | inline on event detail | `Alert` | — |
| Site banner (`site-banner`: info, success, warning, danger, persistent) | between header and `main` | `Alert` (`site-banner`, dismiss unless persistent) | `SiteBannerOutlet` |
| Submission status banner (`submission-banner`: info, success, warning, danger, persistent) | inline on organizer dashboard | `Alert` (dismiss on info and success) | — |

## Summary of local UI to build

1. `AppShell` (main region, route focus) and `SiteBannerOutlet`.
2. Page title block (`page-title`, `lead`).
3. Prose block (`prose`).
4. Events hero (`hero`, `hero__stat`).
5. Filter bar (`filter-bar`, `filter-row`) for events and calendar.
6. Result line (`result-line`).
7. `EventMapPanel` (map states around `EventMap`).
8. CTA band (`cta-band`) on events.
9. Event agenda (`agenda`) on event detail.
10. Calendar toolbar (`cal-toolbar`).
11. Directory toolbar (`toolbar`) and card grid for communities and speakers.
12. `FeedBuilder` and `FeedLinkPanel`.
13. Event form shared by submit-event and edit-event.
14. Auth layout (`auth-layout`, `auth-card`) for sign-in.
15. Review list layout (`review-list`).
16. Settings danger zone (`danger-zone`).
17. Status page wrappers (`NotFoundPage`, `ForbiddenPage`, `ServerErrorPage`, `OfflinePage`).
18. Dialog content components: `MobileMenuDialog`, `SubscribeFeedDialog`, `AddToCalendarDialog`, `ShareEventDialog`, `ReportProblemDialog`, `CancelEventDialog`, `RejectSubmissionDialog`, `SignOutDialog`, `DeleteAccountDialog`.

Candidates for catalogue change control (built locally until the library adds
them): page title, prose, filter bar, result line, event agenda.
