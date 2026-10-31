# 0007 Toasts and site banners

- Status: accepted (journey 00)

## Context

`site/toasts-and-banners` leaves several points `<TO SUPPLY>`, and the offline cache it relies on (`L2-078`) is
deferred by the scaffold prompt.

## Decision

- `ToastService`, `Toast` and `ToastRegion` live in the `components` library, so Storybook can exercise them and
  every app uses the same service. There is no toast history; the oldest toast is removed.
- Banners from different sources show together, in the order connectivity, version, maintenance.
- The back-online banner stays until dismissed or replaced by the next connectivity change.
- Only requests that get no response count as "API unreachable"; 5xx responses are handled by the page.
- The maintenance notice comes from configuration (`Maintenance:WindowId`, `StartsAtUtc`, `EndsAtUtc`, `Title`,
  `Text`) through `GET /api/site/notice`, which answers 204 when nothing is announced or the window has ended.
- Until the offline cache exists, the offline banner reads "Pages you open may be out of date. Submitting and
  feeds need a connection." The journey that adds `SavedEventsStore` restores "Showing events saved at 9:42 AM".
- The new-version banner needs the Angular service worker's `SwUpdate`, which arrives with the offline cache
  (`L2-078`). `BannerService` already has the `version` source for it.
