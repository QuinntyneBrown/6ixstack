import { Locator, Page } from '@playwright/test';
import { AppShell } from './app-shell';

/** One card in the communities directory. */
export class DirectoryCardPart {
  readonly title: Locator;
  readonly sub: Locator;
  readonly description: Locator;
  readonly next: Locator;
  readonly topics: Locator;

  constructor(readonly root: Locator) {
    this.title = root.locator('.dir-card__title a');
    this.sub = root.locator('.dir-card__sub');
    this.description = root.locator('.dir-card__desc');
    this.next = root.locator('.dir-card__foot .meta-item');
    this.topics = root.locator('.topic-tag');
  }
}

/** The communities directory (`/communities`). */
export class CommunitiesPage {
  readonly shell: AppShell;
  readonly heading: Locator;
  readonly lead: Locator;
  readonly search: Locator;
  readonly topic: Locator;
  readonly city: Locator;
  readonly sort: Locator;
  readonly cards: Locator;
  readonly skeletonCards: Locator;
  readonly caption: Locator;
  readonly showMore: Locator;
  readonly empty: Locator;
  readonly failure: Locator;

  constructor(private readonly page: Page) {
    this.shell = new AppShell(page);
    this.heading = page.getByRole('heading', { level: 1 });
    this.lead = page.locator('.page-title .lead');
    this.search = page.getByRole('searchbox', { name: 'Search communities' });
    this.topic = page.getByLabel('Topic', { exact: true });
    this.city = page.getByLabel('City', { exact: true });
    this.sort = page.getByLabel('Sort by');
    this.cards = page.locator('.card-grid sx-directory-card');
    this.skeletonCards = page.locator('.card-grid .skeleton-card');
    this.caption = page.locator('.load-more .text-caption');
    this.showMore = page.getByRole('button', { name: 'Show 20 more' });
    this.empty = page.locator('sx-empty-state');
    this.failure = page.getByRole('alert').filter({ hasText: "We couldn't load communities" });
  }

  async open(query = ''): Promise<void> {
    await this.page.goto(`/communities${query}`);
    await this.heading.waitFor();
  }

  card(name: string): DirectoryCardPart {
    return new DirectoryCardPart(
      this.cards.filter({ has: this.page.getByRole('link', { name, exact: true }) }),
    );
  }

  async names(): Promise<string[]> {
    return this.cards.locator('.dir-card__title a').allInnerTexts();
  }

  async searchFor(text: string): Promise<void> {
    await this.search.fill(text);
    await this.search.press('Enter');
  }

  emptyAction(name: string): Locator {
    return this.empty.getByRole('link', { name }).or(this.empty.getByRole('button', { name }));
  }

  url(): URL {
    return new URL(this.page.url());
  }
}
