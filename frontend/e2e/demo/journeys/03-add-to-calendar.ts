import type { Journey } from '../scripts/run-journey';

/** Add to calendar: from an event, open the dialog, use Google or Outlook, download the .ics, and recover from a failure. */
const journey: Journey = async ({ page, shot }) => {
  const dialog = page.getByRole('dialog', { name: 'Add to my calendar' });
  const option = (name: string) => dialog.locator('.option-btn').filter({ hasText: name });

  await page.goto('/events/azure-data-ai-day-gta');
  await page.getByRole('heading', { level: 1 }).waitFor();
  await shot('upcoming-event');

  await page.getByRole('button', { name: 'Add to my calendar' }).click();
  await dialog.waitFor();
  await page.waitForTimeout(400);
  await shot('add-to-my-calendar');

  await option('Google Calendar').focus();
  await shot('google-and-outlook');

  const download = page.waitForEvent('download');
  await option('Apple Calendar').click();
  await download;
  await page.locator('.toast').waitFor();
  await shot('ics-downloaded');

  await page.route('**/api/events/*/ics', (route) => route.fulfill({ status: 500, body: '{}' }));
  await page.getByRole('button', { name: 'Add to my calendar' }).click();
  await dialog.waitFor();
  await option('Other app (.ics file)').click();
  await dialog.getByRole('alert').waitFor();
  await shot('file-failed');

  await page.unroute('**/api/events/*/ics');
  const retry = page.waitForEvent('download');
  await option('Other app (.ics file)').click();
  await retry;
  await page.locator('.toast').first().waitFor();
  await shot('retry-works');
};

export default journey;
