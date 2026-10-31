import type { Journey } from '../scripts/run-journey';

/** View a community: open it from the directory, its profile and events, then one of its events. */
const journey: Journey = async ({ page, shot }) => {
  await page.goto('/communities');
  const card = page.locator('sx-directory-card').filter({ hasText: 'GTA Azure Community' });
  await card.waitFor();
  await card.hover();
  await page.waitForTimeout(600);
  await shot('directory');

  await card.getByRole('link', { name: 'GTA Azure Community' }).click();
  await page.getByRole('heading', { level: 1, name: 'GTA Azure Community' }).waitFor();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(600);
  await shot('community-profile');

  await page
    .locator('#upcoming-h')
    .evaluate((el) => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await page.mouse.move(0, 0);
  await page.waitForTimeout(600);
  await shot('upcoming-and-past');

  await page.locator('.community-upcoming').getByRole('link', { name: 'Azure Data & AI Day GTA' }).click();
  await page.getByRole('heading', { level: 1, name: 'Azure Data & AI Day GTA' }).waitFor();
  await page.waitForTimeout(800);
  await shot('event');
};

export default journey;
