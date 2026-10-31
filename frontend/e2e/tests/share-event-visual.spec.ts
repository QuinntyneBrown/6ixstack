import { expect, test } from '../fixtures';
import { EventDetailPage } from '../pages/event-detail.page';
import { ShareEventDialog } from '../pages/share-event.dialog';

// Visual parity with docs/mocks/dialogs/share-event.
test.describe('Share event visuals', () => {
  async function openShare(page: import('@playwright/test').Page): Promise<ShareEventDialog> {
    const detail = new EventDetailPage(page);
    await detail.open('azure-data-ai-day-gta');
    await detail.share.click();
    const dialog = new ShareEventDialog(page);
    await expect(dialog.panel).toBeVisible();
    return dialog;
  }

  test('default', async ({ page }) => {
    const dialog = await openShare(page);
    await expect(dialog.panel).toHaveScreenshot('share-event-default-light.png');
  });

  test('copied', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const dialog = await openShare(page);
    await dialog.copy.click();
    await expect(dialog.copy).toHaveText('Copied');
    await page.mouse.move(0, 0);
    await expect(dialog.panel).toHaveScreenshot('share-event-success-light.png');
  });

  test('dark theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    const dialog = await openShare(page);
    await expect(dialog.panel).toHaveScreenshot('share-event-default-dark.png');
  });
});
