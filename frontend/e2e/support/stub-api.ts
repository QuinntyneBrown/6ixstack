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
