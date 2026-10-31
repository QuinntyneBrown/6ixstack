import { Page } from '@playwright/test';
import { guarded } from './guarded';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** Answers GET /api/events with a fixture from support/fixtures, for layout cases the seed data does not hold. */
export async function stubEvents(page: Page, fixture: string): Promise<void> {
  const body = readFileSync(resolve(__dirname, 'fixtures', `${fixture}.json`), 'utf8');
  await page.route('**/api/events*', (route) => route.fulfill({ contentType: 'application/json', body }));
}

/** Delays every GET /api/events response by `ms` before it reaches the page. */
export async function slowEvents(page: Page, ms: number): Promise<void> {
  await page.route(
    '**/api/events*',
    guarded(page, async (route) => {
      const response = await route.fetch();
      await new Promise((resolve) => setTimeout(resolve, ms));
      await route.fulfill({ response });
    }),
  );
}

/** Makes GET /api/events fail with a 500 problem response until the returned function is called. */
export async function failEvents(page: Page): Promise<() => Promise<void>> {
  const handler = (route: import('@playwright/test').Route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/problem+json',
      body: JSON.stringify({
        status: 500,
        title: 'Something went wrong on our side.',
        referenceCode: '7F3A-21C9',
      }),
    });
  await page.route('**/api/events*', handler);
  return () => page.unroute('**/api/events*', handler);
}

/** Answers page 1 and page 2 of GET /api/events from two fixtures. */
export async function stubEventPages(page: Page, first: string, second: string): Promise<void> {
  const read = (name: string) => readFileSync(resolve(__dirname, 'fixtures', `${name}.json`), 'utf8');
  await page.route('**/api/events*', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: new URL(route.request().url()).searchParams.get('page') === '2' ? read(second) : read(first),
    }),
  );
}

/** Answers GET /api/events/{slug} with each fixture in turn (the last one repeats). */
export async function stubEventDetail(page: Page, slug: string, ...fixtures: string[]): Promise<void> {
  let call = 0;
  await page.route(`**/api/events/${slug}`, (route) => {
    const name = fixtures[Math.min(call++, fixtures.length - 1)];
    return route.fulfill({
      contentType: 'application/json',
      body: readFileSync(resolve(__dirname, 'fixtures', `${name}.json`), 'utf8'),
    });
  });
}

/** Delays GET /api/events/{slug} by `ms`. */
export async function slowEventDetail(page: Page, slug: string, ms: number): Promise<void> {
  await page.route(
    `**/api/events/${slug}`,
    guarded(page, async (route) => {
      const response = await route.fetch();
      await new Promise((r) => setTimeout(r, ms));
      await route.fulfill({ response });
    }),
  );
}

/** Makes GET /api/events/{slug} fail with 500 until the returned function is called. */
export async function failEventDetail(page: Page, slug: string): Promise<() => Promise<void>> {
  const handler = (route: import('@playwright/test').Route) =>
    route.fulfill({ status: 500, contentType: 'application/problem+json', body: '{"status":500}' });
  await page.route(`**/api/events/${slug}`, handler);
  return () => page.unroute(`**/api/events/${slug}`, handler);
}

/** Delays GET /api/events/{slug}/ics by `ms`. */
export async function slowIcs(page: Page, slug: string, ms: number): Promise<void> {
  await page.route(
    `**/api/events/${slug}/ics`,
    guarded(page, async (route) => {
      const response = await route.fetch();
      await new Promise((r) => setTimeout(r, ms));
      await route.fulfill({ response });
    }),
  );
}

/** Makes GET /api/events/{slug}/ics fail until the returned function is called. */
export async function failIcs(page: Page, slug: string): Promise<() => Promise<void>> {
  const handler = (route: import('@playwright/test').Route) =>
    route.fulfill({ status: 500, contentType: 'application/problem+json', body: '{"status":500}' });
  await page.route(`**/api/events/${slug}/ics`, handler);
  return () => page.unroute(`**/api/events/${slug}/ics`, handler);
}

/** Delays GET /api/reference-data (the submit form's lists) by `ms`. */
export async function slowReferenceData(page: Page, ms: number): Promise<void> {
  await page.route(
    '**/api/reference-data',
    guarded(page, async (route) => {
      const response = await route.fetch();
      await new Promise((resolve) => setTimeout(resolve, ms));
      await route.fulfill({ response });
    }),
  );
}

