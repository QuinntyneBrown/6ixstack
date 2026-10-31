import type { Journey } from '../scripts/run-journey';

/** Edit an event: from the dashboard, move the start time, save, see it on the listing, and open a past event. */
const journey: Journey = async ({ page, shot }) => {
  const signedIn = await page.request.post('/api/test/sign-in', { data: { email: 'priya@gtaazure.ca' } });
  if (!signedIn.ok()) throw new Error('Sign-in failed');
  const top = () => page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));

  await page.goto('/organize');
  const row = page.locator('sx-table tbody tr').filter({ hasText: 'Azure Data & AI Day GTA' });
  await row.waitFor();
  await row.hover();
  await page.waitForTimeout(400);
  await shot('dashboard-edit');

  await row.getByRole('link', { name: /^Edit/ }).click();
  const starts = page.getByLabel('Starts');
  await page.getByLabel('Event title').waitFor();
  await starts.fill('09:30');
  await starts.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.mouse.move(0, 0);
  await page.waitForTimeout(400);
  await shot('change-start-time');

  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.getByText('Changes saved').waitFor();
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await top();
  await page.waitForTimeout(400);
  await shot('changes-saved');

  await page.getByRole('link', { name: 'View the listing' }).click();
  await page.getByText('Start time changed to 9:30 AM').waitFor();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(400);
  await shot('listing-updated');

  await page.goto('/organize');
  const past = page.locator('sx-table tbody tr').filter({ hasText: 'Copilot Studio for developers' });
  await past.getByRole('link', { name: /^View/ }).click();
  await page.getByText('This event has ended, so it can’t be edited').waitFor();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(400);
  await shot('past-event-read-only');
};

export default journey;
