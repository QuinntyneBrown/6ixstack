import { Locator, Page } from '@playwright/test';
import { AppShell } from './app-shell';
import { DirectoryCardPart } from './communities.page';

/** The speakers directory (`/speakers`). */
export class SpeakersPage {
  readonly shell: AppShell;
  readonly heading: Locator;
  readonly lead: Locator;
  readonly search: Locator;
  readonly topic: Locator;
  readonly period: Locator;
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
    this.search = page.getByRole('searchbox', { name: 'Search speakers' });
    this.topic = page.getByLabel('Topic', { exact: true });
    this.period = page.getByLabel('Speaking', { exact: true });
    this.cards = page.locator('.card-grid sx-directory-card');
    this.skeletonCards = page.locator('.card-grid .skeleton-card');
    this.caption = page.locator('.load-more .text-caption');
    this.showMore = page.getByRole('button', { name: 'Show 24 more' });
    this.empty = page.locator('sx-empty-state');
    this.failure = page.getByRole('alert').filter({ hasText: "We couldn't load speakers" });
  }

  async open(query = ''): Promise<void> {
    await this.page.goto(`/speakers${query}`);
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
