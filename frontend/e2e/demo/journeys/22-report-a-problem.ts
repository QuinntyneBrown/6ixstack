import type { Journey } from '../scripts/run-journey';

/** Report a problem: open an event, choose a reason, send, and the confirmation. */
const journey: Journey = async ({ page, shot }) => {
  await page.goto('/events/azure-data-ai-day-gta');
  const report = page.getByRole('button', { name: 'Report a problem' });
  await report.waitFor();
  await page.waitForTimeout(600);
  await shot('event-page');

  await report.click();
  const dialog = page.getByRole('dialog', { name: 'Report a problem' });
  await dialog.waitFor();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(500);
  await shot('report-a-problem');

  await dialog.getByRole('radio', { name: 'Wrong date, time or venue' }).check();
  await dialog
    .getByLabel(/Details/)
    .fill('The venue page says Hall B, but the ticket says the Hammerson Hall.');
  await page.waitForTimeout(400);
  await shot('choose-a-reason');

  await dialog.getByRole('button', { name: 'Send report' }).click();
  await page.getByRole('dialog', { name: 'Report sent' }).waitFor();
  await page.waitForTimeout(600);
  await shot('report-sent');
};

export default journey;
