import type { Journey } from '../scripts/run-journey';

/** View a speaker: open them from the directory, their profile, then an upcoming talk. */
const journey: Journey = async ({ page, shot }) => {
  await page.goto('/speakers');
  const card = page.locator('sx-directory-card').filter({ hasText: 'Priya Natarajan' });
  await card.waitFor();
  await card.hover();
  await page.waitForTimeout(600);
  await shot('directory');

  await card.getByRole('link', { name: 'Priya Natarajan' }).click();
  await page.getByRole('heading', { level: 1, name: 'Priya Natarajan' }).waitFor();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(600);
  await shot('speaker-profile');

  await page
    .locator('#upcoming-h')
    .evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.mouse.move(0, 0);
  await page.waitForTimeout(600);
  await shot('talks');

  await page.locator('.speaker-upcoming .event-row').first().getByRole('link').first().click();
  await page.getByRole('heading', { level: 1, name: 'Azure Data & AI Day GTA' }).waitFor();
  await page.waitForTimeout(800);
  await shot('event');
};

export default journey;
