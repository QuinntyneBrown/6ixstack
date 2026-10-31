import { expect, test } from '../fixtures';
import { EventsPage } from '../pages/events.page';
import { stubEvents } from '../support/stub-api';

// L2-007 hero headline and counts; design: docs/detailed-designs/discovery/browse-events.
test.describe('Events hero', () => {
  test('states the GTA and streamable counts for the next two weeks, whatever the filters', async ({
    page,
  }) => {
    const events = new EventsPage(page);
    await events.open();

    await expect(events.heroStat).toHaveText('9 in the GTA and 7 streamable over the next two weeks.');
    await events.toggleTopic('AI');
    await expect(events.rows).toHaveCount(6);
    await expect(events.heroStat).toHaveText('9 in the GTA and 7 streamable over the next two weeks.');
  });

  test('reads zero and zero when nothing is coming up', async ({ page }) => {
    await stubEvents(page, 'events-empty');
    const events = new EventsPage(page);
    await events.open();

    await expect(events.heroStat).toHaveText('0 in the GTA and 0 streamable over the next two weeks.');
  });
});