/** Holds POST /api/submissions until the returned function is called, then lets it through. */
export async function holdSubmission(page: Page): Promise<() => void> {
  let release!: () => void;
  const released = new Promise<void>((resolve) => (release = resolve));
  await page.route(
    '**/api/submissions',
    guarded(page, async (route) => {
      await released;
      await route.continue();
    }),
  );
  return release;
}

/** Makes POST /api/submissions fail with a 500 until the returned function is called. */
export async function failSubmissions(page: Page): Promise<() => Promise<void>> {
  const handler = (route: import('@playwright/test').Route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/problem+json',
      body: JSON.stringify({
        status: 500,
        title: 'Something went wrong on our side.',
        referenceCode: '9C1D-04AA',
      }),
    });
  await page.route('**/api/submissions', handler);
  return () => page.unroute('**/api/submissions', handler);
}

/** Answers POST /api/submissions with a 400 carrying these field errors, as the API's validation does. */
export async function rejectSubmission(page: Page, errors: Record<string, string[]>): Promise<void> {
  await page.route('**/api/submissions', (route) =>
    route.fulfill({
      status: 400,
      contentType: 'application/problem+json',
      body: JSON.stringify({ status: 400, title: 'One or more validation errors occurred.', errors }),
    }),
  );
}

/** Holds POST /api/auth/sign-in-links until the returned function is called. */
export async function holdSignInLink(page: Page): Promise<() => void> {
  let release!: () => void;
  const released = new Promise<void>((resolve) => (release = resolve));
  await page.route(
    '**/api/auth/sign-in-links',
    guarded(page, async (route) => {
      await released;
      await route.continue();
    }),
  );
  return release;
}

/** Answers POST /api/auth/sign-in-links with 202 without sending, for screenshots with a fixed address. */
export async function acceptSignInLink(page: Page): Promise<void> {
  await page.route('**/api/auth/sign-in-links', (route) => route.fulfill({ status: 202, body: '' }));
}

/** Delays GET /api/moderation/queue by `ms`. */
export async function slowQueue(page: Page, ms: number): Promise<void> {
  await page.route(
    '**/api/moderation/queue',
    guarded(page, async (route) => {
      const response = await route.fetch();
      await new Promise((resolve) => setTimeout(resolve, ms));
      await route.fulfill({ response });
    }),
  );
}

/** Makes GET /api/moderation/queue fail with a 500 until the returned function is called. */
export async function failQueue(page: Page): Promise<() => Promise<void>> {
  const handler = (route: import('@playwright/test').Route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/problem+json',
      body: JSON.stringify({
        status: 500,
        title: 'Something went wrong on our side.',
        referenceCode: '2B7E-90C1',
      }),
    });
  await page.route('**/api/moderation/queue', handler);
  return () => page.unroute('**/api/moderation/queue', handler);
}

/** Answers GET /api/moderation/queue with the real queue, its first card's checks still pending. */
export async function withPendingChecks(page: Page): Promise<void> {
  await page.route(
    '**/api/moderation/queue',
    guarded(page, async (route) => {
      const response = await route.fetch();
      const queue = await response.json();
      queue.cards[0].checks = queue.cards[0].checks.map((c: { kind: string }) => ({
        kind: c.kind,
        outcome: 'pending',
        message: 'Checking…',
      }));
      await route.fulfill({ response, json: queue });
    }),
  );
}

/** Answers GET /api/moderation/queue with nothing waiting. */
export async function emptyQueue(page: Page): Promise<void> {
  await page.route('**/api/moderation/queue', (route) =>
    route.fulfill({
      json: { summary: '0 waiting · last approval 12 minutes ago', waitingCount: 0, cards: [] },
    }),
  );
}

/** Answers GET /api/moderation/queue with a fixture (the seeded four submissions), for stable screenshots. */
export async function stubQueue(page: Page, fixture: string): Promise<void> {
  const body = readFileSync(resolve(__dirname, 'fixtures', `${fixture}.json`), 'utf8');
  await page.route('**/api/moderation/queue', (route) =>
    route.fulfill({ contentType: 'application/json', body }),
  );
}

/** Answers GET /api/events/calendar with a fixture from support/fixtures. */
export async function stubCalendar(page: Page, fixture: string): Promise<void> {
  const body = readFileSync(resolve(__dirname, 'fixtures', `${fixture}.json`), 'utf8');
  await page.route('**/api/events/calendar*', (route) =>
    route.fulfill({ contentType: 'application/json', body }),
  );
}

