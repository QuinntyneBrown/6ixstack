import { expect, test } from '../fixtures';
import { EventDetailPage } from '../pages/event-detail.page';
import { failEventDetail } from '../support/stub-api';

// Visual parity with docs/mocks/pages/event-detail (maps arrive with journey 16).
test.describe('Event detail visuals', () => {
  for (const [name, slug] of [
    ['default', 'azure-data-ai-day-gta'],
    ['streaming', 'azure-ai-foundry-shipping-agents'],
    ['past', 'minimal-apis-in-practice-october'],
    ['cancelled', 'brampton-dev-night-november-social'],
  ]) {
    test(name, async ({ page }) => {
      const detail = new EventDetailPage(page);
      await detail.open(slug);
      await expect(page).toHaveScreenshot(`event-detail-${name}-light.png`);
    });
  }

  test('error', async ({ page }) => {
    await failEventDetail(page, 'azure-data-ai-day-gta');
    const detail = new EventDetailPage(page);
    await detail.startOpening('azure-data-ai-day-gta');
    await expect(detail.errorState).toBeVisible();
    await expect(page).toHaveScreenshot('event-detail-error-light.png');
  });

  test('phone with the docked bar', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    const detail = new EventDetailPage(page);
    await detail.open('azure-data-ai-day-gta');
    await expect(page).toHaveScreenshot('event-detail-default-phone.png');
  });

  test('dark theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    const detail = new EventDetailPage(page);
    await detail.open('azure-data-ai-day-gta');
    await expect(page).toHaveScreenshot('event-detail-default-dark.png');
  });
});
