import { expect, test } from '../fixtures';
import { EventDetailPage } from '../pages/event-detail.page';
import { ShareEventDialog } from '../pages/share-event.dialog';
import { blockCopying } from '../support/clipboard';

const SLUG = 'azure-data-ai-day-gta';

// L2-038 share an event; design: feeds-and-sharing/share-event.
test.describe('Share an event', () => {
  test('Share opens the dialog with the short link, Copy focused, and the share options', async ({
    page,
    baseURL,
  }) => {
    const detail = new EventDetailPage(page);
    await detail.open(SLUG);

    await detail.share.click();

    const dialog = new ShareEventDialog(page);
    const link = `${new URL(baseURL!).origin}/e/${SLUG}`;
    await expect(dialog.summary).toHaveText(
      'Azure Data & AI Day GTA · Thu, Nov 5, 9:00 AM – 5:00 PM ET · Living Arts Centre',
    );
    await expect(dialog.link).toHaveValue(link);
    await expect(dialog.copy).toBeFocused();
    await expect(dialog.option('LinkedIn')).toHaveAttribute(
      'href',
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`,
    );
    await expect(dialog.option('LinkedIn')).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(dialog.option('Bluesky')).toHaveAttribute(
      'href',
      `https://bsky.app/intent/compose?text=${encodeURIComponent(link)}`,
    );
    await expect(dialog.option('Email')).toHaveAttribute(
      'href',
      `mailto:?subject=${encodeURIComponent('Azure Data & AI Day GTA')}&body=${encodeURIComponent(link)}`,
    );
  });

  test('Copy says Copied for two seconds, politely, with no toast', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const detail = new EventDetailPage(page);
    await detail.open(SLUG);
    await detail.share.click();
    const dialog = new ShareEventDialog(page);

    await dialog.copy.click();

    await expect(dialog.copy).toHaveText('Copied');
    await expect(dialog.copy).toHaveAttribute('aria-live', 'polite');
    await expect(page.locator('.toast')).toHaveCount(0);
    expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/\/e\/azure-data-ai-day-gta$/);
    await page.clock.runFor(2_100);
    await expect(dialog.copy).toHaveText('Copy');
  });

  test('a failed copy raises the danger toast with Try again', async ({ page }) => {
    await blockCopying(page);
    const detail = new EventDetailPage(page);
    await detail.open(SLUG);
    await detail.share.click();
    const dialog = new ShareEventDialog(page);

    await dialog.copy.click();

    await expect(dialog.toast('Couldn’t copy the link')).toBeVisible();
    await expect(
      dialog.toast('Couldn’t copy the link').getByRole('button', { name: 'Try again' }),
    ).toBeVisible();
  });

  test('on a phone with Web Share, Share opens the system sheet with the title and short link', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      (window as unknown as { shared: unknown[] }).shared = [];
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: (data: unknown) => {
          (window as unknown as { shared: unknown[] }).shared.push(data);
          return Promise.resolve();
        },
      });
    });
    const detail = new EventDetailPage(page);
    await detail.open(SLUG);

    await detail.share.click();

    const shared = await page.evaluate(
      () => (window as unknown as { shared: { title: string; url: string }[] }).shared,
    );
    expect(shared).toHaveLength(1);
    expect(shared[0].title).toBe('Azure Data & AI Day GTA');
    expect(shared[0].url).toMatch(/\/e\/azure-data-ai-day-gta$/);
    await expect(new ShareEventDialog(page).panel).toHaveCount(0);
  });

  test('the short link redirects to the event page', async ({ request }) => {
    const response = await request.get(`/e/${SLUG}`, { maxRedirects: 0 });

    expect(response.status()).toBe(301);
    expect(response.headers()['location']).toBe(`/events/${SLUG}`);
  });
});
