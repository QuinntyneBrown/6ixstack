import { expect, test } from '../fixtures';
import { CancelEventDialog } from '../pages/cancel-event.dialog';
import { EditEventPage } from '../pages/edit-event.page';
import { OrganizerDashboardPage } from '../pages/organizer-dashboard.page';
import {
  asCancelled,
  cancelsSucceed,
  failCancels,
  holdCancels,
  withKnownAttendees,
} from '../support/editing';
import { ORGANIZER, signInAs } from '../support/session';

const DAY = 'Azure Data & AI Day GTA';
const REASON = 'Our venue double-booked Hall B. We’re moving to January and will post the new date here.';

async function openCancel(page: import('@playwright/test').Page, title = DAY): Promise<CancelEventDialog> {
  await signInAs(page, ORGANIZER);
  const dashboard = new OrganizerDashboardPage(page);
  await dashboard.open();
  await dashboard.row(title).cancel.click();
  const dialog = new CancelEventDialog(page);
  await expect(dialog.panel).toBeVisible();
  await page.mouse.move(0, 0);
  return dialog;
}

// Visual parity with docs/mocks/dialogs/cancel-event, notifications/cancel-toast and pages/edit-event/cancelled.
// Every cancellation here is stubbed, so the seeded events stay as they are.
test.describe('Cancel event visuals', () => {
  test('default, with the email option', async ({ page }) => {
    await withKnownAttendees(page, 318);
    const dialog = await openCancel(page);
    await expect(dialog.panel).toHaveScreenshot('cancel-event-default-light.png');
  });

  test('no email', async ({ page }) => {
    const dialog = await openCancel(page, 'Fabric for Power BI developers');
    await expect(dialog.panel).toHaveScreenshot('cancel-event-no-email-light.png');
  });

  test('invalid', async ({ page }) => {
    const dialog = await openCancel(page);
    await dialog.confirmName.fill(DAY);
    await dialog.confirm.click();
    await expect(dialog.reasonError).toBeVisible();
    await expect(dialog.panel).toHaveScreenshot('cancel-event-invalid-light.png');
  });

  test('confirm', async ({ page }) => {
    const dialog = await openCancel(page);
    await dialog.reason.fill(REASON);
    await dialog.confirmName.fill('Azure Data & AI');
    await expect(dialog.confirm).toBeDisabled();
    await expect(dialog.panel).toHaveScreenshot('cancel-event-confirm-light.png');
  });

  test('busy', async ({ page }) => {
    const release = await holdCancels(page);
    const dialog = await openCancel(page);
    await dialog.confirmName.fill(DAY);
    await dialog.cancelWith(REASON);
    await expect(dialog.confirm).toHaveText('Cancelling…');
    await page.mouse.move(0, 0);
    await expect(dialog.panel).toHaveScreenshot('cancel-event-busy-light.png');
    await release();
  });

  test('failed', async ({ page }) => {
    await failCancels(page);
    const dialog = await openCancel(page);
    await dialog.confirmName.fill(DAY);
    await dialog.cancelWith(REASON);
    await expect(dialog.failure).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(dialog.panel).toHaveScreenshot('cancel-event-failed-light.png');
  });

  test('cancelled toast', async ({ page }) => {
    await cancelsSucceed(page, DAY, 318);
    const dialog = await openCancel(page);
    await dialog.confirmName.fill(DAY);
    await dialog.cancelWith(REASON);
    const toast = dialog.toast(DAY);
    await expect(toast).toBeVisible();
    await expect(toast).toHaveScreenshot('cancel-toast-success-light.png');
  });

  test('cancelled edit page', async ({ page }) => {
    await signInAs(page, ORGANIZER);
    await asCancelled(page, REASON);
    const dashboard = new OrganizerDashboardPage(page);
    await dashboard.open();
    await dashboard.row(DAY).edit.click();
    const edit = new EditEventPage(page);
    await expect(edit.cancelled).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(page).toHaveScreenshot('edit-event-cancelled-light.png');
  });

  test('dark theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    const dialog = await openCancel(page);
    await expect(dialog.panel).toHaveScreenshot('cancel-event-default-dark.png');
  });
});
