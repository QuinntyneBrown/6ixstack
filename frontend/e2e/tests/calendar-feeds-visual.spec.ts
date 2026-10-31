import { expect, test } from '../fixtures';
import { CalendarFeedsPage } from '../pages/calendar-feeds.page';
import { EventsPage } from '../pages/events.page';
import { SubscribeFeedDialog } from '../pages/subscribe-feed.dialog';
import { failFeedCounts, failFeedCreation, slowFeedCounts } from '../support/stub-api';

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

test.describe('Custom feed visuals', () => {
  test('builder invalid', async ({ page }) => {
    const feeds = new CalendarFeedsPage(page);
    await feeds.open();
    await feeds.builder.create.click();
    await expect(feeds.builder.topicError).toBeVisible();
    await expect(page.locator('.feed-builder')).toHaveScreenshot('feed-builder-invalid-light.png');
  });

  test('builder success', async ({ page }) => {
    const feeds = new CalendarFeedsPage(page);
    await feeds.open();
    await feeds.builder.choose(['AI', 'Azure']);
    await feeds.builder.create.click();
    await expect(feeds.ready).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(feeds.ready).toHaveScreenshot('calendar-feeds-success-light.png');
  });

  test('subscribe dialog default and success', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open();
    await events.getCalendarFeed.click();
    const dialog = new SubscribeFeedDialog(page);
    await dialog.builder.choose(['AI', 'Azure']);
    await expect(dialog.panel).toHaveScreenshot('subscribe-feed-default-light.png');
    await dialog.builder.create.click();
    await expect(dialog.ready).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(dialog.panel).toHaveScreenshot('subscribe-feed-success-light.png');
  });

  test('subscribe dialog busy and failed', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open();
    await events.getCalendarFeed.click();
    const dialog = new SubscribeFeedDialog(page);
    await dialog.builder.choose(['AI', 'Azure']);
    await failFeedCreation(page);
    await dialog.builder.create.click();
    await expect(dialog.failure).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(dialog.panel).toHaveScreenshot('subscribe-feed-failed-light.png');
  });
});
