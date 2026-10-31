import { expect, test } from '../fixtures';
import { EventsPage } from '../pages/events.page';

// L2-096 mobile menu, L2-091 focus handling; design: docs/detailed-designs/site/app-shell.
test.describe('Mobile menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
  });

  test('lists every destination and marks the current page', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open();

    const menu = await events.shell.openMenu();

    await expect(menu.title).toBeVisible();
    expect(await menu.linkNames()).toEqual([
      'Events',
      'Calendar',
      'Communities',
      'Speakers',
      'Calendar feeds',
      'Organizer sign in',
      'Submit event',
    ]);
    await expect(menu.link('Events')).toHaveAttribute('aria-current', 'page');
    await expect(menu.link('Calendar')).not.toHaveAttribute('aria-current', /.*/);
    await expect(events.shell.menuButtonBehindModal).toHaveAttribute('aria-expanded', 'true');
  });

  test('Escape closes the menu and returns focus to the menu button', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open();
    const menu = await events.shell.openMenu();

    await menu.pressEscape();

    await expect(menu.dialog).toBeHidden();
    await expect(events.shell.menuButton).toBeFocused();
    await expect(events.shell.menuButton).toHaveAttribute('aria-expanded', 'false');
  });

  test('focus stays inside the open menu', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open();
    const menu = await events.shell.openMenu();

    expect(await menu.focusStaysInsideWhileTabbing(12)).toBe(true);
  });

  test('activating a link opens that page and closes the menu', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open();
    const menu = await events.shell.openMenu();

    await menu.link('Calendar').click();

    await expect(page).toHaveURL('/calendar');
    await expect(menu.dialog).toBeHidden();
  });

  test('widening past 992 px closes the menu', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open();
    const menu = await events.shell.openMenu();

    await page.setViewportSize({ width: 1024, height: 740 });

    await expect(menu.dialog).toBeHidden();
  });

  test('matches the design as a bottom sheet', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open();
    const menu = await events.shell.openMenu();

    await expect(menu.panel).toHaveScreenshot('mobile-menu-light.png');
  });
});
