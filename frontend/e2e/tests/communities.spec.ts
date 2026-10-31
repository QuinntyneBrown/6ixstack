import { expect, test } from '../fixtures';
import { CommunitiesPage } from '../pages/communities.page';
import { failCommunities, slowCommunities } from '../support/stub-api';

// L2-029 directory, L2-030 states; design: directory/browse-communities. The seed lists 15 communities.
test.describe('Communities directory', () => {
  test('the first ten cards are sorted by most members, then Show 20 more adds the rest', async ({
    page,
  }) => {
    const communities = new CommunitiesPage(page);
    await communities.open();

    await expect(communities.heading).toHaveText('Communities');
    await expect(communities.lead).toHaveText(
      '15 meetups and conferences across Toronto and the GTA, plus the global streams we list.',
    );
    await expect(communities.cards).toHaveCount(10);
    await expect(communities.caption).toHaveText('Showing 10 of 15 communities');
    const gta = communities.card('GTA Azure Community');
    await expect(gta.sub).toHaveText('Mississauga · 2,140 members');
    await expect(gta.next).toHaveText('Next: Azure Data & AI Day GTA · Thu, Nov 5');
    await expect(gta.topics).toHaveText(['AI', 'Azure']);

    await communities.showMore.click();

    await expect(communities.cards).toHaveCount(15);
    await expect(communities.showMore).toHaveCount(0);
  });

  test('streaming communities count followers', async ({ page }) => {
    const communities = new CommunitiesPage(page);
    await communities.open();

    await expect(communities.card('Microsoft Reactor').sub).toHaveText('Streaming · 18,400 followers');
  });

  test('the city filter narrows the list and goes in the URL', async ({ page }) => {
    const communities = new CommunitiesPage(page);
    await communities.open();

    await communities.city.selectOption('Mississauga');

    await expect(communities.cards).toHaveCount(1);
    await expect(communities.card('GTA Azure Community').root).toBeVisible();
    await expect(page).toHaveURL(/[?&]city=Mississauga(&|$)/);
  });

  test('search, topic and sort shape the list', async ({ page }) => {
    const communities = new CommunitiesPage(page);
    await communities.open();

    await communities.searchFor('angular');
    await expect(communities.card('Angular Toronto').root).toBeVisible();
    await expect(page).toHaveURL(/[?&]q=angular(&|$)/);

    await communities.searchFor('');
    await communities.sort.selectOption({ label: 'A–Z' });
    await expect(async () => {
      const names = await communities.names();
      expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' })));
    }).toPass();
    await communities.topic.selectOption({ label: 'React' });
    await expect(communities.card('React Toronto').root).toBeVisible();
    await expect(communities.card('Angular Toronto').root).toHaveCount(0);
  });

  test('activating anywhere on a card opens the community page', async ({ page }) => {
    const communities = new CommunitiesPage(page);
    await communities.open();

    await communities.card('GTA Azure Community').root.click({ position: { x: 40, y: 120 } });

    await expect(page).toHaveURL(/\/communities\/gta-azure-community$/);
  });

  test('a city with no communities offers to list one or see all of the GTA', async ({ page }) => {
    const communities = new CommunitiesPage(page);
    await communities.open('?city=Oakville');

    await expect(communities.empty).toContainText('No communities in Oakville yet');
    await expect(communities.lead).toHaveText('0 communities in Oakville.');
    await expect(communities.emptyAction('List your community')).toHaveAttribute('href', '/submit');
    await communities.emptyAction('See all of the GTA').click();
    await expect(communities.cards).toHaveCount(10);
  });

  test('a search with no matches offers to clear it or list a meetup', async ({ page }) => {
    const communities = new CommunitiesPage(page);
    await communities.open();

    await communities.searchFor('Rust');

    await expect(communities.empty).toContainText('No communities match “Rust”');
    await expect(communities.lead).toHaveText('0 of 15 communities match.');
    await expect(communities.emptyAction('List a Rust meetup')).toHaveAttribute('href', '/submit');
    await communities.emptyAction('Clear search').click();
    await expect(communities.search).toHaveValue('');
    await expect(communities.cards).toHaveCount(10);
  });

  test('a failed load keeps the search and filters and offers Try again', async ({ page }) => {
    const restore = await failCommunities(page);
    const communities = new CommunitiesPage(page);
    await communities.open('?q=azure&city=Toronto');

    await expect(communities.failure).toContainText(
      "6ixstack didn't respond in time. Your search and filters are kept.",
    );
    await expect(communities.lead).toHaveText('Community list unavailable right now.');
    await expect(communities.search).toHaveValue('azure');
    await expect(communities.city).toHaveValue('Toronto');
    await restore();
    await communities.failure.getByRole('button', { name: 'Try again' }).click();
    await expect(communities.card('Azure Toronto').root).toBeVisible();
  });

  test('a slow load shows six skeleton cards', async ({ page }) => {
    await slowCommunities(page, 2_000);
    const communities = new CommunitiesPage(page);
    await communities.open();

    await expect(communities.skeletonCards).toHaveCount(6);
    await expect(communities.cards).toHaveCount(10, { timeout: 10_000 });
  });
});
