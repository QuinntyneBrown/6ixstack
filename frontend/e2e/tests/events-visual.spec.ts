import { expect, test } from '../fixtures';
import { EventsPage } from '../pages/events.page';
import { failEvents, stubEvents } from '../support/stub-api';

// Visual parity with docs/mocks/pages/events (the featured card arrives with journey 17). The map draws its
// reduced-motion still frame, so screenshots are stable.
test.describe('Events page visuals', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('default', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open();
    await expect(page).toHaveScreenshot('events-default-light.png');
  });

  test('filtered by a topic', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open('?topics=ai');
    await expect(events.rows).toHaveCount(6);
    await expect(page).toHaveScreenshot('events-filtered-light.png');
  });

  test('no results', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open('?format=gta&q=Kubernetes');
    await expect(events.emptyTitle()).toBeVisible();
    await expect(page).toHaveScreenshot('events-no-results-light.png');
  });

  test('empty', async ({ page }) => {
    await stubEvents(page, 'events-empty');
    const events = new EventsPage(page);
    await events.open();
    await expect(page).toHaveScreenshot('events-empty-light.png');
  });

  test('error', async ({ page }) => {
    await failEvents(page);
    const events = new EventsPage(page);
    await events.open();
    await expect(events.errorAlert).toBeVisible();
    await expect(page).toHaveScreenshot('events-error-light.png');
  });

  test('long list with Show 20 more', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open();
    await expect(events.loadMore).toHaveScreenshot('events-long-light.png');
  });

  test('dark theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    const events = new EventsPage(page);
    await events.open();
    await expect(page).toHaveScreenshot('events-default-dark.png');
  });

  test('phone width', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    const events = new EventsPage(page);
    await events.open();
    await expect(page).toHaveScreenshot('events-default-phone.png');
    expect(await events.hasHorizontalScroll()).toBe(false);
  });
});
