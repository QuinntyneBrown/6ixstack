import { expect, test } from '../fixtures';
import { EventDetailPage } from '../pages/event-detail.page';
import { stubEventDetail } from '../support/stub-api';

// L2-019 streaming, L2-020 past, L2-021 cancelled; design: docs/detailed-designs/discovery/view-event-detail.
test.describe('Streaming event detail', () => {
  test('shows the source time and a countdown, with no stream link yet', async ({ page }) => {
    const detail = new EventDetailPage(page);
    await detail.open('azure-ai-foundry-shipping-agents');

    expect((await detail.factTexts())[0]).toBe(
      "Wednesday, November 4, 2026 · 12:00 PM – 1:30 PM ET · 9:00 AM PT where it's hosted",
    );
    await expect(detail.alert('Starts in 2 days')).toContainText(
      "We'll show the stream link here 15 minutes before 12:00 PM ET.",
    );
    await expect(detail.action('Join the stream')).toHaveCount(0);
    await expect(detail.sectionHeading('Where it streams from')).toBeVisible();
  });

  test('Join the stream appears when the join window opens, without a refresh', async ({ page }) => {
    await stubEventDetail(
      page,
      'azure-ai-foundry-shipping-agents',
      'event-stream-before-join',
      'event-stream-joinable',
    );
    const detail = new EventDetailPage(page);
    await detail.open('azure-ai-foundry-shipping-agents');
    await expect(detail.action('Join the stream')).toHaveCount(0);

    await page.clock.runFor(61_000);

    await expect(detail.action('Join the stream')).toHaveAttribute(
      'href',
      'https://stream.example.com/azure-ai-foundry-shipping-agents',
    );
  });
});

test.describe('Past event detail', () => {
  test('says it ended, links to the next one, and offers the recording and slides', async ({ page }) => {
    const detail = new EventDetailPage(page);
    await detail.open('minimal-apis-in-practice-october');

    expect(await detail.factTexts()).toEqual([
      'Tuesday, October 20, 2026 · 6:00 PM – 8:30 PM ET · ended',
      'Microsoft Canada · 81 Bay St, Toronto · Directions',
      '131 attended',
    ]);
    await expect(detail.alert('This event has ended')).toContainText(
      'Toronto .NET User Group meets again on November 3.',
    );
    await expect(detail.alertAction('This event has ended', 'See the next one')).toHaveAttribute(
      'href',
      '/events/whats-new-in-dotnet-11-previews',
    );
    await expect(detail.action('Watch the recording')).toHaveAttribute('href', /youtube\.com/);
    await expect(detail.action('Slides and code')).toHaveAttribute('href', /github\.com/);
    await expect(detail.action(/Get tickets|Register/)).toHaveCount(0);
    await expect(detail.action('Add to my calendar')).toHaveCount(0);
  });
});
