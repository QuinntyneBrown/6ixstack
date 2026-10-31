import { expect, test } from '../fixtures';
import { EventDetailPage } from '../pages/event-detail.page';
import { EventsPage } from '../pages/events.page';
import { failFeatured, failEvents, nothingFeatured } from '../support/stub-api';

// L2-006 featured event; design: discovery/featured-event.
test.describe('Featured event', () => {
  test('the featured card sits beside the headline with the event’s details', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open();
    const card = events.featured;

    await expect(card.label).toHaveText('Featured this week');
    await expect(card.month).toHaveText('Nov');
    await expect(card.day).toHaveText('5');
    await expect(card.title.getByRole('link')).toHaveAttribute('href', '/events/azure-data-ai-day-gta');
    await expect(card.organizer).toHaveText('GTA Azure Community');
    await expect(card.meta).toHaveText(['Living Arts Centre, Mississauga', 'Livestream available']);
    await expect(card.when).toHaveText('Thu · 9:00 AM');
    await expect(card.action).toHaveText('Get tickets · $49');
  });

  test('the card opens the event', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open();

    await events.featured.action.click();

    await expect(new EventDetailPage(page).title).toHaveText('Azure Data & AI Day GTA');
  });

  test('with nothing featured, the card invites organizers to submit', async ({ page }) => {
    await nothingFeatured(page);
    const events = new EventsPage(page);
    await events.open();
    const card = events.featured;

    await expect(card.title).toHaveText('Your event could be here');
    await expect(card.when).toHaveText('Free to list');
    await expect(card.action).toHaveText('Submit an event');
    await expect(card.action).toHaveAttribute('href', '/submit');
  });

  test('a failed featured request keeps the frame and the list still loads', async ({ page }) => {
    await failFeatured(page);
    const events = new EventsPage(page);
    await events.open();

    await expect(events.featured.skeleton.first()).toBeVisible();
    await expect(events.rows.first()).toBeVisible();
  });

  test('a failed list does not hold the featured card back', async ({ page }) => {
    await failEvents(page);
    const events = new EventsPage(page);
    await events.open();

    await expect(events.errorAlert).toBeVisible();
    await expect(events.featured.title).toHaveText('Azure Data & AI Day GTA');
  });
});
