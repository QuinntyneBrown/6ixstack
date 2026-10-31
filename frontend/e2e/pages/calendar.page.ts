import { expect, Locator, Page } from '@playwright/test';
import { AppShell } from './app-shell';

/** The month calendar (`/calendar`). */
export class CalendarPage {
  readonly shell: AppShell;
  readonly heading: Locator;
  readonly subtitle: Locator;
  readonly monthHeading: Locator;
  readonly grid: Locator;
  readonly previousMonth: Locator;
  readonly nextMonth: Locator;
  readonly today: Locator;
  readonly listView: Locator;
  readonly monthView: Locator;
  readonly legend: Locator;
  readonly alert: Locator;
  readonly dayList: Locator;

  constructor(private readonly page: Page) {
    this.shell = new AppShell(page);
    this.heading = page.getByRole('heading', { level: 1 });
    this.subtitle = page.locator('.page-title .lead');
    this.monthHeading = page.locator('.cal-toolbar h2');
    this.grid = page.getByRole('grid');
    this.previousMonth = page.getByRole('link', { name: /^Previous month, / });
    this.nextMonth = page.getByRole('link', { name: /^Next month, / });
    this.today = page.getByRole('link', { name: 'Today', exact: true });
    this.listView = page.getByRole('group', { name: 'View' }).getByRole('link', { name: 'List' });
    this.monthView = page.getByRole('group', { name: 'View' }).getByRole('link', { name: 'Month' });
    this.legend = page.locator('.cal-legend sx-topic-tag');
    this.alert = page.locator('sx-alert');
    this.dayList = page.locator('sx-calendar-day-list');
  }

  async open(query = ''): Promise<void> {
    await this.page.goto(`/calendar${query}`);
    await this.heading.waitFor();
  }

  /** The grid cell for a day of the shown month, e.g. `day(5)` for the 5th. */
  day(dayOfMonth: number): Locator {
    return this.grid.locator('.cal__day:not(.cal__day--outside)').nth(dayOfMonth - 1);
  }

  dayEvents(dayOfMonth: number): Locator {
    return this.day(dayOfMonth).locator('.cal__event');
  }

  dayMore(dayOfMonth: number): Locator {
    return this.day(dayOfMonth).locator('.cal__more');
  }

  dayDots(dayOfMonth: number): Locator {
    return this.day(dayOfMonth).locator('.cal__dots .topic-dot');
  }

  skeletonChips(): Locator {
    return this.grid.locator('sx-skeleton');
  }

  formatOption(name: 'All' | 'In the GTA' | 'Streaming'): Locator {
    return this.page.getByRole('group', { name: 'Where' }).getByRole('button').filter({ hasText: name });
  }

  topicChip(name: string): Locator {
    return this.page.getByRole('group', { name: 'Topics' }).getByRole('button', { name, exact: true });
  }

  alertAction(name: string): Locator {
    return this.alert.getByRole('button', { name }).or(this.alert.getByRole('link', { name }));
  }

  async waitForMonth(label: string): Promise<void> {
    await expect(this.monthHeading).toHaveText(label);
  }
}
