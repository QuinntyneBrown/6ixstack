import { readFile } from 'node:fs/promises';
import { expect, test } from '../fixtures';
import { AddToCalendarDialog } from '../pages/add-to-calendar.dialog';
import { EventDetailPage } from '../pages/event-detail.page';
import { EventsPage } from '../pages/events.page';
import { stubEventDetail } from '../support/stub-api';

// L2-037 add an event to a personal calendar; design: docs/detailed-designs/feeds-and-sharing/add-to-calendar.
test.describe('Add to my calendar', () => {
  test('opens with the event summary and four options', async ({ page }) => {
    const detail = new EventDetailPage(page);
    await detail.open('azure-data-ai-day-gta');

    const dialog = await detail.openAddToCalendar();

    await expect(dialog.description).toHaveText(
      'Azure Data & AI Day GTA · Thu, Nov 5, 9:00 AM – 5:00 PM ET · Living Arts Centre',
    );
    expect(await dialog.optionNames()).toEqual([
      'Google Calendar',
      'Outlook',
      'Apple Calendar',
      'Other app (.ics file)',
    ]);
  });

  test('Google Calendar and Outlook open prefilled pages in a new tab', async ({ page }) => {
    const detail = new EventDetailPage(page);
    await detail.open('azure-data-ai-day-gta');
    const dialog = await detail.openAddToCalendar();

    const google = new URL((await dialog.option('Google Calendar').getAttribute('href'))!);
    expect(google.origin + google.pathname).toBe('https://calendar.google.com/calendar/render');
    expect(google.searchParams.get('action')).toBe('TEMPLATE');
    expect(google.searchParams.get('text')).toBe('Azure Data & AI Day GTA');
    expect(google.searchParams.get('dates')).toBe('20261105T140000Z/20261105T220000Z');
    expect(google.searchParams.get('ctz')).toBe('America/Toronto');
    expect(google.searchParams.get('location')).toBe('Living Arts Centre, 4141 Living Arts Dr, Mississauga');
    expect(google.searchParams.get('details')).toContain('https://6ixstack.dev/events/azure-data-ai-day-gta');
    await expect(dialog.option('Google Calendar')).toHaveAttribute('target', '_blank');
    await expect(dialog.option('Google Calendar')).toHaveAttribute('rel', 'noopener noreferrer');

    const outlook = new URL((await dialog.option('Outlook').getAttribute('href'))!);
    expect(outlook.origin + outlook.pathname).toBe('https://outlook.live.com/calendar/0/deeplink/compose');
    expect(outlook.searchParams.get('subject')).toBe('Azure Data & AI Day GTA');
    expect(outlook.searchParams.get('startdt')).toBe('2026-11-05T14:00:00Z');
    expect(outlook.searchParams.get('enddt')).toBe('2026-11-05T22:00:00Z');
  });

  test('Apple Calendar downloads the .ics file and confirms it', async ({ page }) => {
    const detail = new EventDetailPage(page);
    await detail.open('azure-data-ai-day-gta');
    const dialog = await detail.openAddToCalendar();

    const file = await dialog.download('Apple Calendar');

    expect(file.suggestedFilename()).toBe('azure-data-ai-day-gta.ics');
    const content = await readFile((await file.path())!, 'utf8');
    expect(content).toContain('DTSTART;TZID=America/Toronto:20261105T090000');
    const events = new EventsPage(page);
    await expect(events.toast('Calendar file downloaded')).toBeVisible();
    await expect(dialog.dialog).toBeHidden();
  });

  test('Escape closes it and returns focus to Add to my calendar', async ({ page }) => {
    const detail = new EventDetailPage(page);
    await detail.open('azure-data-ai-day-gta');
    const dialog = await detail.openAddToCalendar();

    await dialog.pressEscape();

    await expect(dialog.dialog).toBeHidden();
    await expect(detail.action('Add to my calendar')).toBeFocused();
  });

  test('Update my calendar on a time change opens the same dialog', async ({ page }) => {
    await stubEventDetail(page, 'azure-data-ai-day-gta', 'event-detail-alerts');
    const detail = new EventDetailPage(page);
    await detail.open('azure-data-ai-day-gta');

    await detail.alertAction('Start time changed to 9:30 AM', 'Update my calendar').click();

    await expect(new AddToCalendarDialog(page).dialog).toBeVisible();
  });
});
