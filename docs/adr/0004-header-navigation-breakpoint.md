# 0004 Header navigation breakpoint

- Status: accepted (journey 00)

## Context

The mocks show the header navigation from 768 px (`docs/mocks/assets/ui.css`), while `L2-095` and `L2-096`
and the app-shell design put the menu button below 992 px and the header navigation from 992 px.

## Decision

The requirement wins: below 992 px the header shows the menu button and hides the Primary navigation; from
992 px it shows the navigation. The Submit event label hides below 576 px, as the design states.
