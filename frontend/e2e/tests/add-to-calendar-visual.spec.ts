import { expect, test } from '../fixtures';
import { EventDetailPage } from '../pages/event-detail.page';
import { failIcs } from '../support/stub-api';

// Visual parity with docs/mocks/dialogs/add-to-calendar.
test.describe('Add to my calendar visuals', () => {
  test('default', async ({ page }) => {
    const detail = new EventDetailPage(page);
    await detail.open('azure-data-ai-day-gta');
    const dialog = await detail.openAddToCalendar();
    await expect(dialog.panel).toHaveScreenshot('add-to-calendar-default-light.png');
  });

  test('failed', async ({ page }) => {
    await failIcs(page, 'azure-data-ai-day-gta');
    const detail = new EventDetailPage(page);
    await detail.open('azure-data-ai-day-gta');
    const dialog = await detail.openAddToCalendar();
    await dialog.option('Apple Calendar').click();
    await expect(dialog.failure).toBeVisible();
    await expect(dialog.panel).toHaveScreenshot('add-to-calendar-failed-light.png');
  });

  test('dark theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    const detail = new EventDetailPage(page);
    await detail.open('azure-data-ai-day-gta');
    const dialog = await detail.openAddToCalendar();
    await expect(dialog.panel).toHaveScreenshot('add-to-calendar-default-dark.png');
  });
});