/** Delays GET /api/events/calendar by `ms`. */
export async function slowCalendar(page: Page, ms: number): Promise<void> {
  await page.route(
    '**/api/events/calendar*',
    guarded(page, async (route) => {
      const response = await route.fetch();
      await new Promise((resolve) => setTimeout(resolve, ms));
      await route.fulfill({ response });
    }),
  );
}

/** Makes GET /api/events/calendar fail with a 500 until the returned function is called. */
export async function failCalendar(page: Page): Promise<() => Promise<void>> {
  const handler = (route: import('@playwright/test').Route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/problem+json',
      body: '{"status":500,"referenceCode":"3C9E-77B2"}',
    });
  await page.route('**/api/events/calendar*', handler);
  return () => page.unroute('**/api/events/calendar*', handler);
}

/** Delays GET /api/feeds by `ms`. */
export async function slowFeedCounts(page: Page, ms: number): Promise<void> {
  await page.route(
    '**/api/feeds',
    guarded(page, async (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      const response = await route.fetch();
      await new Promise((resolve) => setTimeout(resolve, ms));
      await route.fulfill({ response });
    }),
  );
}

/** Makes GET /api/feeds fail with a 500 until the returned function is called. */
export async function failFeedCounts(page: Page): Promise<() => Promise<void>> {
  // Only the counts (GET) fail; creating a custom feed (POST) still reaches the API.
  const handler = (route: import('@playwright/test').Route) =>
    route.request().method() === 'GET'
      ? route.fulfill({
          status: 500,
          contentType: 'application/problem+json',
          body: '{"status":500,"referenceCode":"6F0A-12D4"}',
        })
      : route.fallback();
  await page.route('**/api/feeds', handler);
  return () => page.unroute('**/api/feeds', handler);
}

/** Holds POST /api/feeds until the returned function is called. */
export async function holdFeedCreation(page: Page): Promise<() => void> {
  let release!: () => void;
  const released = new Promise<void>((resolve) => (release = resolve));
  await page.route(
    '**/api/feeds',
    guarded(page, async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      await released;
      await route.continue();
    }),
  );
  return release;
}

/** Makes POST /api/feeds fail with a 500 until the returned function is called. */
export async function failFeedCreation(page: Page): Promise<() => Promise<void>> {
  const handler = (route: import('@playwright/test').Route) =>
    route.request().method() === 'POST'
      ? route.fulfill({
          status: 500,
          contentType: 'application/problem+json',
          body: '{"status":500,"referenceCode":"1D4B-88E0"}',
        })
      : route.fallback();
  await page.route('**/api/feeds', handler);
  return () => page.unroute('**/api/feeds', handler);
}

/** Delays GET /api/organizer/events by `ms`. */
export async function slowDashboard(page: Page, ms: number): Promise<void> {
  await page.route(
    '**/api/organizer/events',
    guarded(page, async (route) => {
      const response = await route.fetch();
      await new Promise((resolve) => setTimeout(resolve, ms));
      await route.fulfill({ response });
    }),
  );
}

/** Makes GET /api/organizer/events fail with a 500 until the returned function is called. */
export async function failDashboard(page: Page): Promise<() => Promise<void>> {
  const handler = (route: import('@playwright/test').Route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/problem+json',
      body: '{"status":500,"referenceCode":"4E8C-21AA"}',
    });
  await page.route('**/api/organizer/events', handler);
  return () => page.unroute('**/api/organizer/events', handler);
}

/** Answers GET /api/organizer/events with the real dashboard but this banner, for stable banner screenshots. */
export async function withDashboardBanner(page: Page, banner: Record<string, unknown>): Promise<void> {
  await page.route(
    '**/api/organizer/events',
    guarded(page, async (route) => {
      const response = await route.fetch();
      await route.fulfill({ response, json: { ...(await response.json()), banner } });
    }),
  );
}

/** Makes GET /api/events/map fail until the returned function is called. */
export async function failMap(page: Page): Promise<() => Promise<void>> {
  const handler = (route: import('@playwright/test').Route) =>
    route.fulfill({ status: 500, contentType: 'application/problem+json', body: '{"status":500}' });
  await page.route('**/api/events/map*', handler);
  return () => page.unroute('**/api/events/map*', handler);
}

/** Delays GET /api/events/map by `ms`. */
export async function slowMap(page: Page, ms: number): Promise<void> {
  await page.route(
    '**/api/events/map*',
    guarded(page, async (route) => {
      const response = await route.fetch();
      await new Promise((resolve) => setTimeout(resolve, ms));
      await route.fulfill({ response });
    }),
  );
}

