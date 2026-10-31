import { expect, test } from '../fixtures';
import { StatusPage } from '../pages/status.page';

// L2-076 status pages; design: docs/detailed-designs/site/status-pages.
test.describe('Status pages', () => {
  test('an unknown address shows the not-found page inside the shell', async ({ page }) => {
    const status = new StatusPage(page);
    await status.open('/no-such-page');

    await expect(status.heading).toHaveText("We can't find that page");
    await expect(status.message).toHaveText(
      "The event may have been removed by its organizer, or the link has a typo. Search for it or browse what's on.",
    );
    await expect(status.code).toHaveAttribute('aria-hidden', 'true');
    await expect(status.action('Browse events')).toHaveAttribute('href', '/');
    await expect(status.action('Open the calendar')).toHaveAttribute('href', '/calendar');
    await expect(status.shell.header).toBeVisible();
    expect(status.url()).toBe('/no-such-page');
    expect(await status.title()).toBe('Page not found · 6ixstack');
  });

  test('Browse events leads back to the events page', async ({ page }) => {
    const status = new StatusPage(page);
    await status.open('/no-such-page');

    await status.action('Browse events').click();

    await expect(page).toHaveURL('/');
  });

  test('the not-found page matches the design', async ({ page }) => {
    const status = new StatusPage(page);
    await status.open('/no-such-page');

    await expect(page).toHaveScreenshot('not-found-light.png', { fullPage: true });
  });
});
