# 0013 Venue coordinates come from a background geocoding job, with OpenStreetMap Nominatim in production

- Status: accepted

## Context

The event map (`L2-011`) plots a GTA event at its venue's latitude and longitude, and the event-map design says
those coordinates come from geocoding. Nothing stored them: only the development seeder wrote coordinates, so
every event added through the CLI (`events add`), approved from a submission or moved to a new address by an
edit had a venue without coordinates. In production the timeline counted those events while the map showed
"Nothing on the map yet". No geocoding provider had been chosen (automated-checks design), and `LocalGeocoder`
only answers whether an address looks like a GTA street address.

## Decision

- A port `IVenueLocator` in `SixStack.Application` turns a venue address and city into a `GeoPoint`, or `null`
  when it cannot answer now.
- One background job, `VenueGeocodingJob`, sends `LocateVenuesCommand` shortly after start-up and then every
  5 minutes. The command fills coordinates for up to 50 published, not-cancelled, not-yet-started in-person or
  hybrid events whose venue has none. It covers every way an event reaches the database (CLI, API, submission,
  edit, rows already in production) without touching each write path, and needs no backfill step.
- `Geocoding:Provider` chooses the adapter:
  - `Local` (the default, used by tests, Playwright, demos and development) places the venue at its city's
    reference point from a fixed table of the reference-list cities. It never touches the network.
  - `Nominatim` (production, set in `src/SixStack.Api/appsettings.Production.json`) queries OpenStreetMap Nominatim's search API for the
    address in Ontario, Canada, at most one request a second, with an identifying `User-Agent`, as the
    Nominatim usage policy asks. An address Nominatim does not find falls back to the city's reference point, so
    the event still appears on the map and is not looked up again; a network error or non-success status returns
    `null` and the next run retries.
- `Geocoding:Enabled` set to `false` turns the job off. API tests and Playwright set it, so their maps stay
  exactly as seeded.

## Consequences

- A new event appears on the map within about 5 minutes of being published, not instantly.
- A venue Nominatim cannot find sits at its city's reference point, which is approximate.
- Production depends on Nominatim's public service and its usage policy. The volume (a few dozen look-ups a
  month) is far inside it; a paid provider can replace the adapter behind `IVenueLocator`.
