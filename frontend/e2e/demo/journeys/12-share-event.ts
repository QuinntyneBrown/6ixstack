import type { Journey } from '../scripts/run-journey';

/** Share an event: open it, choose Share, and copy its short link. */
const journey: Journey = async ({ page, shot }) => {
  const dialog = page.getByRole('dialog', { name: 'Share this event' });
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

  await page.goto('/events/azure-data-ai-day-gta');
  await page.getByRole('heading', { level: 1 }).waitFor();
  await page.waitForTimeout(400);
  await shot('event');

  await page.getByRole('button', { name: 'Share', exact: true }).click();
  await dialog.waitFor();
  await page.waitForTimeout(400);
  await shot('share-dialog');

  await dialog.getByRole('button', { name: 'Copy' }).click();
  await dialog.getByRole('button', { name: 'Copied' }).waitFor();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(200);
  await shot('link-copied');
};

export default journey;
