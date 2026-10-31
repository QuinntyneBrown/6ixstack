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
});
