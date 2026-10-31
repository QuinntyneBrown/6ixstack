import { expect, test } from '../fixtures';
import { CalendarPage } from '../pages/calendar.page';
import { failCalendar, slowCalendar } from '../support/stub-api';

// Visual parity with docs/mocks/pages/calendar.
test.describe('Calendar visuals', () => {
  test('default', async ({ page }) => {
    const calendar = new CalendarPage(page);
    await calendar.open();
    await expect(calendar.dayEvents(4)).toHaveCount(2);
    await expect(page).toHaveScreenshot('calendar-default-light.png', { fullPage: true });
  });

  test('no results', async ({ page }) => {
    const calendar = new CalendarPage(page);
    await calendar.open('?format=gta&topics=react');
    await expect(calendar.alert).toBeVisible();
    await expect(page).toHaveScreenshot('calendar-no-results-light.png', { fullPage: true });
  });

  test('empty', async ({ page }) => {
    const calendar = new CalendarPage(page);
    await calendar.open('?month=2026-12');
    await expect(calendar.alert).toBeVisible();
    await expect(page).toHaveScreenshot('calendar-empty-light.png', { fullPage: true });
  });

  test('error', async ({ page }) => {
    await failCalendar(page);
    const calendar = new CalendarPage(page);
    await calendar.open();
    await expect(calendar.alert).toBeVisible();
    await expect(page).toHaveScreenshot('calendar-error-light.png', { fullPage: true });
  });

  test('loading', async ({ page }) => {
    await slowCalendar(page, 5_000);
    const calendar = new CalendarPage(page);
    await calendar.open();
    await expect(calendar.skeletonChips()).toHaveCount(30);
    await expect(page).toHaveScreenshot('calendar-loading-light.png', { fullPage: true });
  });

  test('dark theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    const calendar = new CalendarPage(page);
    await calendar.open();
    await expect(calendar.dayEvents(4)).toHaveCount(2);
    await expect(page).toHaveScreenshot('calendar-default-dark.png', { fullPage: true });
  });

  test('phone with a day picked', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    const calendar = new CalendarPage(page);
    await calendar.open();
    await expect(calendar.dayDots(5)).toHaveCount(2);
    await calendar.day(5).click();
    await expect(calendar.dayList).toBeVisible();
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await expect(page).toHaveScreenshot('calendar-day-list-phone.png', { fullPage: true });
  });
});
