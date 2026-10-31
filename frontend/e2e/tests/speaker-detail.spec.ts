import { expect, test } from '../fixtures';
import { EventDetailPage } from '../pages/event-detail.page';
import { SpeakerDetailPage } from '../pages/speaker-detail.page';
import { SpeakersPage } from '../pages/speakers.page';
import { failSpeaker, slowSpeaker } from '../support/stub-api';

// L2-033 speaker page; design: directory/view-speaker.
test.describe('Speaker page', () => {
  test('opens from the directory with the profile, talks, facts and invite', async ({ page }) => {
    const speakers = new SpeakersPage(page);
    await speakers.open();
    await speakers.card('Priya Natarajan').title.click();
    const speaker = new SpeakerDetailPage(page);

    await expect(speaker.heading).toHaveText('Priya Natarajan');
    await expect(speaker.role).toContainText('Azure MVP · Cloud architect, Rogers');
    await expect(speaker.communityLink).toHaveText('GTA Azure Community');
    await expect(speaker.communityLink).toHaveAttribute('href', '/communities/gta-azure-community');
    await expect(speaker.topics).toHaveText(['AI', 'Azure']);
    await expect(speaker.bio).toHaveCount(2);
    await expect(speaker.upcomingRows).toHaveCount(1);
    await expect(speaker.upcomingRows.first()).toContainText('Keynote: Fabric one year later');
    await expect(speaker.upcomingRows.first()).toContainText('9:30 AM');
    await expect(speaker.pastItems.first()).toContainText('Bicep modules that scale');
    await expect(speaker.pastItems.first().getByRole('link', { name: /^Recording/ })).toHaveAttribute(
      'href',
      /^https:\/\//,
    );
    await expect(speaker.fact('43 talks')).toContainText('Since 2019');
    await expect(speaker.fact('Mississauga')).toContainText('Speaks in person across the GTA');
    await expect(speaker.invite).toHaveAttribute('href', 'mailto:priya@gtaazure.ca');
    await expect(speaker.backLink).toHaveAttribute('href', '/speakers');
  });

  test('an upcoming talk opens its event', async ({ page }) => {
    const speaker = new SpeakerDetailPage(page);
    await speaker.open('priya-natarajan');

    await speaker.upcomingRows.first().getByRole('link').first().click();

    await expect(new EventDetailPage(page).title).toHaveText('Azure Data & AI Day GTA');
  });

  test('with no upcoming talks and no contact, past talks remain and there is no invite', async ({
    page,
  }) => {
    const speaker = new SpeakerDetailPage(page);
    await speaker.open('hannah-wright');

    await expect(speaker.noUpcoming).toContainText("Hannah isn't scheduled to speak anywhere right now.");
    await expect(speaker.pastItems.first()).toContainText('Flex Consumption in production');
    await expect(speaker.invite).toHaveCount(0);
  });

  test('a failed load offers Try again and Back to speakers', async ({ page }) => {
    const restore = await failSpeaker(page);
    const speaker = new SpeakerDetailPage(page);
    await speaker.open('priya-natarajan');

    await expect(speaker.loadFailed.getByRole('link', { name: 'Back to speakers' })).toHaveAttribute(
      'href',
      '/speakers',
    );
    await restore();
    await speaker.loadFailed.getByRole('button', { name: 'Try again' }).click();
    await expect(speaker.heading).toHaveText('Priya Natarajan');
  });

  test('an unknown speaker shows the not-found page', async ({ page }) => {
    const speaker = new SpeakerDetailPage(page);
    await speaker.open('nobody-here');

    await expect(speaker.notFound).toBeVisible();
  });

  test('a slow load shows the page skeleton', async ({ page }) => {
    await slowSpeaker(page, 2_000);
    const speaker = new SpeakerDetailPage(page);
    await speaker.open('priya-natarajan');

    await expect(speaker.skeleton).toBeVisible();
    await expect(speaker.heading).toHaveText('Priya Natarajan', { timeout: 10_000 });
  });
});
