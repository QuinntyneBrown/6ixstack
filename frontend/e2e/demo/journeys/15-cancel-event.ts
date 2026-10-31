import type { Journey } from '../scripts/run-journey';

/** Cancel an event: from the dashboard, give a reason, confirm, and see the cancelled listing. */
const journey: Journey = async ({ page, shot }) => {
  const signedIn = await page.request.post('/api/test/sign-in', { data: { email: 'priya@gtaazure.ca' } });
  if (!signedIn.ok()) throw new Error('Sign-in failed');
  const title = 'Azure Data & AI Day GTA';

  await page.goto('/organize');
  const row = page.locator('sx-table tbody tr').filter({ hasText: title });
  await row.waitFor();
  await row.hover();
  await page.waitForTimeout(400);
  await shot('dashboard');

  await row.getByRole('button', { name: /^Cancel/ }).click();
  const dialog = page.getByRole('dialog', { name: /^Cancel “/ });
  await dialog
    .getByLabel(/Reason for attendees/)
    .fill('Our venue double-booked Hall B. We’re moving to January and will post the new date here.');
  await page.mouse.move(0, 0);
  await page.waitForTimeout(400);
  await shot('give-a-reason');

  await dialog.getByLabel(/Type the event name to confirm/).fill(title);
  await page.waitForTimeout(400);
  await shot('confirm');

  await dialog.getByRole('button', { name: 'Cancel event' }).click();
  await page.getByText(`Cancelled “${title}”`).waitFor();
  await page.waitForTimeout(600);
  await shot('cancelled');

  await page.goto('/events/azure-data-ai-day-gta');
  await page.locator('.detail-alerts').waitFor();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(400);
  await shot('listing-cancelled');
};

export default journey;
