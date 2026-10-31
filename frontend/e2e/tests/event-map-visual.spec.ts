import { expect, test } from '../fixtures';
import { EventMapPart } from '../pages/event-map.part';
import { EventsPage } from '../pages/events.page';
import { failMap } from '../support/stub-api';

// Visual parity with docs/mocks/pages/events hover, day-focus and partial; the map draws its still frame.
test.describe('Event map visuals', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('hover', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open();
    const map = new EventMapPart(page);
    await expect(map.dots).toHaveCount(9);
    await events.row("What's new in the .NET 11 previews").root.hover();
    await expect(map.tip).toBeVisible();
    await expect(map.root).toHaveScreenshot('event-map-hover.png');
  });

  test('day focus', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open();
    const map = new EventMapPart(page);
    await map.day('Thursday, November 5').click();
    await expect(map.title).toHaveText('Thursday, November 5');
    await page.mouse.move(0, 0);
    await expect(page).toHaveScreenshot('events-day-focus-light.png');
  });

  test('map failed', async ({ page }) => {
    await failMap(page);
    const events = new EventsPage(page);
    await events.open();
    const map = new EventMapPart(page);
    await expect(map.notice).toBeVisible();
    await expect(map.root).toHaveScreenshot('event-map-failed.png');
  });

  test('phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const events = new EventsPage(page);
    await events.open();
    const map = new EventMapPart(page);
    await expect(map.dots).toHaveCount(9);
    await expect(page).toHaveScreenshot('events-map-phone.png');
  });
});
