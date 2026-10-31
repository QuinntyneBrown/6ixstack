import { expect, test } from '../fixtures';
import { EventDetailPage } from '../pages/event-detail.page';
import { failIcs, slowIcs } from '../support/stub-api';

// L2-037 AC2 busy and AC3 failed, L2-077; design: docs/detailed-designs/feeds-and-sharing/add-to-calendar.
test.describe('Add to my calendar states', () => {
  test('the chosen file option is busy while the others stay usable', async ({ page }) => {
    await slowIcs(page, 'azure-data-ai-day-gta', 2_000);
    const detail = new EventDetailPage(page);
    await detail.open('azure-data-ai-day-gta');
    const dialog = await detail.openAddToCalendar();

    await dialog.option('Apple Calendar').click();

    await expect(dialog.option('Apple Calendar')).toHaveAttribute('aria-busy', 'true');
    await expect(dialog.option('Google Calendar')).not.toHaveAttribute('aria-busy', 'true');
    await expect(dialog.option('Other app (.ics file)')).toBeEnabled();
    await expect(dialog.option('Outlook')).toBeVisible();
  });

  test('a failed file suggests Google or Outlook and keeps every option', async ({ page }) => {
    const recover = await failIcs(page, 'azure-data-ai-day-gta');
    const detail = new EventDetailPage(page);
    await detail.open('azure-data-ai-day-gta');
    const dialog = await detail.openAddToCalendar();

    await dialog.option('Apple Calendar').click();

    await expect(dialog.failure).toContainText("We couldn't create the calendar file");
    await expect(dialog.failure).toContainText(
      'Try again, or add it with Google Calendar or Outlook instead.',
    );
    await expect(dialog.options).toHaveCount(4);
    await expect(dialog.option('Apple Calendar')).not.toHaveAttribute('aria-busy', 'true');

    await recover();
    const file = await dialog.download('Apple Calendar');
    expect(file.suggestedFilename()).toBe('azure-data-ai-day-gta.ics');
  });
});
