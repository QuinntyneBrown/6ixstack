import { expect, test } from '../fixtures';
import { CalendarFeedsPage } from '../pages/calendar-feeds.page';
import { failFeedCounts, slowFeedCounts } from '../support/stub-api';

// Visual parity with docs/mocks/pages/calendar-feeds (the builder arrives with journey 11).
test.describe('Calendar feeds visuals', () => {
  test('default', async ({ page }) => {
    const feeds = new CalendarFeedsPage(page);
    await feeds.open();
    await expect(feeds.meta('Azure')).toHaveText(/in the next two weeks/);
    await expect(page).toHaveScreenshot('calendar-feeds-default-light.png', { fullPage: true });
  });

  test('loading', async ({ page }) => {
    await slowFeedCounts(page, 5_000);
    const feeds = new CalendarFeedsPage(page);
    await feeds.open();
    await expect(feeds.countSkeletons).toHaveCount(6);
    await expect(page).toHaveScreenshot('calendar-feeds-loading-light.png', { fullPage: true });
  });

  test('error', async ({ page }) => {
    await failFeedCounts(page);
    const feeds = new CalendarFeedsPage(page);
    await feeds.open();
    await expect(feeds.failure).toBeVisible();
    await expect(page).toHaveScreenshot('calendar-feeds-error-light.png', { fullPage: true });
  });

  test('copied toast', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const feeds = new CalendarFeedsPage(page);
    await feeds.open();
    await feeds.copy('AI').click();
    const toast = feeds.toast('Feed link copied');
    await expect(toast).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(toast).toHaveScreenshot('feed-link-copied-toast-light.png', {
      mask: [toast.locator('.toast__progress')],
    });
  });

  test('dark theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    const feeds = new CalendarFeedsPage(page);
    await feeds.open();
    await expect(feeds.meta('Azure')).toHaveText(/in the next two weeks/);
    await expect(page).toHaveScreenshot('calendar-feeds-default-dark.png', { fullPage: true });
  });

  test('phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const feeds = new CalendarFeedsPage(page);
    await feeds.open();
    await expect(feeds.meta('Azure')).toHaveText(/in the next two weeks/);
    await expect(page).toHaveScreenshot('calendar-feeds-default-phone.png', { fullPage: true });
  });
});
