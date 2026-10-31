import { expect, test } from '../fixtures';
import { CalendarFeedsPage } from '../pages/calendar-feeds.page';
import { failFeedCounts, slowFeedCounts } from '../support/stub-api';

// L2-034 ready-made feeds and L2-036 feed content; designs: feeds-and-sharing/ready-made-feeds, serve-calendar-feed.
test.describe('Ready-made calendar feeds', () => {
  test('lists the six feeds with what they hold in the next two weeks', async ({ page }) => {
    const feeds = new CalendarFeedsPage(page);
    await feeds.open();

    await expect(feeds.heading).toHaveText('Calendar feeds');
    await expect(feeds.feeds.locator('.list__title')).toHaveText([
      'Everything',
      'In the GTA',
      'Streaming',
      'AI',
      '.NET',
      'Azure',
    ]);
    await expect(feeds.meta('In the GTA')).toHaveText(
      'In-person and hybrid events only · 9 in the next two weeks',
    );
    await expect(feeds.meta('Everything')).toHaveText(
      'All GTA and streaming events · 14 in the next two weeks',
    );
    await expect(feeds.copy('AI')).toBeVisible();
  });

  test('copying a feed puts its webcal link on the clipboard and says how to subscribe', async ({
    page,
    context,
    baseURL,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const feeds = new CalendarFeedsPage(page);
    await feeds.open();

    await feeds.copy('AI').click();

    await expect(feeds.toast('Feed link copied')).toContainText(
      'Paste it into Google Calendar, Outlook or Apple Calendar.',
    );
    expect(await feeds.clipboardText()).toBe(`webcal://${new URL(baseURL!).host}/feeds/ai-gta-stream.ics`);
    await feeds.toastAction('Feed link copied', 'How to subscribe').click();
    await expect(feeds.howItWorks).toBeFocused();
  });

  test('a failed copy says so, offers Try again and stays', async ({ page }) => {
    const feeds = new CalendarFeedsPage(page);
    await feeds.blockCopying();
    await feeds.open();

    await feeds.copy('AI').click();

    const toast = feeds.toast('Couldn’t copy the link');
    await expect(toast).toBeVisible();
    await expect(feeds.toastAction('Couldn’t copy the link', 'Try again')).toBeVisible();
    await page.clock.runFor(10_000);
    await expect(toast).toBeVisible();
  });

  test('while counts load the feeds can already be copied', async ({ page }) => {
    await slowFeedCounts(page, 3_000);
    const feeds = new CalendarFeedsPage(page);
    await feeds.open();

    await expect(feeds.countSkeletons).toHaveCount(6);
    await expect(feeds.copy('Everything')).toBeEnabled();
    await expect(feeds.meta('Everything')).toHaveText(/14 in the next two weeks/, { timeout: 10_000 });
  });

  test('if the counts fail, Try again loads them', async ({ page }) => {
    const restore = await failFeedCounts(page);
    const feeds = new CalendarFeedsPage(page);
    await feeds.open();

    await expect(feeds.failure).toBeVisible();
    await restore();
    await feeds.failure.getByRole('button', { name: 'Try again' }).click();
    await expect(feeds.meta('In the GTA')).toHaveText(
      'In-person and hybrid events only · 9 in the next two weeks',
    );
  });

  test('the feed link serves the events as iCalendar', async ({ request }) => {
    const response = await request.get('/feeds/ai-gta-stream.ics');

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('text/calendar; charset=utf-8');
    const body = await response.text();
    expect(body).toContain('BEGIN:VCALENDAR');
    expect(body).toContain('SUMMARY:Vector search in Postgres');
  });
});
