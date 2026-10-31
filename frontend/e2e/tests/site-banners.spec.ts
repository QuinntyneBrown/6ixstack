import { expect, test } from '../fixtures';
import { EventsPage } from '../pages/events.page';
import { announceMaintenance, goOffline, goOnline, makeApiUnreachable } from '../support/network';

// L2-075 site banners; design: docs/detailed-designs/site/toasts-and-banners.
test.describe('Site banners', () => {
  test('going offline shows a status banner that cannot be dismissed and disables Submit event', async ({
    page,
    context,
  }) => {
    const events = new EventsPage(page);
    await events.open();

    await goOffline(context);

    const banner = events.shell.banner("You're offline");
    await expect(banner).toBeVisible();
    await expect(banner).toHaveAttribute('role', 'status');
    await expect(events.shell.bannerText("You're offline")).toContainText(
      'Submitting and feeds need a connection.',
    );
    await expect(events.shell.bannerDismiss("You're offline")).toHaveCount(0);
    await expect(events.shell.submitEvent).toHaveAttribute('aria-disabled', 'true');
  });

  test('coming back online replaces it with a dismissable success banner with the time', async ({
    page,
    context,
  }) => {
    const events = new EventsPage(page);
    await events.open();
    await goOffline(context);
    await expect(events.shell.banner("You're offline")).toBeVisible();

    await goOnline(context);

    await expect(events.shell.banner("You're offline")).toHaveCount(0);
    await expect(events.shell.bannerText("You're back online")).toHaveText(
      'Events are up to date as of 9:00 AM.',
    );
    await expect(events.shell.submitEvent).not.toHaveAttribute('aria-disabled', 'true');
    await events.shell.bannerDismiss("You're back online").click();
    await expect(events.shell.banner("You're back online")).toHaveCount(0);
  });

  test('an unreachable API shows an alert that retries every 30 seconds and on Retry now', async ({
    page,
  }) => {
    const api = await makeApiUnreachable(page);
    const events = new EventsPage(page);
    await events.open();

    const banner = events.shell.banner("We can't reach 6ixstack");
    await expect(banner).toBeVisible();
    await expect(banner).toHaveAttribute('role', 'alert');
    await expect(events.shell.bannerText("We can't reach 6ixstack")).toHaveText(
      'Retrying in 30 seconds. The events below may be out of date.',
    );
    await expect(events.shell.bannerDismiss("We can't reach 6ixstack")).toHaveCount(0);

    const before = api.probes();
    await page.clock.runFor(30_000);
    await expect.poll(() => api.probes()).toBe(before + 1);

    await api.restore();
    await events.shell.bannerAction("We can't reach 6ixstack", 'Retry now').click();

    await expect(banner).toHaveCount(0);
  });

  test('a dismissed maintenance banner stays hidden for that window and a new window shows again', async ({
    page,
  }) => {
    await announceMaintenance(page, {
      windowId: '2026-11-08-submissions',
      title: 'Submissions pause Sunday, Nov 8, 2–4 AM ET',
      text: 'Browsing and feeds keep working during maintenance.',
    });
    const events = new EventsPage(page);
    await events.open();

    const title = 'Submissions pause Sunday, Nov 8, 2–4 AM ET';
    await expect(events.shell.banner(title)).toBeVisible();
    await expect(events.shell.bannerText(title)).toHaveText(
      'Browsing and feeds keep working during maintenance.',
    );
    await events.shell.bannerDismiss(title).click();
    await expect(events.shell.banner(title)).toHaveCount(0);

    await events.open();
    await expect(events.shell.banner(title)).toHaveCount(0);

    await page.unroute('**/api/site/notice');
    await announceMaintenance(page, {
      windowId: '2026-11-15-feeds',
      title: 'Feeds pause Sunday, Nov 15, 2–3 AM ET',
      text: 'Browsing keeps working during maintenance.',
    });
    await events.open();
    await expect(events.shell.banner('Feeds pause Sunday, Nov 15, 2–3 AM ET')).toBeVisible();
  });

  test('the banners match the design', async ({ page, context }) => {
    await announceMaintenance(page, {
      windowId: '2026-11-08-submissions',
      title: 'Submissions pause Sunday, Nov 8, 2–4 AM ET',
      text: 'Browsing and feeds keep working during maintenance.',
    });
    const events = new EventsPage(page);
    await events.open();
    await goOffline(context);
    await expect(events.shell.banner("You're offline")).toBeVisible();

    await expect(events.shell.banner("You're offline")).toHaveScreenshot('site-banner-offline-light.png');
    await expect(events.shell.banner('Submissions pause Sunday, Nov 8, 2–4 AM ET')).toHaveScreenshot(
      'site-banner-maintenance-light.png',
    );
  });
});
