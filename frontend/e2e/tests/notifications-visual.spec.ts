import { expect, test } from '../fixtures';
import { NotificationsPage } from '../pages/notifications.page';
import { CO_ORGANIZER, signInAs } from '../support/session';
import {
  allNotificationsRead,
  failNotifications,
  noNotifications,
  slowNotifications,
} from '../support/stub-api';

// Visual parity with docs/mocks/pages/notifications.
test.describe('Notifications visuals', () => {
  test.beforeEach(async ({ page }) => {
    await signInAs(page, CO_ORGANIZER);
  });

  test('default', async ({ page }) => {
    const notifications = new NotificationsPage(page);
    await notifications.open();
    await expect(notifications.items).toHaveCount(5);
    await page.mouse.move(0, 0);
    await expect(page).toHaveScreenshot('notifications-default-light.png');
  });

  test('read', async ({ page }) => {
    await allNotificationsRead(page);
    const notifications = new NotificationsPage(page);
    await notifications.open();
    await expect(notifications.lead).toHaveText('All caught up');
    await page.mouse.move(0, 0);
    await expect(page).toHaveScreenshot('notifications-read-light.png');
  });

  test('empty', async ({ page }) => {
    await noNotifications(page);
    const notifications = new NotificationsPage(page);
    await notifications.open();
    await expect(notifications.empty).toBeVisible();
    await expect(page).toHaveScreenshot('notifications-empty-light.png');
  });

  test('loading', async ({ page }) => {
    await slowNotifications(page, 5_000);
    const notifications = new NotificationsPage(page);
    await notifications.open();
    await expect(notifications.skeletonRows).toHaveCount(4);
    await expect(page).toHaveScreenshot('notifications-loading-light.png');
  });

  test('error', async ({ page }) => {
    await failNotifications(page);
    const notifications = new NotificationsPage(page);
    await notifications.open();
    await expect(notifications.failure).toBeVisible();
    await expect(page).toHaveScreenshot('notifications-error-light.png');
  });

  test('dark theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    const notifications = new NotificationsPage(page);
    await notifications.open();
    await expect(notifications.items).toHaveCount(5);
    await page.mouse.move(0, 0);
    await expect(page).toHaveScreenshot('notifications-default-dark.png');
  });

  test('phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const notifications = new NotificationsPage(page);
    await notifications.open();
    await expect(notifications.items).toHaveCount(5);
    await expect(page).toHaveScreenshot('notifications-default-phone.png');
  });
});
