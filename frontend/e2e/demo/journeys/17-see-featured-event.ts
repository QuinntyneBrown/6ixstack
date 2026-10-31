import type { Journey } from '../scripts/run-journey';

/** See the featured event: the events page, the featured card, and opening it. */
const journey: Journey = async ({ page, shot }) => {
  await page.goto('/');
  const card = page.locator('.feature-card');
  await card.locator('.feature-card__title').waitFor();
  await page.waitForTimeout(800);
  await shot('events-page');

  await card.locator('.feature-card__foot a').hover();
  await page.waitForTimeout(500);
  await shot('featured-event');

  await card.locator('.feature-card__foot a').click();
  await page.getByRole('heading', { level: 1, name: 'Azure Data & AI Day GTA' }).waitFor();
  await page.waitForTimeout(800);
  await shot('event-page');
};

export default journey;
