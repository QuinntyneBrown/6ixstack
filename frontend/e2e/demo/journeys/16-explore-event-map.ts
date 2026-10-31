import type { Journey } from '../scripts/run-journey';

/** Explore the event map: the map beside the list, hover linking, a focused day, playback and the phone layout. */
const journey: Journey = async ({ page, shot }) => {
  await page.goto('/');
  const map = page.locator('.event-map');
  await map.locator('.event-map__event').first().waitFor();
  await page.locator('#events').evaluate((el) => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await page.mouse.move(0, 0);
  await page.waitForTimeout(800);
  await shot('map-beside-the-list');

  const row = page.locator('li[data-slug="whats-new-in-dotnet-11-previews"]');
  await row.locator('a').first().focus();
  await map.locator('.event-map__tip').waitFor();
  await page.waitForTimeout(600);
  await shot('hover-a-row');

  await map.locator('.map-day[aria-label^="Thursday, November 5:"]').click();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(1200);
  await shot('pick-a-day');

  await map.getByRole('button', { name: 'Show all dates' }).click();
  await map.getByRole('button', { name: 'Play the next two weeks' }).click();
  await page.waitForTimeout(1100 * 6 + 300);
  await page.mouse.move(0, 0);
  await shot('play-the-next-two-weeks');
  await map.getByRole('button', { name: 'Pause' }).click();

  await page.setViewportSize({ width: 390, height: 720 });
  await page.goto('/');
  await map.locator('.event-map__event').first().waitFor();
  await page.locator('#events').evaluate((el) => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await page.waitForTimeout(800);
  await shot('phone-map-above-the-list');
};

export default journey;
