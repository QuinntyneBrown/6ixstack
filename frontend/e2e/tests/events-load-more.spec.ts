import { expect, test } from '../fixtures';
import { EventsPage } from '../pages/events.page';
import { stubEventPages } from '../support/stub-api';

// L2-009 incremental loading beyond the upcoming window; design: docs/detailed-designs/discovery/browse-events.
test.describe('Load more events', () => {
  test('states how many are shown, appends the next page under its days, and hides the button at the end', async ({
    page,
  }) => {
    const events = new EventsPage(page);
    await events.open();

    await expect(events.loadMoreCaption).toHaveText('Showing 14 of 19 events through November 26');

    await events.showMore.click();

    await expect(events.rows).toHaveCount(19);
    expect(await events.dayHeadingTexts()).toContain('Tuesday November 17');
    expect((await events.rowTitles()).slice(14)).toEqual([
      'Vector search in Postgres',
      'Minimal APIs in practice',
      'Angular Toronto: lightning talks',
      're:Invent keynote watch party',
      'Testing React in 2027',
    ]);
    await expect(events.showMore).toHaveCount(0);
  });

  test('focus stays on Show 20 more while there are more to load', async ({ page }) => {
    await stubEventPages(page, 'events-paged-1', 'events-paged-2');
    const events = new EventsPage(page);
    await events.open();

    await events.showMore.focus();
    await events.showMore.press('Enter');

    await expect(events.rows).toHaveCount(2);
    await expect(events.loadMoreCaption).toHaveText('Showing 2 of 3 events through December 31');
    await expect(events.showMore).toBeFocused();
  });
});
