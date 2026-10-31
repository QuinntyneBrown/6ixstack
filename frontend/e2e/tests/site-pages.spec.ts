import { expect, test } from '../fixtures';
import { AboutPage } from '../pages/about.page';
import { CodeOfConductPage } from '../pages/code-of-conduct.page';
import { failSiteStats } from '../support/stub-api';

// L2-072 About and Code of Conduct pages; design: site/static-pages.
test.describe('About and Code of Conduct', () => {
  test('About shows the live stats and the prose', async ({ page }) => {
    const stats = (await (await page.request.get('/api/site/stats')).json()) as {
      year: number;
      communities: number;
      eventsListedThisYear: number;
      feedSubscribers: number;
      volunteerModerators: number;
    };
    const about = new AboutPage(page);

    await about.open();

    const n = (value: number) => value.toLocaleString('en-CA');
    await expect(about.stat('Communities')).toHaveText(n(stats.communities));
    await expect(about.stat(`Events listed in ${stats.year}`)).toHaveText(n(stats.eventsListedThisYear));
    await expect(about.stat('Feed subscribers')).toHaveText(n(stats.feedSubscribers));
    await expect(about.stat('Volunteer moderators')).toHaveText(n(stats.volunteerModerators));
    await expect(about.prose.getByRole('heading', { level: 2 })).toHaveText([
      'How listings work',
      'What we don’t do',
      'Who runs it',
    ]);
    await expect(about.getInTouch).toHaveAttribute('href', '/contact');
  });

  test('when the stats cannot be loaded the prose still renders without the row', async ({ page }) => {
    await failSiteStats(page);
    const about = new AboutPage(page);

    await about.open();

    await expect(about.prose).toContainText('one calendar for every developer event');
    await expect(about.stats).toHaveCount(0);
  });

  test('the Code of Conduct gives the conduct email and explains Report a problem', async ({ page }) => {
    const conduct = new CodeOfConductPage(page);

    await conduct.open();

    for (const name of ['Expected behaviour', 'Not acceptable', 'Reporting', 'What happens next']) {
      await expect(conduct.section(name)).toBeVisible();
    }
    await expect(conduct.conductEmail).toHaveAttribute('href', 'mailto:conduct@6ixstack.dev');
    await expect(conduct.prose).toContainText('Report a problem on any event page');
    await expect(conduct.lastUpdated).toHaveText('Last updated September 1, 2026.');
  });

  test('the footer opens both pages', async ({ page }) => {
    const about = new AboutPage(page);
    await about.open();

    await about.shell.footerNav.getByRole('link', { name: 'Code of conduct' }).click();

    await expect(new CodeOfConductPage(page).heading).toBeVisible();
    await expect(page).toHaveTitle('Code of conduct · 6ixstack');
  });
});
