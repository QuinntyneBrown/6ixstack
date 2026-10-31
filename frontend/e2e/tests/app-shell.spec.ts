import { expect, test } from '../fixtures';
import { EventsPage } from '../pages/events.page';

// L2-095 responsive layout, L2-091 skip link; design: docs/detailed-designs/site/app-shell.
test.describe('App shell', () => {
  test('header shows the brand, primary navigation with the current page, and Submit event', async ({
    page,
  }) => {
    const events = new EventsPage(page);
    await events.open();

    await expect(events.shell.brand).toBeVisible();
    expect(await events.shell.primaryLinkNames()).toEqual(['Events', 'Calendar', 'Communities', 'Speakers']);
    await expect(events.shell.primaryLink('Events')).toHaveAttribute('aria-current', 'page');
    await expect(events.shell.primaryLink('Calendar')).not.toHaveAttribute('aria-current', /.*/);
    await expect(events.shell.submitEvent).toBeVisible();
    await expect(events.shell.menuButton).toBeHidden();
  });

  // L2-104 AC1: the official Magic Patterns logo mark sits beside the wordmark.
  test('the brand shows the official 6ixstack logo mark beside the wordmark', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open();

    await expect(events.shell.brand).toHaveAccessibleName('6ixstack home');
    await expect(events.shell.brandMark).toBeVisible();
    await expect(events.shell.brandMark).toHaveAttribute('aria-hidden', 'true');
    expect(await events.shell.brandMarkDifferenceFromOfficialLogo()).toBeLessThan(0.02);
  });

  test('the header stays at the top while the page scrolls', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open();

    await events.shell.scrollDown(800);

    await expect(events.shell.header).toBeInViewport();
    expect(await events.shell.headerTop()).toBe(0);
  });

  test('footer shows the tagline and footer navigation', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open();

    expect(await events.shell.tagline()).toBe('Made in Toronto, for the people building in the 6ix.');
    expect(await events.shell.footerLinkNames()).toEqual([
      'About',
      'Code of conduct',
      'Contact',
      'Calendar feeds',
      'Organizer sign in',
    ]);
  });

  test('the skip link is the first stop and moves focus to the main content', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open();

    await events.shell.pressTabFromTop();
    await expect(events.shell.skipLink).toBeFocused();
    await expect(events.shell.skipLink).toBeInViewport();

    await events.shell.useSkipLink();
    await expect(events.shell.main).toBeFocused();
  });

  test('at 360 px the header shows the menu button instead of navigation, with no horizontal scroll', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    const events = new EventsPage(page);
    await events.open();

    await expect(events.shell.menuButton).toBeVisible();
    await expect(events.shell.primaryNav).toBeHidden();
    await expect(events.shell.submitEvent).toBeVisible();
    expect(await events.shell.submitEventLabelVisible()).toBe(false);
    expect(await events.shell.hasHorizontalScroll()).toBe(false);
  });

  test('at 992 px the header navigation replaces the menu button', async ({ page }) => {
    await page.setViewportSize({ width: 992, height: 720 });
    const events = new EventsPage(page);
    await events.open();

    await expect(events.shell.primaryNav).toBeVisible();
    await expect(events.shell.menuButton).toBeHidden();
  });

  test('matches the design in light theme', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open();

    await expect(events.shell.header).toHaveScreenshot('site-header-light.png');
    await expect(events.shell.footer).toHaveScreenshot('site-footer-light.png');
  });
});
