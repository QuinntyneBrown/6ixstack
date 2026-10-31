import { expect, test } from '../fixtures';
import { OrganizerDashboardPage } from '../pages/organizer-dashboard.page';
import { ORGANIZER, signInAs, signInWithLink } from '../support/session';
import { failDashboard, slowDashboard, withDashboardBanner } from '../support/stub-api';

// Visual parity with docs/mocks/pages/organizer-dashboard and notifications/submission-banner.
test.describe('Organizer dashboard visuals', () => {
  test('default', async ({ page }) => {
    await signInAs(page, ORGANIZER);
    const dashboard = new OrganizerDashboardPage(page);
    await dashboard.open();
    await expect(dashboard.rows.first()).toBeVisible();
    await expect(page).toHaveScreenshot('organizer-dashboard-default-light.png', { fullPage: true });
  });

  test('loading', async ({ page }) => {
    await signInAs(page, ORGANIZER);
    await slowDashboard(page, 5_000);
    const dashboard = new OrganizerDashboardPage(page);
    await dashboard.open();
    await expect(dashboard.skeletonRows).toHaveCount(4);
    await expect(page).toHaveScreenshot('organizer-dashboard-loading-light.png', { fullPage: true });
  });

  test('error', async ({ page }) => {
    await signInAs(page, ORGANIZER);
    await failDashboard(page);
    const dashboard = new OrganizerDashboardPage(page);
    await dashboard.open();
    await expect(dashboard.failure).toBeVisible();
    await expect(page).toHaveScreenshot('organizer-dashboard-error-light.png');
  });

  test('empty with the verify banner', async ({ page }) => {
    // A fresh address each run (the email itself is masked), since links are limited to five an hour per address.
    await signInWithLink(page, `visual-first-${Date.now()}@example.com`);
    const dashboard = new OrganizerDashboardPage(page);
    await dashboard.open();
    await expect(dashboard.empty).toBeVisible();
    await expect(page.locator('main')).toHaveScreenshot('organizer-dashboard-empty-light.png', {
      mask: [dashboard.lead, dashboard.banner.locator('.alert__title')],
    });
  });

  test('needs changes banner', async ({ page }) => {
    await signInAs(page, ORGANIZER);
    await withDashboardBanner(page, {
      kind: 'needsChanges',
      key: 'visual-needs-changes',
      title: '“Azure Bicep clinic” needs a venue address',
      text: 'Add the street address and room, then resubmit. It keeps its place in the queue.',
      eventSlug: 'azure-bicep-clinic',
      dismissible: true,
    });
    const dashboard = new OrganizerDashboardPage(page);
    await dashboard.open();
    await expect(dashboard.banner).toHaveScreenshot('submission-banner-warning-light.png');
  });

  test('not approved banner', async ({ page }) => {
    await signInAs(page, ORGANIZER);
    await withDashboardBanner(page, {
      kind: 'notApproved',
      key: 'visual-not-approved',
      title: '“Azure Bicep clinic” wasn’t approved',
      text: '“We couldn’t confirm where this happens. Add the venue address and submit again.” — Jordan, 6ixstack moderator',
      eventSlug: 'azure-bicep-clinic',
      dismissible: true,
    });
    const dashboard = new OrganizerDashboardPage(page);
    await dashboard.open();
    await expect(dashboard.banner).toHaveScreenshot('submission-banner-danger-light.png');
  });

  test('dark theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await signInAs(page, ORGANIZER);
    const dashboard = new OrganizerDashboardPage(page);
    await dashboard.open();
    await expect(dashboard.rows.first()).toBeVisible();
    await expect(page).toHaveScreenshot('organizer-dashboard-default-dark.png', { fullPage: true });
  });

  test('phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await signInAs(page, ORGANIZER);
    const dashboard = new OrganizerDashboardPage(page);
    await dashboard.open();
    await expect(dashboard.rows.first()).toBeVisible();
    await expect(page).toHaveScreenshot('organizer-dashboard-default-phone.png', { fullPage: true });
  });
});
