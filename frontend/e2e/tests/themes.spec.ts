import { expect, test } from '../fixtures';
import { EventsPage } from '../pages/events.page';
import { StatusPage } from '../pages/status.page';
import { contrastRatio } from '../support/contrast';

// L2-097 light and dark themes, L2-090 contrast; design: docs/detailed-designs/site/app-shell.
test.describe('Themes', () => {
  test('follows a light system preference', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    const events = new EventsPage(page);
    await events.open();

    const colours = await events.shell.pageColours();

    expect(colours.background).toBe('rgb(247, 246, 243)');
    expect(colours.text).toBe('rgb(17, 19, 24)');
  });

  test('follows a dark system preference with readable contrast', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    const events = new EventsPage(page);
    await events.open();

    const colours = await events.shell.pageColours();

    expect(colours.background).toBe('rgb(14, 15, 18)');
    expect(colours.text).toBe('rgb(243, 242, 238)');
    expect(contrastRatio(colours.text, colours.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colours.muted, colours.background)).toBeGreaterThanOrEqual(4.5);
  });

  test('the shell matches the design in dark theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    const events = new EventsPage(page);
    await events.open();

    await expect(events.shell.header).toHaveScreenshot('site-header-dark.png');
    await expect(events.shell.footer).toHaveScreenshot('site-footer-dark.png');
  });

  test('the not-found page matches the design in dark theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    const status = new StatusPage(page);
    await status.open('/no-such-page');

    await expect(page).toHaveScreenshot('not-found-dark.png', { fullPage: true });
  });

  test('the mobile menu matches the design in dark theme', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.emulateMedia({ colorScheme: 'dark' });
    const events = new EventsPage(page);
    await events.open();
    const menu = await events.shell.openMenu();

    await expect(menu.panel).toHaveScreenshot('mobile-menu-dark.png');
  });
});
