import { Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** Answers GET /api/events with a fixture from support/fixtures, for layout cases the seed data does not hold. */
export async function stubEvents(page: Page, fixture: string): Promise<void> {
  const body = readFileSync(resolve(__dirname, 'fixtures', `${fixture}.json`), 'utf8');
  await page.route('**/api/events*', (route) => route.fulfill({ contentType: 'application/json', body }));
}

/** Delays every GET /api/events response by `ms` before it reaches the page. */
export async function slowEvents(page: Page, ms: number): Promise<void> {
  await page.route('**/api/events*', async (route) => {
    const response = await route.fetch();
    await new Promise((resolve) => setTimeout(resolve, ms));
    await route.fulfill({ response });
  });
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
  await page.route(`**/api/events/${slug}`, async (route) => {
    const response = await route.fetch();
    await new Promise((r) => setTimeout(r, ms));
    await route.fulfill({ response });
  });
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
  await page.route(`**/api/events/${slug}/ics`, async (route) => {
    const response = await route.fetch();
    await new Promise((r) => setTimeout(r, ms));
    await route.fulfill({ response });
  });
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
  await page.route('**/api/reference-data', async (route) => {
    const response = await route.fetch();
    await new Promise((resolve) => setTimeout(resolve, ms));
    await route.fulfill({ response });
  });
}

/** Holds POST /api/submissions until the returned function is called, then lets it through. */
export async function holdSubmission(page: Page): Promise<() => void> {
  let release!: () => void;
  const released = new Promise<void>((resolve) => (release = resolve));
  await page.route('**/api/submissions', async (route) => {
    await released;
    await route.continue();
  });
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
  await page.route('**/api/auth/sign-in-links', async (route) => {
    await released;
    await route.continue();
  });
  return release;
}

/** Answers POST /api/auth/sign-in-links with 202 without sending, for screenshots with a fixed address. */
export async function acceptSignInLink(page: Page): Promise<void> {
  await page.route('**/api/auth/sign-in-links', (route) => route.fulfill({ status: 202, body: '' }));
}
