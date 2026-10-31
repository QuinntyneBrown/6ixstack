import type { Journey } from '../scripts/run-journey';

/** Browse events: day groups, the format switch, topics, search, shareable URLs, no results and load more. */
const journey: Journey = async ({ page, context, shot }) => {
  const rows = page.locator('.event-row');
  const where = page.getByRole('group', { name: 'Where' });
  const topics = page.getByRole('group', { name: 'Topics' });
  const search = page.getByRole('searchbox', { name: 'Search events' });

  await page.goto('/');
  await rows.first().waitFor();
  await page.mouse.move(0, 0);
  await page.evaluate(() => window.scrollTo(0, 260));
  await shot('events-by-day');

  await page.setViewportSize({ width: 390, height: 720 });
  await page.evaluate(() => window.scrollTo(0, 520));
  await shot('events-on-a-phone', { phone: true });
  await page.setViewportSize({ width: 1280, height: 720 });

  await where.getByRole('button', { name: /In the GTA/ }).click();
  await page.waitForFunction(() => document.querySelectorAll('.event-row').length === 9);
  await page.evaluate(() => window.scrollTo(0, 260));
  await shot('in-the-gta');

  await topics.getByRole('button', { name: 'AI', exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll('.event-row').length === 4);
  await page.evaluate(() => window.scrollTo(0, 260));
  await shot('topic-ai');

  await search.fill('mississauga');
  await search.press('Enter');
  await page.waitForFunction(() => document.querySelectorAll('.event-row').length === 1);
  await page.evaluate(() => window.scrollTo(0, 260));
  await shot('search');

  const shared = await context.newPage();
  await shared.goto(page.url());
  await shared.locator('.event-row').first().waitFor();
  await shared.evaluate(() => window.scrollTo(0, 260));
  await shot('shared-link', { page: shared });
  await shared.close();

  await search.fill('Kubernetes');
  await search.press('Enter');
  await page.locator('.empty__title').waitFor();
  await page.evaluate(() => window.scrollTo(0, 200));
  await shot('no-results');

  await page.getByRole('button', { name: 'Clear filters' }).first().click();
  await page.waitForFunction(() => document.querySelectorAll('.event-row').length === 14);
  await page.getByRole('button', { name: 'Show 20 more' }).click();
  await page.waitForFunction(() => document.querySelectorAll('.event-row').length === 19);
  await page.locator('.day-group').nth(10).scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, 180));
  await shot('more-events');
};

export default journey;
