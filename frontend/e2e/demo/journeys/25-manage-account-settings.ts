import type { Journey } from '../scripts/run-journey';

/** Manage account settings: open Settings, change the name, turn off an email type, and save. */
const journey: Journey = async ({ page, shot }) => {
  const signedIn = await page.request.post('/api/test/sign-in', { data: { email: 'priya@gtaazure.ca' } });
  if (!signedIn.ok()) throw new Error('Sign-in failed');

  await page.goto('/settings');
  const name = page.getByLabel('Name', { exact: true });
  await name.waitFor();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(600);
  await shot('settings');

  await name.fill('Priya N.');
  await page.waitForTimeout(400);
  await shot('change-name');

  await page.getByRole('switch', { name: 'Someone reports a problem with my event' }).uncheck();
  await page
    .getByRole('switch', { name: 'Someone reports a problem with my event' })
    .evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.mouse.move(0, 0);
  await page.waitForTimeout(400);
  await shot('turn-off-an-email');

  await page.getByRole('button', { name: 'Save settings' }).click();
  await page.getByText('Settings saved').waitFor();
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(600);
  await shot('settings-saved');
};

export default journey;