/** Answers GET /api/events/featured with 204: nothing is featured this week. */
export async function nothingFeatured(page: Page): Promise<void> {
  await page.route('**/api/events/featured', (route) => route.fulfill({ status: 204 }));
}

/** Makes GET /api/events/featured fail. */
export async function failFeatured(page: Page): Promise<void> {
  await page.route('**/api/events/featured', (route) =>
    route.fulfill({ status: 500, contentType: 'application/problem+json', body: '{"status":500}' }),
  );
}

/** Makes GET /api/communities fail until the returned function is called. */
export async function failCommunities(page: Page): Promise<() => Promise<void>> {
  const handler = (route: import('@playwright/test').Route) =>
    route.fulfill({ status: 500, contentType: 'application/problem+json', body: '{"status":500}' });
  await page.route('**/api/communities*', handler);
  return () => page.unroute('**/api/communities*', handler);
}

/** Delays GET /api/communities by `ms`. */
export async function slowCommunities(page: Page, ms: number): Promise<void> {
  await page.route(
    '**/api/communities*',
    guarded(page, async (route) => {
      const response = await route.fetch();
      await new Promise((resolve) => setTimeout(resolve, ms));
      await route.fulfill({ response });
    }),
  );
}

/** Makes GET /api/communities/{slug} fail until the returned function is called. */
export async function failCommunity(page: Page): Promise<() => Promise<void>> {
  const pattern = /\/api\/communities\/[a-z0-9-]+$/;
  const handler = (route: import('@playwright/test').Route) =>
    route.fulfill({ status: 500, contentType: 'application/problem+json', body: '{"status":500}' });
  await page.route(pattern, handler);
  return () => page.unroute(pattern, handler);
}

/** Delays GET /api/communities/{slug} by `ms`. */
export async function slowCommunity(page: Page, ms: number): Promise<void> {
  await page.route(
    /\/api\/communities\/[a-z0-9-]+$/,
    guarded(page, async (route) => {
      const response = await route.fetch();
      await new Promise((resolve) => setTimeout(resolve, ms));
      await route.fulfill({ response });
    }),
  );
}

/** Answers GET /api/communities/{slug} with nothing upcoming, keeping the rest of the real answer. */
export async function nothingScheduled(page: Page): Promise<void> {
  await page.route(
    /\/api\/communities\/[a-z0-9-]+$/,
    guarded(page, async (route) => {
      const response = await route.fetch();
      await route.fulfill({ response, json: { ...(await response.json()), upcoming: [] } });
    }),
  );
}

/** Makes GET /api/notifications fail until the returned function is called. */
export async function failNotifications(page: Page): Promise<() => Promise<void>> {
  const handler = (route: import('@playwright/test').Route) =>
    route.request().method() === 'GET'
      ? route.fulfill({ status: 500, contentType: 'application/problem+json', body: '{"status":500}' })
      : route.fallback();
  await page.route('**/api/notifications', handler);
  return () => page.unroute('**/api/notifications', handler);
}

/** Delays GET /api/notifications by `ms`. */
export async function slowNotifications(page: Page, ms: number): Promise<void> {
  await page.route(
    '**/api/notifications',
    guarded(page, async (route) => {
      const response = await route.fetch();
      await new Promise((resolve) => setTimeout(resolve, ms));
      await route.fulfill({ response });
    }),
  );
}

/** Answers GET /api/notifications with an empty list. */
export async function noNotifications(page: Page): Promise<void> {
  await page.route('**/api/notifications', (route) =>
    route.request().method() === 'GET'
      ? route.fulfill({ json: { unreadCount: 0, items: [] } })
      : route.fallback(),
  );
}

/** Answers GET /api/notifications with the real items, all read. */
export async function allNotificationsRead(page: Page): Promise<void> {
  await page.route(
    '**/api/notifications',
    guarded(page, async (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      const response = await route.fetch();
      const body = (await response.json()) as { items: { isRead: boolean }[] };
      await route.fulfill({
        response,
        json: { unreadCount: 0, items: body.items.map((i) => ({ ...i, isRead: true })) },
      });
    }),
  );
}

/** Holds POST /api/events/{slug}/reports until the returned function answers it with `status`. */
export async function holdReports(page: Page): Promise<(status: number) => Promise<void>> {
  let held: import('@playwright/test').Route | null = null;
  await page.route('**/api/events/*/reports', async (route) => {
    held = route;
  });
  return async (status: number) => {
    await held!.fulfill({
      status,
      contentType: 'application/problem+json',
      body: JSON.stringify({ status }),
    });
  };
}

