# 6ixstack — HTML mocks

Static, clickable mocks of every page, dialog and notification of **6ixstack**,
the calendar of developer events across Toronto and the GTA plus global talks you
can stream. The visual language comes from the Magic Patterns prototype at
<https://project-6ixstack-event-platform-597.magicpatterns.app> (warm canvas
`#f7f6f3`, ink `#111318` primary actions, orange `#ff5a1f` brand accent, one hue
per topic, Inter + monospace times). Everything else (detail pages, organizer
and moderation flows, every state) is designed here from that starting point.

**Prototype v2 (applied).** The second published version of the prototype added an event map, and the mocks follow it:
- A dark **"Where it's happening" map** beside the list, sticky on desktop and above the list on phones. GTA events are topic-coloured dots (a dashed ring means hybrid), and streams arrive as arcs from Redmond, Salt Lake City, London and Amsterdam. Hovering a row shows its card on the map.
- A **timeline under the map**. "Play the next two weeks" steps through each day, and picking a day filters the map and dims the other days in the list (`events/day-focus`, `events/playing`).
- The **featured event** sits beside the hero headline, **search** sits next to the All / In the GTA / Streaming switch, and **submit / subscribe** become a band above the footer.
- A wider 1280 px container and Geist / Geist Mono type. Detail pages reuse the map style for venues (`event-detail/default`) and stream origins (`event-detail/streaming`).

## How to open

- Open `index.html` from disk; it links every screen and state. No server, no build.
- Each mock has a mock bar at the bottom: sibling states, theme toggle (or press `t`), and × to hide the chrome.
- `?theme=dark` / `?theme=light` forces a theme; `?chrome=0` hides the mock bar and notes so the page looks exactly like the product.
- Dialogs are shown over the page they open from; notifications are shown on the page that triggers them.
- Triggers that open dialogs (menu, Subscribe, Add to my calendar, Share, Report, Cancel event, Reject…) are links, so you can click through the whole product.

<!--
Cast & catalog — reuse in every mock so the story holds together.

"Today" ........ Monday, November 2, 2026, Toronto (all times ET)
Visitor ........ anonymous developer browsing events (most pages)
Organizer ...... Priya Natarajan (PN), priya@gtaazure.ca, organizer of GTA Azure Community, Azure MVP
Moderator ...... Jordan Lee (JL), jordan@6ixstack.dev
Topics ......... AI, .NET, Azure, Angular, React, AWS (each has a hue dot; always shown with its name)
Formats ........ in person (GTA), streaming, hybrid (in person + stream)

Events, next two weeks (14 — 9 in the GTA, 7 streamable):
  Tue Nov 3  6:00 PM  What's new in the .NET 11 previews ........ Toronto .NET User Group, Microsoft Canada 81 Bay St, Free, 142
  Wed Nov 4 12:00 PM  Azure AI Foundry: shipping agents ......... Microsoft Reactor, streaming (9:00 AM PT), Free, 2,310
  Wed Nov 4  6:30 PM  Signals all the way down .................. Angular Toronto, MaRS, Free, 87
  Thu Nov 5  9:00 AM  Azure Data & AI Day GTA (featured) ........ GTA Azure Community, Living Arts Centre Mississauga + stream, $49, 318
  Thu Nov 5  6:00 PM  Bedrock in the real world ................. AWS User Group Toronto, 120 Bremner Blvd, Free, 128
  Fri Nov 6 11:00 AM  .NET Aspire deep dive ..................... .NET Conf Community, streaming (4:00 PM GMT), Free, 1,480
  Sat Nov 7 10:00 AM  GTA AI Builders Hackathon ................. AI Builders GTA, ventureLAB Markham, Free, 164
  Mon Nov 9  6:30 PM  Server Components, one year in ............ React Toronto, CSI 192 Spadina, Free, 112
  Tue Nov 10 1:00 PM  Angular roadmap: live Q&A ................. ng-conf, streaming (11:00 AM MT), Free, 940
  Tue Nov 10 6:00 PM  RAG evaluation workshop ................... Women in AI Toronto, Vector Institute, $15, 60
  Wed Nov 11 7:00 PM  Landing zones that don't hurt ............. Azure Toronto, Spaces 1 University Ave + stream, Free, 103
  Thu Nov 12 12:00 PM Semantic Kernel office hours .............. Microsoft Semantic Kernel team, streaming (9:00 AM PT), Free, 620
  Thu Nov 12 6:30 PM  Blazor vs Angular: a friendly fight ....... Brampton Dev Night, Brampton Innovation District, Free, 74 (cancelled in the "cancelled" mock)
  Fri Nov 13 11:00 AM React Summit Remote: performance track .... React Summit, streaming (5:00 PM CET), Free, 3,200
