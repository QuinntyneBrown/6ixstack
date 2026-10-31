import { expect, test } from '../fixtures';
import { EventsPage } from '../pages/events.page';

// L2-002 format switch, L2-003 topics, L2-004 search; design: docs/detailed-designs/discovery/browse-events.
test.describe('Events filters', () => {
  test('the format switch shows live counts with All pressed', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open();

    expect(await events.formatCount('All')).toBe('14');
    expect(await events.formatCount('In the GTA')).toBe('9');
    expect(await events.formatCount('Streaming')).toBe('7');
    await expect(events.formatOption('All')).toHaveAttribute('aria-pressed', 'true');
  });

  test('In the GTA keeps only in-person and hybrid events and keeps the counts', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open();

    await events.chooseFormat('In the GTA');

    await expect(events.rows).toHaveCount(9);
    await expect(events.formatOption('In the GTA')).toHaveAttribute('aria-pressed', 'true');
    await expect(events.formatOption('All')).toHaveAttribute('aria-pressed', 'false');
    await expect(events.row('Azure AI Foundry: shipping agents to production').root).toHaveCount(0);
    await expect(events.row('Azure Data & AI Day GTA').root).toHaveCount(1);
    expect(await events.formatCount('All')).toBe('14');
  });

  test('a topic chip narrows the list and the counts', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open();

    await events.toggleTopic('AI');

    await expect(events.rows).toHaveCount(6);
    await expect(events.resultLine).toHaveText('6 events about AI · times in ET · Clear filters');
    await expect(events.topicChip('AI')).toHaveAttribute('aria-pressed', 'true');
    expect([
      await events.formatCount('All'),
      await events.formatCount('In the GTA'),
      await events.formatCount('Streaming'),
    ]).toEqual(['6', '4', '3']);
  });

  test('several topics show events tagged with any of them', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open();

    await events.toggleTopic('AI');
    await events.toggleTopic('React');

    await expect(events.rows).toHaveCount(8);
    await expect(events.resultLine).toHaveText('8 events about AI or React · times in ET · Clear filters');
  });

  test('Clear filters resets everything, and Undo in its toast restores them', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open();
    await events.toggleTopic('AI');
    await events.chooseFormat('In the GTA');
    await expect(events.rows).toHaveCount(4);

    await events.clearFilters().click();

    await expect(events.rows).toHaveCount(14);
    await expect(events.topicChip('AI')).toHaveAttribute('aria-pressed', 'false');
    await expect(events.toast('Filters cleared').locator('.toast__text')).toHaveText(
      'Showing all 14 events.',
    );

    await events.toastAction('Filters cleared', 'Undo').click();

    await expect(events.rows).toHaveCount(4);
    await expect(events.topicChip('AI')).toHaveAttribute('aria-pressed', 'true');
    await expect(events.formatOption('In the GTA')).toHaveAttribute('aria-pressed', 'true');
  });

  test('search matches titles and places case-insensitively', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open();

    await events.searchFor('signals');
    await expect(events.rows).toHaveCount(1);
    await expect(events.row('Signals all the way down').root).toBeVisible();

    await events.searchFor('markham');
    await expect(events.row('GTA AI Builders Hackathon').root).toBeVisible();
  });

  test('a search longer than 100 characters is sent truncated', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open();

    const sent = await events.searchAndCaptureQuery('x'.repeat(130));

    expect(sent).toHaveLength(100);
  });
});
