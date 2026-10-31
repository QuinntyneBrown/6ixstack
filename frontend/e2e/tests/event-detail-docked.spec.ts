import { expect, test } from '../fixtures';
import { EventDetailPage } from '../pages/event-detail.page';

// L2-023 docked ticket action on phones; design: docs/detailed-designs/discovery/view-event-detail.
test.describe('Docked ticket bar', () => {
  test('stays visible on a phone while the page scrolls', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    const detail = new EventDetailPage(page);
    await detail.open('azure-data-ai-day-gta');

    await detail.shell.scrollDown(1200);

    await expect(detail.dockedBar).toBeInViewport();
    await expect(detail.dockedBar).toContainText('Thu, Nov 5 · 9:00 AM');
    await expect(detail.dockedBar).toContainText('$49 · 318 going');
    await expect(detail.dockedBar.getByRole('link', { name: 'Get tickets' })).toHaveAttribute(
      'href',
      'https://tickets.example.com/azure-data-ai-day-gta',
    );
    expect(await detail.shell.hasHorizontalScroll()).toBe(false);
  });

  test('is not shown on a wide screen', async ({ page }) => {
    const detail = new EventDetailPage(page);
    await detail.open('azure-data-ai-day-gta');

    await expect(detail.dockedBar).toBeHidden();
  });

  for (const slug of ['minimal-apis-in-practice-october', 'brampton-dev-night-november-social']) {
    test(`is not shown for ${slug} on a phone`, async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 740 });
      const detail = new EventDetailPage(page);
      await detail.open(slug);

      await expect(detail.dockedBar).toHaveCount(0);
    });
  }
});
