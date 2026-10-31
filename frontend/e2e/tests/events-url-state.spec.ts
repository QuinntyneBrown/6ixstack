import { expect, test } from '../fixtures';
import { EventsPage } from '../pages/events.page';
import { blockStorage } from '../support/storage';

// L2-005 shareable and remembered filters; design: docs/detailed-designs/discovery/browse-events.
test.describe('Shareable and remembered filters', () => {
  test('filters go into the URL, and the URL opens the same list in a new browser', async ({
    page,
    browser,
  }) => {
    const events = new EventsPage(page);
    await events.open();

    await events.toggleTopic('AI');
    await events.chooseFormat('In the GTA');
    await expect(events.rows).toHaveCount(4);

    const url = events.url();
    expect(url.searchParams.get('topics')).toBe('ai');
    expect(url.searchParams.get('format')).toBe('gta');

    const other = await browser.newContext();
    try {
      const shared = new EventsPage(await other.newPage());
      await shared.open(url.search);
      await expect(shared.rows).toHaveCount(4);
      await expect(shared.topicChip('AI')).toHaveAttribute('aria-pressed', 'true');
      await expect(shared.formatOption('In the GTA')).toHaveAttribute('aria-pressed', 'true');
    } finally {
      await other.close();
    }
  });

  test('coming back to / restores the last topic and format', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open();
    await events.toggleTopic('React');
    await events.chooseFormat('Streaming');
    await expect(events.rows).toHaveCount(1);

    await events.open();

    await expect(events.rows).toHaveCount(1);
    await expect(events.topicChip('React')).toHaveAttribute('aria-pressed', 'true');
    await expect(events.formatOption('Streaming')).toHaveAttribute('aria-pressed', 'true');
  });

  test('when storage is blocked, the first change explains it and filtering still works', async ({
    page,
  }) => {
    await blockStorage(page);
    const events = new EventsPage(page);
    await events.open();

    await events.toggleTopic('AI');

    await expect(events.rows).toHaveCount(6);
    await expect(events.toast("We can't remember your filters").locator('.toast__text')).toHaveText(
      'This browser blocks site storage, so your topics reset when you close the tab.',
    );
    await events.toggleTopic('React');
    await expect(events.toast("We can't remember your filters")).toHaveCount(1);
  });

  test('unknown values in the URL are ignored without an error', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open('?topics=cobol,ai&format=moon');

    await expect(events.rows).toHaveCount(6);
    await expect(events.topicChip('AI')).toHaveAttribute('aria-pressed', 'true');
    await expect(events.formatOption('All')).toHaveAttribute('aria-pressed', 'true');
    await expect(events.errorAlert).toHaveCount(0);
  });
});
