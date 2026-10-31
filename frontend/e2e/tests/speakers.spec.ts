import { expect, test } from '../fixtures';
import { SpeakersPage } from '../pages/speakers.page';
import { failSpeakers, slowSpeakers } from '../support/stub-api';

// L2-032 speakers directory; design: directory/browse-speakers. The seed lists 14 speakers.
test.describe('Speakers directory', () => {
  test('nine cards first with the next talk, then Show 24 more adds the rest', async ({ page }) => {
    const speakers = new SpeakersPage(page);
    await speakers.open();

    await expect(speakers.heading).toHaveText('Speakers');
    await expect(speakers.lead).toHaveText(
      '14 people who have spoken at GTA meetups and conferences this year.',
    );
    await expect(speakers.cards).toHaveCount(9);
    await expect(speakers.caption).toHaveText('Showing 9 of 14 speakers');
    const priya = speakers.card('Priya Natarajan');
    await expect(priya.sub).toHaveText('Azure MVP · Cloud architect, Rogers');
    await expect(priya.topics).toHaveText(['AI', 'Azure']);
    await expect(priya.next).toHaveText('Next: Keynote: Fabric one year later · Thu, Nov 5');
    await expect(priya.title).toHaveAttribute('href', '/speakers/priya-natarajan');

    await speakers.showMore.click();

    await expect(speakers.cards).toHaveCount(14);
    await expect(speakers.showMore).toHaveCount(0);
  });

  test('search and the topic filter narrow the list and go in the URL', async ({ page }) => {
    const speakers = new SpeakersPage(page);
    await speakers.open();

    await speakers.searchFor('shopify');
    await expect(speakers.card('Kenji Watanabe').root).toBeVisible();
    await expect(page).toHaveURL(/[?&]q=shopify(&|$)/);

    await speakers.searchFor('');
    await speakers.topic.selectOption({ label: 'React' });
    await expect(speakers.card('Tomás Rivera').root).toBeVisible();
    await expect(speakers.card('Priya Natarajan').root).toHaveCount(0);
    await expect(page).toHaveURL(/[?&]topic=react(&|$)/);
  });

  test('the speaking period keeps this month’s or this year’s speakers', async ({ page }) => {
    const speakers = new SpeakersPage(page);
    await speakers.open();

    await speakers.period.selectOption({ label: 'Spoke this year' });

    await expect(speakers.card('Hannah Wright').root).toBeVisible();
    await expect(speakers.card('Kenji Watanabe').root).toHaveCount(0);
    await expect(page).toHaveURL(/[?&]period=year(&|$)/);
  });

  test('a topic with no talks in the period offers any time or pitching a talk', async ({ page }) => {
    const speakers = new SpeakersPage(page);
    await speakers.open('?topic=angular&period=year');

    await expect(speakers.lead).toHaveText('0 speakers match.');
    await expect(speakers.empty).toContainText('No Angular talks this year');
    await expect(speakers.emptyAction('Pitch a talk')).toHaveAttribute('href', '/submit');
    await speakers.emptyAction('Show any time').click();
    await expect(speakers.card('Leila Haddad').root).toBeVisible();
  });

  test('a search with no matches offers to clear it', async ({ page }) => {
    const speakers = new SpeakersPage(page);
    await speakers.open();

    await speakers.searchFor('Kotlin');

    await expect(speakers.empty).toContainText('No speakers match “Kotlin”');
    await expect(speakers.lead).toHaveText('0 of 14 speakers match.');
    await speakers.emptyAction('Clear search').click();
    await expect(speakers.cards).toHaveCount(9);
  });

  test('a failed load keeps the filters and offers Try again', async ({ page }) => {
    const restore = await failSpeakers(page);
    const speakers = new SpeakersPage(page);
    await speakers.open('?topic=azure');

    await expect(speakers.failure).toContainText(
      "6ixstack didn't respond in time. Your search and filters are kept.",
    );
    await expect(speakers.lead).toHaveText('Speaker list unavailable right now.');
    await expect(speakers.topic).toHaveValue('azure');
    await restore();
    await speakers.failure.getByRole('button', { name: 'Try again' }).click();
    await expect(speakers.card('Priya Natarajan').root).toBeVisible();
  });

  test('a slow load shows skeleton cards', async ({ page }) => {
    await slowSpeakers(page, 2_000);
    const speakers = new SpeakersPage(page);
    await speakers.open();

    await expect(speakers.skeletonCards).toHaveCount(6);
    await expect(speakers.cards).toHaveCount(9, { timeout: 10_000 });
  });
});
