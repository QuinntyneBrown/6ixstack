import { expect, test } from '../fixtures';
import { EventDetailPage } from '../pages/event-detail.page';
import { StatusPage } from '../pages/status.page';
import { failEventDetail, slowEventDetail } from '../support/stub-api';

// L2-024 loading, error and not found; design: docs/detailed-designs/discovery/view-event-detail.
test.describe('Event detail loading, error and not found', () => {
  test('a slow load shows skeletons with a busy aside', async ({ page }) => {
    await slowEventDetail(page, 'azure-data-ai-day-gta', 2_000);
    const detail = new EventDetailPage(page);
    await detail.startOpening('azure-data-ai-day-gta');

    await expect(detail.skeletons.first()).toBeVisible();
    await expect(detail.aside).toHaveAttribute('aria-busy', 'true');

    await expect(detail.title).toHaveText('Azure Data & AI Day GTA', { timeout: 10_000 });
    await expect(detail.aside).not.toHaveAttribute('aria-busy', 'true');
  });

  test('a failed load offers Try again and Back to all events', async ({ page }) => {
    const recover = await failEventDetail(page, 'azure-data-ai-day-gta');
    const detail = new EventDetailPage(page);
    await detail.startOpening('azure-data-ai-day-gta');

    await expect(detail.errorState).toBeVisible();
    await expect(detail.errorAction('Back to all events')).toHaveAttribute('href', '/');

    await recover();
    await detail.errorAction('Try again').click();

    await expect(detail.title).toHaveText('Azure Data & AI Day GTA');
  });

  for (const slug of ['does-not-exist', 'fabric-for-power-bi-developers']) {
    test(`${slug} shows the not-found page at the same address`, async ({ page }) => {
      const status = new StatusPage(page);
      await status.open(`/events/${slug}`);

      await expect(status.heading).toHaveText("We can't find that page");
      expect(status.url()).toBe(`/events/${slug}`);
    });
  }
});
