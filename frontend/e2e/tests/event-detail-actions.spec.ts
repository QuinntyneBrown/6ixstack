import { expect, test } from '../fixtures';
import { EventDetailPage } from '../pages/event-detail.page';

// L2-018 actions for upcoming events; design: docs/detailed-designs/discovery/view-event-detail.
test.describe('Event detail actions', () => {
  test('a paid event links to its tickets in a new tab, with calendar, share and report', async ({
    page,
  }) => {
    const detail = new EventDetailPage(page);
    await detail.open('azure-data-ai-day-gta');

    const tickets = detail.action('Get tickets · $49');
    await expect(tickets).toHaveAttribute('href', 'https://tickets.example.com/azure-data-ai-day-gta');
    await expect(tickets).toHaveAttribute('target', '_blank');
    await expect(tickets).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(detail.action('Add to my calendar')).toBeVisible();
    await expect(detail.action('Share')).toBeVisible();
    await expect(detail.action('Report a problem')).toBeVisible();
    await expect(detail.caption).toHaveText(
      'Tickets are sold by the organizer. 6ixstack never charges attendees.',
    );
  });

  test('a free event offers Register', async ({ page }) => {
    const detail = new EventDetailPage(page);
    await detail.open('whats-new-in-dotnet-11-previews');

    await expect(detail.action('Register')).toHaveAttribute(
      'href',
      'https://tickets.example.com/whats-new-in-dotnet-11-previews',
    );
  });

  test('an event without a ticket link has no ticket action', async ({ page }) => {
    const detail = new EventDetailPage(page);
    await detail.open('azure-ai-foundry-shipping-agents');

    await expect(detail.action(/Get tickets|Register/)).toHaveCount(0);
    await expect(detail.action('Add to my calendar')).toBeVisible();
  });
});
