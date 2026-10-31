import { request as playwrightRequest } from '@playwright/test';
import { expect, test } from '../fixtures';
import { OrganizerDashboardPage } from '../pages/organizer-dashboard.page';
import { ShareEventDialog } from '../pages/share-event.dialog';
import { MODERATOR, ORGANIZER, signInAs, signInWithLink } from '../support/session';
import { failDashboard, slowDashboard } from '../support/stub-api';

// L2-051 dashboard, L2-052 states, L2-053 banners; design: organizer/organizer-dashboard.
test.describe('Organizer dashboard', () => {
  test('shows the community, the stats and each event with its status', async ({ page }) => {
    await signInAs(page, ORGANIZER);
    const dashboard = new OrganizerDashboardPage(page);
    await dashboard.open();

    await expect(dashboard.heading).toHaveText('Your events');
    await expect(dashboard.lead).toHaveText('GTA Azure Community · signed in as priya@gtaazure.ca');
    await expect(dashboard.newEvent).toHaveAttribute('href', '/submit');
    await expect(dashboard.statValue('Upcoming')).toHaveText('1');
    await expect(dashboard.statValue('In review')).toHaveText('1');
    await expect(dashboard.statValue('Going')).toHaveText('318');
    await expect(dashboard.statValue('Feed subscribers')).toHaveText('1,204');

    const day = dashboard.row('Azure Data & AI Day GTA');
    await expect(day.status).toHaveText('Published');
    await expect(day.title.getByRole('link')).toHaveAttribute('href', '/events/azure-data-ai-day-gta');
    await expect(day.going).toHaveText('318');
    await expect(dashboard.row('Fabric for Power BI developers').status).toHaveText('In review');
    const bicep = dashboard.row('Azure Bicep clinic');
    await expect(bicep.status).toHaveText('Needs changes');
    await expect(bicep.reason).toHaveText('Add the venue address');
    const past = dashboard.row('Copilot Studio for developers');
    await expect(past.status).toHaveText('Past');
    await expect(past.view).toHaveAttribute('href', '/events/copilot-studio-for-developers');
    expect(await dashboard.titles()).not.toContain('Vector search in Postgres');
  });

  test('the Date header reverses the order and says how it is sorted', async ({ page }) => {
    await signInAs(page, ORGANIZER);
    const dashboard = new OrganizerDashboardPage(page);
    await dashboard.open();
    await expect(dashboard.dateHeader).toHaveAttribute('aria-sort', 'ascending');
    const ascending = await dashboard.titles();

    await dashboard.sortByDate.click();

    await expect(dashboard.dateHeader).toHaveAttribute('aria-sort', 'descending');
    expect(await dashboard.titles()).toEqual([...ascending].reverse());
  });

  test('the in-review banner can be dismissed and stays dismissed', async ({ page }) => {
    await signInAs(page, ORGANIZER);
    const dashboard = new OrganizerDashboardPage(page);
    await dashboard.open();
    await expect(dashboard.banner).toContainText('“Fabric for Power BI developers” is in review');

    await dashboard.bannerClose().click();
    await expect(dashboard.banner).toHaveCount(0);
    await dashboard.open();

    await expect(dashboard.rows.first()).toBeVisible();
    await expect(dashboard.banner).toHaveCount(0);
  });

  test('an approved event shows the live banner with View the listing and Share it', async ({
    page,
    baseURL,
  }) => {
    const jordan = await playwrightRequest.newContext({ baseURL });
    await jordan.post('/api/test/sign-in', { data: { email: MODERATOR } });
    const xsrf = (await jordan.storageState()).cookies.find((c) => c.name === 'XSRF-TOKEN')?.value ?? '';
    const headers = { 'X-XSRF-TOKEN': decodeURIComponent(xsrf) };
    const queue = await (await jordan.get('/api/moderation/queue')).json();
    const fabric = queue.cards.find((c: { slug: string }) => c.slug === 'fabric-for-power-bi-developers').id;
    await jordan.post(`/api/moderation/submissions/${fabric}/approve`, { headers });
    try {
      await signInAs(page, ORGANIZER);
      const dashboard = new OrganizerDashboardPage(page);
      await dashboard.open();

      await expect(dashboard.banner).toContainText('“Fabric for Power BI developers” is live');
      await expect(dashboard.banner).toContainText('It’s in the list, the calendar and every matching feed.');
      await expect(dashboard.bannerAction('View the listing')).toHaveAttribute(
        'href',
        '/events/fabric-for-power-bi-developers',
      );
      await dashboard.bannerAction('Share it').click();
      await expect(new ShareEventDialog(page).panel).toBeVisible();
    } finally {
      await jordan.post(`/api/moderation/submissions/${fabric}/undo-approval`, { headers });
      await jordan.dispose();
    }
  });

  test('a first-time organizer sees how to start and a banner to verify their email', async ({ page }) => {
    const email = `first-${Date.now()}@example.com`;
    await signInWithLink(page, email);
    const dashboard = new OrganizerDashboardPage(page);
    await dashboard.open();

    await expect(dashboard.empty).toContainText('Submit an event');
    await expect(dashboard.stats).toHaveCount(0);
    await expect(dashboard.banner).toContainText(`Verify ${email} to publish events`);
    await expect(dashboard.bannerClose()).toHaveCount(0);
    await expect(dashboard.bannerAction('Resend verification email')).toBeVisible();
  });

  test('a failed load says listings are safe and offers Try again and Contact us', async ({ page }) => {
    await signInAs(page, ORGANIZER);
    const restore = await failDashboard(page);
    const dashboard = new OrganizerDashboardPage(page);
    await dashboard.open();

    await expect(dashboard.failure).toContainText('Your listings are safe; this is a problem on our side.');
    await expect(dashboard.failure.getByRole('link', { name: 'Contact us' })).toHaveAttribute(
      'href',
      /^mailto:/,
    );
    await restore();
    await dashboard.failure.getByRole('button', { name: 'Try again' }).click();
    await expect(dashboard.rows.first()).toBeVisible();
  });

  test('a slow load shows four skeleton stats and four skeleton rows', async ({ page }) => {
    await signInAs(page, ORGANIZER);
    await slowDashboard(page, 2_000);
    const dashboard = new OrganizerDashboardPage(page);
    await dashboard.open();

    await expect(dashboard.statSkeletons).toHaveCount(4);
    await expect(dashboard.skeletonRows).toHaveCount(4);
    await expect(dashboard.rows.first()).toBeVisible({ timeout: 10_000 });
  });
});
