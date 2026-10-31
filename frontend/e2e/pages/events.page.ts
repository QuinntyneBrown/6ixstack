import { Locator, Page } from '@playwright/test';
import { AppShell } from './app-shell';

type Format = 'All' | 'In the GTA' | 'Streaming';

/** The events page (`/`): hero, filter bar, result line, day groups, load more and its states. */
export class EventsPage {
  readonly shell: AppShell;
  readonly heroStat: Locator;
  readonly resultLine: Locator;
  readonly dayHeadings: Locator;
  readonly rows: Locator;
  readonly search: Locator;
  readonly formatSwitch: Locator;
  readonly topicChips: Locator;
  readonly emptyState: Locator;
  readonly loadMoreCaption: Locator;
  readonly showMore: Locator;
  readonly errorAlert: Locator;

  constructor(private readonly page: Page) {
    this.shell = new AppShell(page);
    this.heroStat = page.locator('.hero__stat');
    this.resultLine = page.locator('.result-line');
    this.dayHeadings = page.locator('.day-group__heading');
    this.rows = page.locator('.event-row');
    this.search = page.getByRole('searchbox', { name: 'Search events' });
    this.formatSwitch = page.getByRole('group', { name: 'Where' });
    this.topicChips = page.getByRole('group', { name: 'Topics' }).getByRole('button');
    this.emptyState = page.locator('.empty');
    this.loadMoreCaption = page.locator('.load-more .text-caption');
    this.showMore = page.getByRole('button', { name: 'Show 20 more' });
    this.errorAlert = page.getByRole('alert').filter({ hasText: "We couldn't load events" });
  }

  async open(query = ''): Promise<void> {
    await this.page.goto(`/${query}`);
    await this.shell.main.waitFor();
    await this.page.locator('.result-line, .empty, .alert').first().waitFor();
  }

  async dayHeadingTexts(): Promise<string[]> {
    return (await this.dayHeadings.allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());
  }

  row(title: string): EventRowPart {
    return new EventRowPart(
      this.rows.filter({ has: this.page.getByRole('link', { name: title, exact: true }) }),
    );
  }

  async rowTitles(): Promise<string[]> {
    return this.rows.locator('.event-row__title').allInnerTexts();
  }

  formatOption(format: Format): Locator {
    return this.formatSwitch.getByRole('button').filter({ hasText: format });
  }

  async formatCount(format: Format): Promise<string> {
    return (await this.formatOption(format).locator('.segmented__count').innerText()).trim();
  }

  async chooseFormat(format: Format): Promise<void> {
    await this.formatOption(format).click();
  }

  topicChip(name: string): Locator {
    return this.page.getByRole('group', { name: 'Topics' }).getByRole('button', { name, exact: true });
  }

  async toggleTopic(name: string): Promise<void> {
    await this.topicChip(name).click();
  }

  async searchFor(text: string): Promise<void> {
    await this.search.fill(text);
    await this.search.press('Enter');
  }

  clearFilters(): Locator {
    return this.page
      .getByRole('button', { name: 'Clear filters' })
      .or(this.page.getByRole('link', { name: 'Clear filters' }))
      .first();
  }

  emptyAction(name: string): Locator {
    return this.emptyState.getByRole('link', { name }).or(this.emptyState.getByRole('button', { name }));
  }

  errorAction(name: string): Locator {
    return this.errorAlert.getByRole('button', { name }).or(this.errorAlert.getByRole('link', { name }));
  }

  /** The toast raised by the page, found by its title. */
  toast(title: string): Locator {
    return this.page
      .locator('.toast')
      .filter({ has: this.page.locator('.toast__title', { hasText: title }) });
  }

  toastAction(title: string, action: string): Locator {
    return this.toast(title).getByRole('button', { name: action });
  }

  get skeletons(): Locator {
    return this.page.locator('.skeleton');
  }

  async hasHorizontalScroll(): Promise<boolean> {
    return this.shell.hasHorizontalScroll();
  }

  url(): URL {
    return new URL(this.page.url());
  }
}

/** One event row in the list. */
export class EventRowPart {
  constructor(readonly root: Locator) {}

  get time(): Locator {
    return this.root.locator('.event-row__time time');
  }
  get sourceTime(): Locator {
    return this.root.locator('.event-row__source');
  }
  get title(): Locator {
    return this.root.locator('.event-row__title a');
  }
  get organizer(): Locator {
    return this.root.locator('.event-row__org');
  }
  get location(): Locator {
    return this.root.locator('.meta-item').first();
  }
  get stream(): Locator {
    return this.root.locator('.meta-item--stream');
  }
  get topics(): Locator {
    return this.root.locator('.topic-tag');
  }
  get price(): Locator {
    return this.root.locator('.event-row__price');
  }
  get going(): Locator {
    return this.root.locator('.going');
  }
  badge(text: string): Locator {
    return this.root.locator('.badge', { hasText: text });
  }
}
