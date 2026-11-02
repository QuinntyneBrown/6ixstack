import { expect, test } from '../fixtures';
import { EventsPage } from '../pages/events.page';
import { failEvents, slowEvents, stubEvents } from '../support/stub-api';

// L2-130: listings saved for the visit show at once, refresh quietly, and survive a failed refresh.
test.describe('Saved event listings', () => {
  test('going back to the list shows it at once, with no skeleton, while the API is slow', async ({
    page,
  }) => {
    const events = new EventsPage(page);
    await events.open();
    await expect(events.rows).toHaveCount(14);
    await events.goToCalendar();
    await slowEvents(page, 4_000);

    await events.goBack();

    await expect(events.rows).toHaveCount(14, { timeout: 1_000 });
    await expect(events.rowSkeletons).toHaveCount(0);
  });

  test('choosing a topic again shows its list at once and refreshes it in the background', async ({
    page,
  }) => {
    const events = new EventsPage(page);
    await events.open();
    await events.toggleTopic('AI');
    await expect(events.rows).toHaveCount(6);
    await events.toggleTopic('AI');
    await expect(events.rows).toHaveCount(14);
    await slowEvents(page, 4_000);
    const refreshed = events.nextListResponse();

    await events.toggleTopic('AI');

    await expect(events.rows).toHaveCount(6, { timeout: 1_000 });
    await expect(events.rowSkeletons).toHaveCount(0);
    await refreshed;
    await expect(events.rows).toHaveCount(6);
  });

  test('a refresh that brings a changed list replaces the saved rows in place', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open();
    await expect(events.rows).toHaveCount(14);
    await events.goToCalendar();
    await stubEvents(page, 'events-paged-1');

    await events.goBack();

    await expect.poll(() => events.rowTitles()).toEqual(['First meetup']);
  });

  test('a refresh that fails keeps the saved list and shows no inline error', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open();
    await expect(events.rows).toHaveCount(14);
    await events.goToCalendar();
    await failEvents(page);
    const refreshed = events.nextListResponse();

    await events.goBack();
    await refreshed;

    await expect(events.rows).toHaveCount(14);
    await expect(events.errorAlert).toHaveCount(0);
  });
});
