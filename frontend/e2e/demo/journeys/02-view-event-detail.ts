import type { Journey } from '../scripts/run-journey';

/** View event detail: from the list to an event, its sections, and the streaming, past and cancelled variants. */
const journey: Journey = async ({ page, shot }) => {
  const title = page.getByRole('heading', { level: 1 });

  await page.goto('/');
  await page.locator('.event-row').first().waitFor();
  await page.evaluate(() => window.scrollTo(0, 420));
  const row = page.locator('.event-row').filter({ hasText: 'Azure Data & AI Day GTA' });
  await row.hover();
  await shot('pick-from-the-list');

  await row.getByRole('link', { name: 'Azure Data & AI Day GTA' }).click();
  await title.waitFor();
  await shot('event-detail');

  await page.getByRole('heading', { name: 'Agenda' }).scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, 120));
  await shot('agenda-and-speakers');

  await page.goto('/events/azure-ai-foundry-shipping-agents');
  await title.waitFor();
  await shot('streaming-event');

  await page.goto('/events/minimal-apis-in-practice-october');
  await title.waitFor();
  await shot('past-event');

  await page.goto('/events/brampton-dev-night-november-social');
  await title.waitFor();
  await shot('cancelled-event');

  await page.setViewportSize({ width: 390, height: 720 });
  await page.goto('/events/azure-data-ai-day-gta');
  await title.waitFor();
  await page.evaluate(() => window.scrollTo(0, 600));
  await shot('docked-ticket-bar', { phone: true });
};

export default journey;
