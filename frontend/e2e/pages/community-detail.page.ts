import { Locator, Page } from '@playwright/test';
import { AppShell } from './app-shell';

/** A community's page (`/communities/{slug}`). */
export class CommunityDetailPage {
  readonly shell: AppShell;
  readonly backLink: Locator;
  readonly heading: Locator;
  readonly tagline: Locator;
  readonly topics: Locator;
  readonly about: Locator;
  readonly upcomingRows: Locator;
  readonly pastItems: Locator;
  readonly facts: Locator;
  readonly subscribe: Locator;
  readonly organizers: Locator;
  readonly nothingScheduled: Locator;
  readonly loadFailed: Locator;
  readonly skeleton: Locator;
  readonly notFound: Locator;

  constructor(private readonly page: Page) {
    this.shell = new AppShell(page);
    this.backLink = page.getByRole('link', { name: 'All communities' });
    this.heading = page.getByRole('heading', { level: 1 });
    this.tagline = page.locator('.community-hero__tagline');
    this.topics = page.locator('.community-hero sx-topic-tag');
    this.about = page.locator('.community-about p');
    this.upcomingRows = page.locator('.community-upcoming .event-row');
    this.pastItems = page.locator('.community-past li');
    this.facts = page.locator('.community-facts sx-fact-item');
    this.subscribe = page.getByRole('button', { name: 'Subscribe to this group' }).first();
    this.organizers = page.locator('.community-organizers sx-person-link');
    this.nothingScheduled = page.locator('sx-empty-state').filter({ hasText: 'Nothing scheduled right now' });
    this.loadFailed = page.locator('sx-empty-state').filter({ hasText: "This community didn't load" });
    this.skeleton = page.locator('.community-skeleton');
    this.notFound = page.getByRole('heading', { name: "We can't find that page" });
  }

  async open(slug: string): Promise<void> {
    await this.page.goto(`/communities/${slug}`);
  }

  pastItem(title: string): Locator {
    return this.pastItems.filter({ hasText: title });
  }

  fact(label: string): Locator {
    return this.facts.filter({ hasText: label });
  }
}
