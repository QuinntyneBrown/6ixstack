import { expect, test } from '../fixtures';
import { EventsPage } from '../pages/events.page';
import { failEvents, slowEvents, stubEvents } from '../support/stub-api';

// L2-008 states, L2-004 AC3 no results, L2-007 AC3, L2-002 AC4, L2-077 inline failures.
test.describe('Events states', () => {
  test('a slow load shows skeletons and "Loading events…"', async ({ page }) => {
    await slowEvents(page, 2_000);
    const events = new EventsPage(page);
    await events.startOpening();

    await expect(events.resultLine).toHaveText('Loading events…');
    await expect(events.rowSkeletons.first()).toBeVisible();
    expect(await events.formatCount('All')).toBe('–');

    await expect(events.rows).toHaveCount(14, { timeout: 10_000 });
    await expect(events.rowSkeletons).toHaveCount(0);
  });

  test('with nothing coming up, the empty state offers to submit or browse the calendar', async ({
    page,
  }) => {
    await stubEvents(page, 'events-empty');
    const events = new EventsPage(page);
    await events.open();

    await expect(events.emptyTitle()).toHaveText('No events in the next two weeks');
    await expect(events.emptyAction('Submit an event')).toHaveAttribute('href', '/submit');
    await expect(events.emptyAction('Browse the calendar')).toHaveAttribute('href', '/calendar');
  });

  test('a search with no match shows the no-results state and keeps the filters', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open();
    await events.chooseFormat('In the GTA');

    await events.searchFor('Kubernetes');

    await expect(events.emptyTitle()).toHaveText('No events match those filters');
    await expect(events.emptyText()).toHaveText('Try another topic, or include streaming events.');
    await expect(events.emptyAction('Get a feed for Kubernetes')).toHaveAttribute(
      'href',
      '/feeds?q=Kubernetes',
    );
    await expect(events.heroStat).toHaveText('No matches for “Kubernetes” in the next two weeks.');
    await expect(events.resultLine).toContainText('0 events · times in ET');
    await expect(events.search).toHaveValue('Kubernetes');
    await expect(events.formatOption('In the GTA')).toHaveAttribute('aria-pressed', 'true');

    await events.emptyAction('Clear filters').click();
    await expect(events.rows).toHaveCount(14);
  });

  test('a failed load keeps the filters, explains it, and Try again reloads the list', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open();
    await events.toggleTopic('AI');
    await expect(events.rows).toHaveCount(6);
    const recover = await failEvents(page);

    await events.searchFor('azure');

    await expect(events.errorAlert).toContainText(
      "6ixstack didn't respond in time. Your filters are kept; try again in a moment.",
    );
    await expect(events.errorAction('Use a calendar feed instead')).toHaveAttribute('href', '/feeds');
    await expect(events.heroStat).toHaveText('Event counts are unavailable right now.');
    expect(await events.formatCount('All')).toBe('–');
    await expect(events.search).toHaveValue('azure');
    await expect(events.topicChip('AI')).toHaveAttribute('aria-pressed', 'true');
    await expect(events.errorAlert).not.toContainText('7F3A');

    await recover();
    await events.errorAction('Try again').click();

    await expect(events.errorAlert).toHaveCount(0);
    await expect(events.rows).toHaveCount(2);
  });
});
