import { Locator, Page } from '@playwright/test';
import { AppShell } from './app-shell';

/** One notification in the list. */
export class NotificationPart {
  readonly title: Locator;
  readonly link: Locator;
  readonly text: Locator;
  readonly time: Locator;

  constructor(readonly root: Locator) {
    this.title = root.locator('.notif__title');
    this.link = root.locator('.notif__title a');
    this.text = root.locator('.notif__text');
    this.time = root.locator('.notif__time');
  }
}

/** The notifications page (`/notifications`). */
export class NotificationsPage {
  readonly shell: AppShell;
  readonly heading: Locator;
  readonly lead: Locator;
  readonly markAllRead: Locator;
  readonly items: Locator;
  readonly unreadItems: Locator;
  readonly skeletonRows: Locator;
  readonly empty: Locator;
  readonly failure: Locator;
  readonly settingsLink: Locator;

  constructor(private readonly page: Page) {
    this.shell = new AppShell(page);
    this.heading = page.getByRole('heading', { level: 1 });
    this.lead = page.locator('.page-title .lead');
    this.markAllRead = page.getByRole('button', { name: 'Mark all as read' });
    this.items = page.locator('sx-notification-item');
    this.unreadItems = page.locator('sx-notification-item .notif--unread');
    this.skeletonRows = page.locator('.notif-skeleton');
    this.empty = page.locator('sx-empty-state').filter({ hasText: 'No notifications yet' });
    this.failure = page.locator('sx-empty-state').filter({ hasText: 'We couldn’t load notifications' });
    this.settingsLink = page.getByRole('link', { name: 'settings', exact: true });
  }

  async open(): Promise<void> {
    await this.page.goto('/notifications');
    await this.heading.waitFor();
  }

  item(title: string): NotificationPart {
    return new NotificationPart(this.items.filter({ hasText: title }));
  }
}
