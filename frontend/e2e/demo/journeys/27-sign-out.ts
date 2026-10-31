import type { Journey } from '../scripts/run-journey';

/** Sign out: signed in as the organizer, Sign out from Settings, and the signed-out header. */
const journey: Journey = async ({ page, shot }) => {
  const signedIn = await page.request.post('/api/test/sign-in', { data: { email: 'priya@gtaazure.ca' } });
  if (!signedIn.ok()) throw new Error('Sign-in failed');

  await page.goto('/organize');
  await page.locator('sx-table tbody tr').first().waitFor();
  await page.waitForTimeout(600);
  await shot('signed-in');

  await page.goto('/settings');
  await page.getByRole('button', { name: 'Sign out', exact: true }).waitFor();
  await page
    .locator('#account')
    .evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await page.getByRole('dialog', { name: 'Sign out of 6ixstack?' }).waitFor();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(500);
  await shot('sign-out');

  await page.getByRole('dialog').getByRole('button', { name: 'Sign out' }).click();
  await page.waitForURL(/\/$/);
  await page.locator('.event-row').first().waitFor();
  await page.waitForTimeout(800);
  await shot('signed-out');
};

export default journey;
