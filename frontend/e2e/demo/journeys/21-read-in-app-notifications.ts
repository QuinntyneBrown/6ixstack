import type { Journey } from '../scripts/run-journey';

/** Read in-app notifications: the unread count, the page, opening one and marking all read. */
const journey: Journey = async ({ page, shot }) => {
  const signedIn = await page.request.post('/api/test/sign-in', { data: { email: 'marcus@gtaazure.ca' } });
  if (!signedIn.ok()) throw new Error('Sign-in failed');

  await page.goto('/organize');
  const bell = page.getByRole('link', { name: /^Notifications/ });
  await bell.waitFor();
  await page.locator('sx-table tbody tr').first().waitFor();
  await bell.hover();
  await page.waitForTimeout(600);
  await shot('unread-count');

  await bell.click();
  await page.locator('sx-notification-item').first().waitFor();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(600);
  await shot('notifications');

  await page
    .locator('sx-notification-item')
    .filter({ hasText: 'passed 300 going' })
    .getByRole('link')
    .click();
  await page.getByRole('heading', { level: 1, name: 'Azure Data & AI Day GTA' }).waitFor();
  await page.waitForTimeout(600);
  await shot('open-one');

  await page.goto('/notifications');
  await page.locator('sx-notification-item').first().waitFor();
  await page.getByRole('button', { name: 'Mark all as read' }).click();
  await page.getByText('All caught up').waitFor();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(600);
  await shot('all-caught-up');
};

export default journey;
