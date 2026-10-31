import { expect, test } from '../fixtures';
import { CommunitiesPage } from '../pages/communities.page';
import { CommunityDetailPage } from '../pages/community-detail.page';
import { EventDetailPage } from '../pages/event-detail.page';
import { SubscribeFeedDialog } from '../pages/subscribe-feed.dialog';
import { failCommunity, nothingScheduled, slowCommunity } from '../support/stub-api';

// L2-031 community page; design: directory/view-community.
test.describe('Community page', () => {
  test('opens from the directory with its profile, events, facts and organizers', async ({ page }) => {
    const communities = new CommunitiesPage(page);
    await communities.open();
    await communities.card('GTA Azure Community').title.click();
    const community = new CommunityDetailPage(page);

    await expect(community.heading).toHaveText('GTA Azure Community');
    await expect(community.tagline).toHaveText(
      'Azure, data and AI in Mississauga and Peel, run by local MVPs.',
    );
    await expect(community.topics).toHaveText(['AI', 'Azure']);
    await expect(community.about).toHaveCount(2);
    await expect(community.upcomingRows).toHaveCount(1);
    await expect(community.upcomingRows.first()).toContainText('Azure Data & AI Day GTA');
    await expect(community.pastItems).toHaveCount(3);
    await expect(community.pastItem('Copilot Studio for developers')).toContainText('Oct 29, 2026 · ');
    await expect(
      community.pastItem('Copilot Studio for developers').getByRole('link', { name: /^Recap/ }),
    ).toHaveAttribute('href', '/events/copilot-studio-for-developers');
    await expect(community.fact('2,140 members')).toContainText('Monthly since 2019');
    await expect(community.fact('Mississauga and online')).toContainText(
      'Living Arts Centre, Sheridan College',
    );
    await expect(community.fact('gtaazure.ca').getByRole('link', { name: 'Meetup' })).toHaveAttribute(
      'href',
      'https://www.meetup.com/gta-azure',
    );
    await expect(community.organizers).toHaveCount(3);
    await expect(community.organizers.first().getByRole('link')).toHaveAttribute(
      'href',
      '/speakers/priya-natarajan',
    );
    await expect(community.backLink).toHaveAttribute('href', '/communities');
  });

  test('an upcoming event opens its page', async ({ page }) => {
    const community = new CommunityDetailPage(page);
    await community.open('gta-azure-community');

    await community.upcomingRows.first().getByRole('link', { name: 'Azure Data & AI Day GTA' }).click();

    await expect(new EventDetailPage(page).title).toHaveText('Azure Data & AI Day GTA');
  });

  test('Subscribe to this group creates a feed for this community only', async ({ page }) => {
    const community = new CommunityDetailPage(page);
    await community.open('gta-azure-community');

    await community.subscribe.click();
    const dialog = new SubscribeFeedDialog(page);
    await dialog.builder.allTopics.check();
    await dialog.create.click();

    await expect(dialog.ready).toBeVisible();
    await expect(dialog.result.link).toHaveValue(/-in-gta-azure-community\.ics$/);
  });

  test('with nothing scheduled it says when the group usually posts', async ({ page }) => {
    await nothingScheduled(page);
    const community = new CommunityDetailPage(page);
    await community.open('gta-azure-community');

    await expect(community.nothingScheduled).toContainText(
      'GTA Azure Community usually posts its next meetup about three weeks ahead.',
    );
    await expect(
      community.nothingScheduled.getByRole('button', { name: 'Subscribe to this group' }),
    ).toBeVisible();
  });

  test('a failed load offers Try again and Back to communities', async ({ page }) => {
    const restore = await failCommunity(page);
    const community = new CommunityDetailPage(page);
    await community.open('gta-azure-community');

    await expect(community.loadFailed).toBeVisible();
    await expect(community.loadFailed.getByRole('link', { name: 'Back to communities' })).toHaveAttribute(
      'href',
      '/communities',
    );
    await restore();
    await community.loadFailed.getByRole('button', { name: 'Try again' }).click();
    await expect(community.heading).toHaveText('GTA Azure Community');
  });

  test('an unknown community shows the not-found page', async ({ page }) => {
    const community = new CommunityDetailPage(page);
    await community.open('nobody-here');

    await expect(community.notFound).toBeVisible();
  });

  test('a slow load shows the page skeleton', async ({ page }) => {
    await slowCommunity(page, 2_000);
    const community = new CommunityDetailPage(page);
    await community.open('gta-azure-community');

    await expect(community.skeleton).toBeVisible();
    await expect(community.heading).toHaveText('GTA Azure Community', { timeout: 10_000 });
  });
});
