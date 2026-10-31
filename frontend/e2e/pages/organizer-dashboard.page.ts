import { Locator, Page } from '@playwright/test';
import { AppShell } from './app-shell';

/** One row of the dashboard table. */
export class DashboardRowPart {
  readonly title: Locator;
  readonly status: Locator;
  readonly reason: Locator;
  readonly going: Locator;
  readonly view: Locator;
  readonly actions: Locator;

  constructor(readonly root: Locator) {
    this.title = root.locator('.dash-row__title');
    this.status = root.locator('sx-badge');
    this.reason = root.locator('.dash-row__reason');
    this.going = root.locator('td.num');
    this.view = root.getByRole('link', { name: /^View/ });
    this.actions = root.locator('td:last-child').getByRole('button');
  }
}

/** The organizer dashboard (`/organize`). */
export class OrganizerDashboardPage {
  readonly shell: AppShell;
  readonly heading: Locator;
  readonly lead: Locator;
  readonly newEvent: Locator;
  readonly stats: Locator;
  readonly statSkeletons: Locator;
  readonly rows: Locator;
  readonly skeletonRows: Locator;
  readonly dateHeader: Locator;
  readonly sortByDate: Locator;
  readonly banner: Locator;
  readonly empty: Locator;
  readonly failure: Locator;

  constructor(private readonly page: Page) {
    this.shell = new AppShell(page);
    this.heading = page.getByRole('heading', { level: 1 });
    this.lead = page.locator('.page-title .lead');
    this.newEvent = page.getByRole('link', { name: 'New event' });
    this.stats = page.locator('sx-stat');
    this.statSkeletons = page.locator('sx-stat sx-skeleton');
    this.rows = page.locator('sx-table tbody tr:not(.skeleton-row)');
    this.skeletonRows = page.locator('sx-table tbody tr.skeleton-row');
    this.dateHeader = page.getByRole('columnheader', { name: /^Date/ });
    this.sortByDate = this.dateHeader.getByRole('button');
    this.banner = page.locator('.submission-banner sx-alert');
    this.empty = page.locator('.empty').filter({ hasText: 'List your first event' });
    this.failure = page.getByRole('alert').filter({ hasText: 'We couldn’t load your events' });
  }

  async open(): Promise<void> {
    await this.page.goto('/organize');
    await this.heading.waitFor();
  }

  row(title: string): DashboardRowPart {
    return new DashboardRowPart(
      this.rows.filter({ has: this.page.locator('.dash-row__title', { hasText: title }) }),
    );
  }

  async titles(): Promise<string[]> {
    return this.rows.locator('.dash-row__title').allInnerTexts();
  }

  statValue(label: string): Locator {
    return this.stats.filter({ hasText: label }).locator('.stat__value');
  }

  bannerAction(name: string): Locator {
    return this.banner.getByRole('link', { name }).or(this.banner.getByRole('button', { name }));
  }

  bannerClose(): Locator {
    return this.banner.getByRole('button', { name: /^Dismiss/ });
  }
}
