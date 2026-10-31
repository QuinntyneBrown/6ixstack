import { expect, test } from '../fixtures';
import { EventDetailPage } from '../pages/event-detail.page';
import { EventMapPart } from '../pages/event-map.part';
import { EventsPage } from '../pages/events.page';
import { failMap, slowMap } from '../support/stub-api';

const DOTNET = "What's new in the .NET 11 previews";

// L2-011 to L2-016; design: discovery/event-map. "Now" is Monday, November 2, 2026 in the e2e environment.
test.describe('Event map', () => {
  test('plots venue dots, hybrid rings and stream arcs with a summary', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open();
    const map = new EventMapPart(page);

    await expect(map.title).toHaveText('Where it’s happening');
    await expect(map.dots).toHaveCount(9);
    await expect(map.rings).toHaveCount(2);
    await expect(map.arcs).toHaveCount(5);
    await expect(map.subtitle).toHaveText('9 across the GTA · 5 streaming in');
    await expect(map.svg).toHaveAttribute('role', 'img');
  });

  test('the topic filter narrows the map to the events in the list', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open();
    const map = new EventMapPart(page);
    await expect(map.dots).toHaveCount(9);

    await events.toggleTopic('AI');

    await expect(map.subtitle).not.toHaveText('9 across the GTA · 5 streaming in');
    await expect(events.topicChips.filter({ hasText: 'AI' })).toHaveAttribute('aria-pressed', 'true');
    await expect(async () =>
      expect((await map.dots.count()) + (await map.arcs.count())).toBe(await events.rows.count()),
    ).toPass();
  });

  test('hovering a row lifts its dot and shows its card', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open();
    const map = new EventMapPart(page);

    await events.row(DOTNET).root.hover();

    await expect(map.marker('whats-new-in-dotnet-11-previews')).toHaveClass(/is-hot/);
    await expect(map.tip).toContainText(DOTNET.slice(0, 30));
  });

  test('clicking a dot centres its row and focuses it', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const events = new EventsPage(page);
    await events.open();
    const map = new EventMapPart(page);

    await map.clickMarker('whats-new-in-dotnet-11-previews');

    const title = events.row(DOTNET).title;
    await expect(title).toBeFocused();
    await expect(title).toBeInViewport();
  });

  test('picking a day focuses it on the map and dims the other days', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open();
    const map = new EventMapPart(page);

    await map.day('Thursday, November 5').click();

    await expect(map.title).toHaveText('Thursday, November 5');
    await expect(events.resultLine).toContainText('showing Thursday, November 5');
    await expect(events.dimmedDays.first()).toBeVisible();
    await expect(map.day('Thursday, November 5')).toHaveAttribute('aria-pressed', 'true');

    await map.day('Thursday, November 5').click();
    await expect(events.dimmedDays).toHaveCount(0);
    await map.day('Thursday, November 5').click();
    await map.showAllDates.click();
    await expect(events.dimmedDays).toHaveCount(0);
    await expect(map.title).toHaveText('Where it’s happening');
  });

  test('days without events are disabled', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open();
    const map = new EventMapPart(page);

    await expect(map.days).toHaveCount(14);
    await expect(map.disabledDays.first()).toBeVisible();
  });

  test('below 1024 px picking a day does not scroll the list', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 900 });
    const events = new EventsPage(page);
    await events.open();
    const map = new EventMapPart(page);
    await map.day('Thursday, November 5').scrollIntoViewIfNeeded();
    const before = await page.evaluate(() => window.scrollY);

    await map.day('Thursday, November 5').click();

    await expect(events.resultLine).toContainText('showing Thursday, November 5');
    expect(await page.evaluate(() => window.scrollY)).toBe(before);
  });

  test('Play steps through the days with events, Pause stops, and it ends on the last day', async ({
    page,
  }) => {
    test.slow();
    const events = new EventsPage(page);
    await events.open();
    const map = new EventMapPart(page);
    await expect(map.dots).toHaveCount(9);

    await map.play.click();
    await expect(map.play).toHaveText('Pause');
    await expect(events.resultLine).toContainText('playing: Tuesday, November 3');
    await expect(map.title).toHaveText('Wednesday, November 4', { timeout: 3_000 });
    await expect(events.resultLine).toContainText('playing: Wednesday, November 4');

    await map.play.click();
    await expect(map.play).toHaveText('Play the next two weeks');
    const paused = (await map.title.innerText()).trim();
    await page.waitForTimeout(2_500);
    await expect(map.title).toHaveText(paused);

    await map.play.click();
    await expect(map.play).toHaveText('Pause');
    await expect(map.play).toHaveText('Play the next two weeks', { timeout: 30_000 });
    await expect(map.pressedDay).toHaveAttribute('aria-label', /^Friday, November 13:/);
  });

  test('picking a day while playing stops playback on that day', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open();
    const map = new EventMapPart(page);
    await expect(map.dots).toHaveCount(9);

    await map.play.click();
    await map.day('Thursday, November 5').click();

    await expect(map.play).toHaveText('Play the next two weeks');
    await page.waitForTimeout(2_500);
    await expect(map.title).toHaveText('Thursday, November 5');
  });

  test('a map failure leaves the list whole and offers Try again', async ({ page }) => {
    const restore = await failMap(page);
    const events = new EventsPage(page);
    await events.open();
    const map = new EventMapPart(page);

    await expect(map.notice).toContainText("The map didn't load. The list has every event.");
    await expect(events.rows.first()).toBeVisible();
    await restore();
    await map.notice.getByRole('button', { name: 'Try again' }).click();
    await expect(map.dots).toHaveCount(9);
  });

  test('while plotting, the map keeps its size and says so', async ({ page }) => {
    await slowMap(page, 2_000);
    const events = new EventsPage(page);
    await events.open();
    const map = new EventMapPart(page);

    await expect(map.notice).toContainText('Plotting events…');
    await expect(map.root).toHaveAttribute('aria-busy', 'true');
    await expect(map.dots).toHaveCount(9, { timeout: 10_000 });
  });

  test('the map sticks beside the list on desktop and sits above it on phones', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open();
    const map = new EventMapPart(page);
    await page.mouse.wheel(0, 1200);
    await expect(map.root).toBeInViewport();
    const mapBox = (await map.column.boundingBox())!;
    const listBox = (await events.dayHeadings.first().boundingBox())!;
    expect(mapBox.x).toBeGreaterThan(listBox.x);

    await page.setViewportSize({ width: 360, height: 800 });
    await page.mouse.wheel(0, -5000);
    const phoneMap = (await map.column.boundingBox())!;
    const phoneList = (await events.dayHeadings.first().boundingBox())!;
    expect(phoneMap.y).toBeLessThan(phoneList.y);
    expect(Math.round(phoneMap.width)).toBeGreaterThan(300);
  });

  test('an event page shows its venue on a small map', async ({ page }) => {
    const detail = new EventDetailPage(page);
    await detail.open('azure-data-ai-day-gta');

    await expect(detail.venueMapTitle).toHaveText('Living Arts Centre, Mississauga');
    await expect(detail.venueMapDots).toHaveCount(1);
    await expect(detail.venueMapDays).toHaveCount(0);
  });
});