Later in November (calendar only): Vector search in Postgres (17), Fabric for Power BI developers (18, Priya's, in review),
  Angular Toronto lightning talks (19), Minimal APIs in practice (19), re:Invent keynote watch party (24), Testing React in 2027 (26)

Speakers: Priya Natarajan, Marcus Bell, Aisha Rahman, Kenji Watanabe, Sofia Marchetti, Daniel Okafor, Leila Haddad, Tomás Rivera, Nadia Chen
Pending submissions: Rust in production at scale (Toronto Rust Meetup), Kubernetes on a budget (Cloud Native Toronto),
  Fabric for Power BI developers (GTA Azure Community), Free crypto trading masterclass (spam)
-->

## Screens at a glance

| Area | Screens |
|---|---|
| Discover | Events (home), Event detail, Calendar (month), Communities, Community detail, Speakers, Speaker detail, Calendar feeds |
| Organize | Sign in (magic link), Submit event, Your events (organizer dashboard), Edit event, Notifications, Settings |
| Moderate | Review queue |
| Static & errors | About, Code of conduct, Contact, 404, 403, 500, Offline |
| Dialogs | Mobile menu, Subscribe to a feed, Add to my calendar, Share, Report a problem, Cancel event, Reject submission, Sign out, Delete account |
| Notifications | Toasts, Event status alerts, Site banners, Submission banners, Moderation toasts |

## Coverage

Generated from `manifest.json` by the checker; do not edit by hand.

<!-- coverage:start -->

Legend: ✅ mock exists · ➖ not applicable (reason in manifest) · ❌ missing

### Pages

| Screen | default | loading | empty | error | hover | day-focus | playing | filtered | no-results | partial | long | edge | streaming | past | cancelled | success | invalid | submitting | read-only | forbidden | read | Requirements |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Events (`events`) | [✅](pages/events/default.html) | [✅](pages/events/loading.html) | [✅](pages/events/empty.html) | [✅](pages/events/error.html) | [✅](pages/events/hover.html) | [✅](pages/events/day-focus.html) | [✅](pages/events/playing.html) | [✅](pages/events/filtered.html) | [✅](pages/events/no-results.html) | [✅](pages/events/partial.html) | [✅](pages/events/long.html) | [✅](pages/events/edge.html) |  |  |  |  |  |  |  |  |  |  |
| Event detail (`event-detail`) | [✅](pages/event-detail/default.html) | [✅](pages/event-detail/loading.html) | ➖ | [✅](pages/event-detail/error.html) |  |  |  |  |  |  |  |  | [✅](pages/event-detail/streaming.html) | [✅](pages/event-detail/past.html) | [✅](pages/event-detail/cancelled.html) |  |  |  |  |  |  |  |
| Calendar (`calendar`) | [✅](pages/calendar/default.html) | [✅](pages/calendar/loading.html) | [✅](pages/calendar/empty.html) | [✅](pages/calendar/error.html) |  |  |  |  | [✅](pages/calendar/no-results.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Communities (`communities`) | [✅](pages/communities/default.html) | [✅](pages/communities/loading.html) | [✅](pages/communities/empty.html) | [✅](pages/communities/error.html) |  |  |  |  | [✅](pages/communities/no-results.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Community detail (`community-detail`) | [✅](pages/community-detail/default.html) | [✅](pages/community-detail/loading.html) | [✅](pages/community-detail/empty.html) | [✅](pages/community-detail/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Speakers (`speakers`) | [✅](pages/speakers/default.html) | [✅](pages/speakers/loading.html) | [✅](pages/speakers/empty.html) | [✅](pages/speakers/error.html) |  |  |  |  | [✅](pages/speakers/no-results.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Speaker detail (`speaker-detail`) | [✅](pages/speaker-detail/default.html) | [✅](pages/speaker-detail/loading.html) | [✅](pages/speaker-detail/empty.html) | [✅](pages/speaker-detail/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Calendar feeds (`calendar-feeds`) | [✅](pages/calendar-feeds/default.html) | [✅](pages/calendar-feeds/loading.html) | ➖ | [✅](pages/calendar-feeds/error.html) |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/calendar-feeds/success.html) |  |  |  |  |  |  |
| About (`about`) | [✅](pages/about/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Code of conduct (`code-of-conduct`) | [✅](pages/code-of-conduct/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Contact (`contact`) | [✅](pages/contact/default.html) | ➖ | ➖ | [✅](pages/contact/error.html) |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/contact/success.html) | [✅](pages/contact/invalid.html) | [✅](pages/contact/submitting.html) |  |  |  |  |
| Not found (404) (`not-found`) | [✅](pages/not-found/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Forbidden (403) (`forbidden`) | [✅](pages/forbidden/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Server error (500) (`server-error`) | [✅](pages/server-error/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Offline (`offline`) | [✅](pages/offline/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Organizer sign in (`sign-in`) | [✅](pages/sign-in/default.html) | ➖ | ➖ | [✅](pages/sign-in/error.html) |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/sign-in/success.html) | [✅](pages/sign-in/invalid.html) | [✅](pages/sign-in/submitting.html) |  |  |  |  |
| Submit an event (`submit-event`) | [✅](pages/submit-event/default.html) | [✅](pages/submit-event/loading.html) | ➖ | [✅](pages/submit-event/error.html) |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/submit-event/success.html) | [✅](pages/submit-event/invalid.html) | [✅](pages/submit-event/submitting.html) |  |  |  |  |
| Your events (`organizer-dashboard`) | [✅](pages/organizer-dashboard/default.html) | [✅](pages/organizer-dashboard/loading.html) | [✅](pages/organizer-dashboard/empty.html) | [✅](pages/organizer-dashboard/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Edit event (`edit-event`) | [✅](pages/edit-event/default.html) | [✅](pages/edit-event/loading.html) | ➖ | [✅](pages/edit-event/error.html) |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/edit-event/success.html) | [✅](pages/edit-event/invalid.html) | [✅](pages/edit-event/submitting.html) | [✅](pages/edit-event/read-only.html) |  |  |  |
| Review queue (`review-queue`) | [✅](pages/review-queue/default.html) | [✅](pages/review-queue/loading.html) | [✅](pages/review-queue/empty.html) | [✅](pages/review-queue/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/review-queue/forbidden.html) |  |  |
| Notifications (`notifications`) | [✅](pages/notifications/default.html) | [✅](pages/notifications/loading.html) | [✅](pages/notifications/empty.html) | [✅](pages/notifications/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/notifications/read.html) |  |
| Settings (`settings`) | [✅](pages/settings/default.html) | [✅](pages/settings/loading.html) | ➖ | [✅](pages/settings/error.html) |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/settings/success.html) | [✅](pages/settings/invalid.html) | [✅](pages/settings/submitting.html) |  |  |  |  |

### Dialogs

| Screen | default | busy | invalid | failed | success | confirm | Requirements |
|---|---|---|---|---|---|---|---|
| Mobile menu (`mobile-nav`) | [✅](dialogs/mobile-nav/default.html) | ➖ | ➖ |  |  |  |  |
| Subscribe to a feed (`subscribe-feed`) | [✅](dialogs/subscribe-feed/default.html) | [✅](dialogs/subscribe-feed/busy.html) | [✅](dialogs/subscribe-feed/invalid.html) | [✅](dialogs/subscribe-feed/failed.html) | [✅](dialogs/subscribe-feed/success.html) |  |  |
| Add to my calendar (`add-to-calendar`) | [✅](dialogs/add-to-calendar/default.html) | [✅](dialogs/add-to-calendar/busy.html) | ➖ | [✅](dialogs/add-to-calendar/failed.html) |  |  |  |
| Share event (`share-event`) | [✅](dialogs/share-event/default.html) | ➖ | ➖ |  | [✅](dialogs/share-event/success.html) |  |  |
| Report a problem (`report-event`) | [✅](dialogs/report-event/default.html) | [✅](dialogs/report-event/busy.html) | [✅](dialogs/report-event/invalid.html) | [✅](dialogs/report-event/failed.html) | [✅](dialogs/report-event/success.html) |  |  |
| Cancel event (`cancel-event`) | [✅](dialogs/cancel-event/default.html) | [✅](dialogs/cancel-event/busy.html) | [✅](dialogs/cancel-event/invalid.html) | [✅](dialogs/cancel-event/failed.html) |  | [✅](dialogs/cancel-event/confirm.html) |  |
| Reject submission (`reject-submission`) | [✅](dialogs/reject-submission/default.html) | [✅](dialogs/reject-submission/busy.html) | [✅](dialogs/reject-submission/invalid.html) | [✅](dialogs/reject-submission/failed.html) |  |  |  |
| Sign out (`sign-out`) | [✅](dialogs/sign-out/default.html) | [✅](dialogs/sign-out/busy.html) | ➖ |  |  |  |  |
| Delete account (`delete-account`) | [✅](dialogs/delete-account/default.html) | [✅](dialogs/delete-account/busy.html) | [✅](dialogs/delete-account/invalid.html) | [✅](dialogs/delete-account/failed.html) |  | [✅](dialogs/delete-account/confirm.html) |  |

### Notifications

| Screen | info | success | warning | danger | with-action | stacked | persistent | Requirements |
|---|---|---|---|---|---|---|---|---|
| Toast (`app-toast`) | [✅](notifications/app-toast/info.html) | [✅](notifications/app-toast/success.html) | [✅](notifications/app-toast/warning.html) | [✅](notifications/app-toast/danger.html) | [✅](notifications/app-toast/with-action.html) | [✅](notifications/app-toast/stacked.html) |  |  |
| Event status alert (`event-alert`) | [✅](notifications/event-alert/info.html) | [✅](notifications/event-alert/success.html) | [✅](notifications/event-alert/warning.html) | [✅](notifications/event-alert/danger.html) |  |  |  |  |
| Site banner (`site-banner`) | [✅](notifications/site-banner/info.html) | [✅](notifications/site-banner/success.html) | [✅](notifications/site-banner/warning.html) | [✅](notifications/site-banner/danger.html) |  |  | [✅](notifications/site-banner/persistent.html) |  |
| Submission status banner (`submission-banner`) | [✅](notifications/submission-banner/info.html) | [✅](notifications/submission-banner/success.html) | [✅](notifications/submission-banner/warning.html) | [✅](notifications/submission-banner/danger.html) |  |  | [✅](notifications/submission-banner/persistent.html) |  |
| Moderation toast (`moderation-toast`) | [✅](notifications/moderation-toast/info.html) | [✅](notifications/moderation-toast/success.html) | [✅](notifications/moderation-toast/warning.html) | [✅](notifications/moderation-toast/danger.html) | [✅](notifications/moderation-toast/with-action.html) | [✅](notifications/moderation-toast/stacked.html) |  |  |

<!-- coverage:end -->

## Open questions and assumptions

The prototype shows only the events home page; everything below was assumed and should be confirmed.

1. **Accounts.** Visitors never sign in. Organizers sign in with an emailed magic link (no passwords) to manage their listings; anyone can submit an event with just an email. Confirm before building auth.
2. **Moderation.** "Reviewed within a day" implies a moderator review queue; the mocks add one with approve / edit / reject and automated checks (venue found, duplicate, link reachable).
3. **Tickets.** 6ixstack links out to the organizer's ticketing page and never sells tickets or charges attendees.
4. **Time zones.** Everything is shown in Toronto time (ET); streams also show the source time (e.g. "9:00 AM PT"), as in the prototype.
5. **Feeds.** Calendar feeds are anonymous `webcal://` URLs built from topic and format choices; no account needed.
6. **Detail pages.** Event, community and speaker detail pages, agenda and speaker sections are new; the prototype has none.
7. **Calendar view.** The nav's "Calendar" is a month grid with the same filters as the list. A week view is not mocked.
8. **Event map.** The map is drawn as a static SVG using the prototype's coordinates and projection; the product can render it with canvas. It stays dark in both themes, and its labels are decorative because the list is the accessible route to every event.
9. **Cookie consent.** None: the mocks assume no tracking cookies (only functional storage for filters), so there is no consent banner.
10. **Fonts.** Geist and Geist Mono (prototype v2), falling back to Inter and system fonts. Mocks fall back to system fonts offline; the product should self-host Inter.
11. **Dark theme.** The prototype is light-only; the dark theme is designed here (the featured card becomes a raised surface instead of ink).

## Re-checking and re-screenshotting

```sh
# coverage, HTML hygiene, links; --write regenerates index.html and the coverage section above
python .claude/skills/writing-html-mocks/scripts/check_mocks.py docs/mocks --write

# PNGs at 360/768/1280 in light and dark into docs/mocks/.cache/mocks (never commit .cache/)
python .claude/skills/writing-html-mocks/scripts/screenshot_mocks.py docs/mocks
```

The mocks were produced by the small Python generator in `_generator/` (shared chrome, cast and components, one module per area). Edit it and run `python docs/mocks/_generator/build.py` to regenerate every file consistently, or edit the HTML directly for one-off tweaks.

Next step: run `extracting-design-systems` to turn these mocks into `docs/design-system/`.