/** Answers POST /api/events/{slug}/reports with `status` until the returned function is called. */
export async function reportsAnswer(page: Page, status: number): Promise<() => Promise<void>> {
  const handler = (route: import('@playwright/test').Route) =>
    route.fulfill({ status, contentType: 'application/problem+json', body: JSON.stringify({ status }) });
  await page.route('**/api/events/*/reports', handler);
  return () => page.unroute('**/api/events/*/reports', handler);
}

/** Makes GET /api/speakers fail until the returned function is called. */
export async function failSpeakers(page: Page): Promise<() => Promise<void>> {
  const handler = (route: import('@playwright/test').Route) =>
    route.fulfill({ status: 500, contentType: 'application/problem+json', body: '{"status":500}' });
  await page.route('**/api/speakers*', handler);
  return () => page.unroute('**/api/speakers*', handler);
}

/** Delays GET /api/speakers by `ms`. */
export async function slowSpeakers(page: Page, ms: number): Promise<void> {
  await page.route(
    '**/api/speakers*',
    guarded(page, async (route) => {
      const response = await route.fetch();
      await new Promise((resolve) => setTimeout(resolve, ms));
      await route.fulfill({ response });
    }),
  );
}

/** Makes GET /api/speakers/{slug} fail until the returned function is called. */
export async function failSpeaker(page: Page): Promise<() => Promise<void>> {
  const pattern = /\/api\/speakers\/[a-z0-9-]+$/;
  const handler = (route: import('@playwright/test').Route) =>
    route.fulfill({ status: 500, contentType: 'application/problem+json', body: '{"status":500}' });
  await page.route(pattern, handler);
  return () => page.unroute(pattern, handler);
}

/** Delays GET /api/speakers/{slug} by `ms`. */
export async function slowSpeaker(page: Page, ms: number): Promise<void> {
  await page.route(
    /\/api\/speakers\/[a-z0-9-]+$/,
    guarded(page, async (route) => {
      const response = await route.fetch();
      await new Promise((resolve) => setTimeout(resolve, ms));
      await route.fulfill({ response });
    }),
  );
}

/** Makes GET /api/account/settings fail until the returned function is called. */
export async function failSettings(page: Page): Promise<() => Promise<void>> {
  const handler = (route: import('@playwright/test').Route) =>
    route.request().method() === 'GET'
      ? route.fulfill({ status: 500, contentType: 'application/problem+json', body: '{"status":500}' })
      : route.fallback();
  await page.route('**/api/account/settings', handler);
  return () => page.unroute('**/api/account/settings', handler);
}

/** Holds PUT /api/account/settings until the returned function answers it with a 500. */
export async function holdSettingsSave(page: Page): Promise<() => Promise<void>> {
  let held: import('@playwright/test').Route | null = null;
  await page.route('**/api/account/settings', async (route) => {
    if (route.request().method() !== 'PUT') return route.fallback();
    held = route;
  });
  return async () => {
    await held!.fulfill({ status: 500, contentType: 'application/problem+json', body: '{"status":500}' });
  };
}

/** Delays GET /api/account/settings by `ms`. */
export async function slowSettings(page: Page, ms: number): Promise<void> {
  await page.route(
    '**/api/account/settings',
    guarded(page, async (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      const response = await route.fetch();
      await new Promise((resolve) => setTimeout(resolve, ms));
      await route.fulfill({ response });
    }),
  );
}

/** Answers PUT /api/account/settings as saved at `savedAt`, without saving anything. */
export async function settingsSaveAnswers(page: Page, savedAt: string): Promise<void> {
  await page.route('**/api/account/settings', (route) =>
    route.request().method() === 'PUT'
      ? route.fulfill({ json: { savedAtLabel: savedAt, pendingEmail: null } })
      : route.fallback(),
  );
}

/** Holds POST /api/account/delete until the returned function answers it with `status`. */
export async function holdAccountDeletion(page: Page): Promise<(status: number) => Promise<void>> {
  let held: import('@playwright/test').Route | null = null;
  await page.route('**/api/account/delete', async (route) => {
    held = route;
  });
  return async (status: number) => {
    await held!.fulfill({
      status,
      contentType: 'application/problem+json',
      body: JSON.stringify({ status }),
    });
  };
}
