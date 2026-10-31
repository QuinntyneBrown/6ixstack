import { expect, test } from '../fixtures';
import { EventDetailPage } from '../pages/event-detail.page';
import { ReportEventDialog } from '../pages/report-event.dialog';
import { holdReports, reportsAnswer } from '../support/stub-api';

async function openReport(page: import('@playwright/test').Page): Promise<ReportEventDialog> {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const detail = new EventDetailPage(page);
  await detail.open('azure-data-ai-day-gta');
  await detail.reportProblem.click();
  const dialog = new ReportEventDialog(page);
  await expect(dialog.panel).toBeVisible();
  await page.mouse.move(0, 0);
  return dialog;
}

// Visual parity with docs/mocks/dialogs/report-event. Sends are stubbed, so no report is filed.
test.describe('Report a problem visuals', () => {
  test('default', async ({ page }) => {
    const dialog = await openReport(page);
    await expect(dialog.panel).toHaveScreenshot('report-event-default-light.png');
  });

  test('invalid', async ({ page }) => {
    const dialog = await openReport(page);
    await dialog.send.click();
    await expect(dialog.reasonError).toBeVisible();
    await expect(dialog.panel).toHaveScreenshot('report-event-invalid-light.png');
  });

  test('busy', async ({ page }) => {
    const release = await holdReports(page);
    const dialog = await openReport(page);
    await dialog.report(
      'Wrong date, time or venue',
      'The venue page says Hall B, but the ticket says the Hammerson Hall.',
    );
    await expect(dialog.send).toHaveText('Sending…');
    await page.mouse.move(0, 0);
    await expect(dialog.panel).toHaveScreenshot('report-event-busy-light.png');
    await release(202);
  });

  test('failed', async ({ page }) => {
    await reportsAnswer(page, 500);
    const dialog = await openReport(page);
    await dialog.report(
      'Wrong date, time or venue',
      'The venue page says Hall B, but the ticket says the Hammerson Hall.',
    );
    await expect(dialog.failure).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(dialog.panel).toHaveScreenshot('report-event-failed-light.png');
  });

  test('success', async ({ page }) => {
    await reportsAnswer(page, 202);
    const dialog = await openReport(page);
    await dialog.report('Wrong date, time or venue');
    await expect(dialog.backToEvent).toBeFocused();
    await expect(dialog.sent).toHaveScreenshot('report-event-success-light.png');
  });

  test('dark theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    const dialog = await openReport(page);
    await expect(dialog.panel).toHaveScreenshot('report-event-default-dark.png');
  });
});
