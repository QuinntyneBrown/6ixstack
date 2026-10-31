import { expect, test } from '../fixtures';
import { EventsPage } from '../pages/events.page';
import { stubEvents } from '../support/stub-api';

// L2-001 upcoming list grouped by day, L2-010 rows; design: docs/detailed-designs/discovery/browse-events.
test.describe('Events list', () => {
  test('lists the upcoming window under day headings with a result line', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open();

    await expect(events.rows).toHaveCount(14);
    await expect(events.resultLine).toHaveText('14 events · times in ET');
    expect((await events.dayHeadingTexts()).slice(0, 3)).toEqual([
      'Tuesday November 3',
      'Wednesday November 4',
      'Thursday November 5',
    ]);
    expect((await events.rowTitles()).slice(0, 3)).toEqual([
      "What's new in the .NET 11 previews",
      'Azure AI Foundry: shipping agents to production',
      'Signals all the way down',
    ]);
  });

  test('a row shows time, linked title, organizer, location, topics, price and going count', async ({
    page,
  }) => {
    const events = new EventsPage(page);
    await events.open();

    const hybrid = events.row('Azure Data & AI Day GTA');
    await expect(hybrid.time).toHaveText('9:00 AM');
    await expect(hybrid.title).toHaveAttribute('href', '/events/azure-data-ai-day-gta');
    await expect(hybrid.organizer).toHaveText('GTA Azure Community');
    await expect(hybrid.location).toHaveText('Living Arts Centre, Mississauga');
    await expect(hybrid.stream).toHaveText('+ stream');
    await expect(hybrid.topics).toHaveText(['AI', 'Azure']);
    await expect(hybrid.price).toHaveText('$49');
    await expect(hybrid.going).toHaveAttribute('aria-label', '318 going');

    const stream = events.row('Azure AI Foundry: shipping agents to production');
    await expect(stream.sourceTime).toHaveText('9:00 AM PT');
    await expect(stream.location).toHaveText('Streaming online');
    await expect(stream.going).toHaveText('2,310');
  });

  test('a sold-out event reads Sold out with a Waitlist open badge, and long content wraps at 360 px', async ({
    page,
  }) => {
    await stubEvents(page, 'events-edge');
    await page.setViewportSize({ width: 360, height: 740 });
    const events = new EventsPage(page);
    await events.open();

    const row = events.row(
      'An extraordinarily long community event title that keeps going well past what anyone would reasonably type, to prove that rows wrap cleanly on small phones too',
    );
    await expect(row.price).toHaveText('Sold out');
    await expect(row.badge('Waitlist open')).toBeVisible();
    await expect(row.topics).toHaveCount(6);
    await expect(row.going).toHaveAttribute('aria-label', '12,480 going');
    expect(await events.hasHorizontalScroll()).toBe(false);
  });
});
