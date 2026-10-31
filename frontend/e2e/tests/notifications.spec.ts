import { expect, test } from '../fixtures';
import { NotificationsPage } from '../pages/notifications.page';
import { ownEvent } from '../support/editing';
import { CO_ORGANIZER, MODERATOR, signInAs } from '../support/session';
import { failNotifications, noNotifications, slowNotifications } from '../support/stub-api';

// L2-065 notifications page; design: notifications/in-app-notifications. Tests that mark items read use their own
// new organizer, so the seeded co-organizer's notifications stay unread.
test.describe('Notifications', () => {
  test('lists newest first with unread items marked for eyes and screen readers', async ({ page }) => {
    await signInAs(page, CO_ORGANIZER);
    const notifications = new NotificationsPage(page);
    await notifications.open();

    await expect(notifications.heading).toHaveText('Notifications');
    await expect(notifications.lead).toHaveText('3 unread');
    await expect(notifications.items).toHaveCount(5);
    await expect(notifications.unreadItems).toHaveCount(3);
    const first = notifications.item('1,204 people now follow your events in a feed');
    await expect(first.title).toContainText('(unread)');
    await expect(first.time).toHaveText('Yesterday');
    await expect(notifications.item('“Copilot Studio for developers” is live').title).not.toContainText(
      '(unread)',
    );
    await expect(notifications.shell.notifications).toHaveAccessibleName('Notifications, 3 unread');
  });

  test('the header shows the unread count on every page', async ({ page }) => {
    await signInAs(page, CO_ORGANIZER);
    const notifications = new NotificationsPage(page);

    await page.goto('/organize');

    await expect(notifications.shell.notifications).toHaveAccessibleName('Notifications, 3 unread');
    await expect(notifications.shell.notificationsBadge).toHaveText('3');
  });

  test('opening one marks it read', async ({ page, baseURL }) => {
    const own = await ownEvent(page, baseURL!, `Read check ${Date.now()}`, 'sentBack');
    const notifications = new NotificationsPage(page);
    await notifications.open();
    const item = notifications.item(`“${own.title}” needs changes`);
    await expect(item.title).toContainText('(unread)');

    await item.link.click();

    await expect(page).toHaveURL(/\/organize$/);
    await notifications.open();
    await expect(notifications.item(`“${own.title}” needs changes`).title).not.toContainText('(unread)');
    await expect(notifications.lead).toHaveText('All caught up');
  });

  test('Mark all as read clears the dots, the badge and the button', async ({ page, baseURL }) => {
    await ownEvent(page, baseURL!, `Mark all check ${Date.now()}`, 'sentBack');
    const notifications = new NotificationsPage(page);
    await notifications.open();
    await expect(notifications.lead).toHaveText('1 unread');
    await expect(notifications.shell.notificationsBadge).toHaveText('1');

    await notifications.markAllRead.click();

    await expect(notifications.unreadItems).toHaveCount(0);
    await expect(notifications.lead).toHaveText('All caught up');
    await expect(notifications.markAllRead).toHaveCount(0);
    await expect(notifications.shell.notificationsBadge).toHaveCount(0);
  });

  test('a moderator is told about a new submission', async ({ page }) => {
    await page.request.post('/api/submissions', {
      data: {
        title: `Notification check ${Date.now()}`,
        organizerName: 'Toronto Test Meetup',
        description: 'A short talk about testing developer tools.',
        topics: ['dotnet'],
        date: '2026-12-02',
        timeZoneId: 'America/Toronto',
        startTime: '18:00',
        endTime: '20:00',
        format: 'inPerson',
        venueName: 'Centre for Social Innovation',
        city: 'Toronto',
        streetAddress: '192 Spadina Ave',
        streamUrl: null,
        isFree: true,
        priceCad: null,
        ticketUrl: null,
        contactEmail: `notify-${Date.now()}@example.com`,
      },
    });
    await signInAs(page, MODERATOR);
    const notifications = new NotificationsPage(page);
    await notifications.open();

    await expect(notifications.item('New submission: “Notification check').link.first()).toHaveAttribute(
      'href',
      '/admin/review',
    );
  });

  test('with nothing yet, it explains what will appear', async ({ page }) => {
    await signInAs(page, CO_ORGANIZER);
    await noNotifications(page);
    const notifications = new NotificationsPage(page);
    await notifications.open();

    await expect(notifications.lead).toHaveText('Nothing new');
    await expect(notifications.empty).toContainText(
      'When moderators review your events or people report a problem, you’ll see it here.',
    );
  });

  test('a failed load offers Try again', async ({ page }) => {
    await signInAs(page, CO_ORGANIZER);
    const restore = await failNotifications(page);
    const notifications = new NotificationsPage(page);
    await notifications.open();

    await expect(notifications.lead).toHaveText('Unavailable');
    await expect(notifications.failure).toContainText(
      'Important updates are also emailed to marcus@gtaazure.ca.',
    );
    await restore();
    await notifications.failure.getByRole('button', { name: 'Try again' }).click();
    await expect(notifications.items.first()).toBeVisible();
  });

  test('a slow load shows four skeleton rows', async ({ page }) => {
    await signInAs(page, CO_ORGANIZER);
    await slowNotifications(page, 2_000);
    const notifications = new NotificationsPage(page);
    await notifications.open();

    await expect(notifications.skeletonRows).toHaveCount(4);
    await expect(notifications.items.first()).toBeVisible({ timeout: 10_000 });
  });
});
