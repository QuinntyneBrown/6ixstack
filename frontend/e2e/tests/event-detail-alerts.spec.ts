import { expect, test } from '../fixtures';
import { EventDetailPage } from '../pages/event-detail.page';
import { stubEventDetail } from '../support/stub-api';

// L2-022 event status alerts (the API decides them; see EventDetailAlertTests); design: view-event-detail.
test.describe('Event status alerts', () => {
  test.beforeEach(async ({ page }) => {
    await stubEventDetail(page, 'azure-data-ai-day-gta', 'event-detail-alerts');
  });

  test('shows the time change, sold out, confirmation and organizer note in order', async ({ page }) => {
    const detail = new EventDetailPage(page);
    await detail.open('azure-data-ai-day-gta');

    await expect(detail.alerts.locator('.alert__title')).toHaveText([
      'Start time changed to 9:30 AM',
      'Sold out',
      'Confirmed by the organizer',
      'Lab seats are first come, first served',
    ]);
    await expect(detail.alert('Start time changed to 9:30 AM')).toHaveClass(/alert--warning/);
    await expect(detail.alertAction('Start time changed to 9:30 AM', 'Update my calendar')).toBeVisible();
    await expect(detail.alert('Sold out')).toHaveAttribute('role', 'alert');
    await expect(detail.alert('Confirmed by the organizer')).toHaveClass(/alert--success/);
    await expect(detail.alert('Lab seats are first come, first served')).toContainText('Hall B fits 60.');
  });

  test('Join the waitlist opens the ticket page in a new tab', async ({ page }) => {
    const detail = new EventDetailPage(page);
    await detail.open('azure-data-ai-day-gta');

    const waitlist = detail.alertAction('Sold out', 'Join the waitlist');
    await expect(waitlist).toHaveAttribute('href', 'https://tickets.example.com/azure-data-ai-day-gta');
    await expect(waitlist).toHaveAttribute('target', '_blank');
    await expect(waitlist).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
