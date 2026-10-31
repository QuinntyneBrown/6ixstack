import { expect, test } from '../fixtures';
import { CalendarPage } from '../pages/calendar.page';
import { EventsPage } from '../pages/events.page';
import { failCalendar, slowCalendar, stubCalendar } from '../support/stub-api';

// L2-025 grid, L2-026 navigation, L2-027 filters and states, L2-028 small screens; design: discovery/month-calendar.
test.describe('Month calendar', () => {
  test('November opens with today marked, the month totals and each day’s events in order', async ({
    page,
  }) => {
    const calendar = new CalendarPage(page);
    await calendar.open();

    await expect(calendar.heading).toHaveText('Calendar');
    await expect(calendar.subtitle).toHaveText('20 events this month · 15 in the GTA · 7 streamable');
    await expect(calendar.monthHeading).toHaveText('November 2026');
    await expect(calendar.day(2)).toHaveClass(/cal__day--today/);
    await expect(calendar.day(2)).toHaveAttribute('aria-label', 'November 2, today, no events');
    await expect(calendar.day(4)).toHaveAttribute('aria-label', 'November 4, 2 events');
    await expect(calendar.dayEvents(4)).toHaveText([
      'Azure AI Foundry: shipping agents to production',
      'Signals all the way down',
    ]);
    await expect(calendar.dayEvents(4).first()).toHaveAttribute(
      'href',
      '/events/azure-ai-foundry-shipping-agents',
    );
    await expect(calendar.legend).toHaveText(['AI', '.NET', 'Azure', 'Angular', 'React', 'AWS']);
  });

  test('a day with four events shows three and “+1 more”', async ({ page }) => {
    await stubCalendar(page, 'calendar-busy-day');
    const calendar = new CalendarPage(page);
    await calendar.open();

    await expect(calendar.dayEvents(5)).toHaveCount(3);
    await expect(calendar.dayMore(5)).toHaveText('+1 more');
    await expect(calendar.day(5)).toHaveAttribute('aria-label', 'November 5, 4 events');
  });

  test('next month, a month in the URL and Today', async ({ page }) => {
    const calendar = new CalendarPage(page);
    await calendar.open();

    await expect(calendar.nextMonth).toHaveAccessibleName('Next month, December 2026');
    await calendar.nextMonth.click();

    await calendar.waitForMonth('December 2026');
    await expect(page).toHaveURL(/month=2026-12/);
    await expect(calendar.monthHeading).toHaveAttribute('aria-live', 'polite');
    await expect(calendar.alert).toContainText('Nothing listed for December yet');
    await expect(calendar.alertAction('Submit an event')).toHaveAttribute('href', '/submit');
    await expect(calendar.subtitle).toHaveText('0 events this month');

    await calendar.today.click();
    await calendar.waitForMonth('November 2026');
  });

  test('a month in the URL opens that month', async ({ page }) => {
    const calendar = new CalendarPage(page);

    await calendar.open('?month=2026-12');

    await calendar.waitForMonth('December 2026');
    await expect(calendar.previousMonth).toHaveAccessibleName('Previous month, November 2026');
  });

  test('React in the GTA leaves two events and offers to include streaming', async ({ page }) => {
    const calendar = new CalendarPage(page);
    await calendar.open();

    await calendar.formatOption('In the GTA').click();
    await calendar.topicChip('React').click();

    await expect(calendar.subtitle).toHaveText('2 of 20 events this month match your filters');
    await expect(calendar.alert).toContainText('2 events match React in the GTA');
    await expect(calendar.alert).toContainText('Include streaming to see 1 more');
    await expect(calendar.dayEvents(9)).toHaveText(['Server Components, one year in']);
    await expect(calendar.dayEvents(26)).toHaveText(['Testing React in 2027']);

    await calendar.alertAction('Clear filters').click();
    await expect(calendar.subtitle).toHaveText('20 events this month · 15 in the GTA · 7 streamable');
  });

  test('List opens the events page with the same filters', async ({ page }) => {
    const calendar = new CalendarPage(page);
    await calendar.open('?format=gta&topics=react');
    await expect(calendar.monthView).toHaveAttribute('aria-pressed', 'true');

    await calendar.listView.click();

    await expect(page).toHaveURL(/\/\?format=gta&topics=react$/);
    await expect(new EventsPage(page).formatOption('In the GTA')).toHaveAttribute('aria-pressed', 'true');
  });

  test('a slow month shows skeleton chips in the grid', async ({ page }) => {
    await slowCalendar(page, 2_000);
    const calendar = new CalendarPage(page);
    await calendar.open();

    await expect(calendar.subtitle).toHaveText('Loading November…');
    await expect(calendar.grid).toHaveAttribute('aria-busy', 'true');
    await expect(calendar.skeletonChips()).toHaveCount(30);
    await expect(calendar.subtitle).toHaveText(/^20 events this month/, { timeout: 10_000 });
  });

  test('a failed month explains the empty days and Try again reloads', async ({ page }) => {
    const restore = await failCalendar(page);
    const calendar = new CalendarPage(page);
    await calendar.open();

    await expect(calendar.alert).toContainText('We couldn’t load November’s events');
    await expect(calendar.alert).toContainText(
      'The calendar is showing empty days because the request failed, not because nothing is on.',
    );
    await expect(calendar.subtitle).toHaveText('Events unavailable');
    await expect(calendar.monthHeading).toHaveText('November 2026');

    await restore();
    await calendar.alertAction('Try again').click();
    await expect(calendar.dayEvents(4)).toHaveCount(2);
  });

  test('on a phone, days show topic dots and tapping one lists its events', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    const calendar = new CalendarPage(page);
    await calendar.open();

    await expect(calendar.dayEvents(5).first()).toBeHidden();
    await expect(calendar.dayDots(5)).toHaveCount(2);

    await calendar.day(5).click();

    await expect(calendar.dayList).toContainText('Thursday, November 5');
    await expect(calendar.dayList.getByRole('link')).toHaveText([
      /Azure Data & AI Day GTA/,
      /Bedrock in the real world/,
    ]);
  });
});
