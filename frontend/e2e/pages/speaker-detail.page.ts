import { Locator, Page } from '@playwright/test';
import { AppShell } from './app-shell';

/** A speaker's page (`/speakers/{slug}`). */
export class SpeakerDetailPage {
  readonly shell: AppShell;
  readonly backLink: Locator;
  readonly heading: Locator;
  readonly role: Locator;
  readonly communityLink: Locator;
  readonly topics: Locator;
  readonly bio: Locator;
  readonly upcomingRows: Locator;
  readonly noUpcoming: Locator;
  readonly pastItems: Locator;
  readonly facts: Locator;
  readonly invite: Locator;
  readonly loadFailed: Locator;
  readonly skeleton: Locator;
  readonly notFound: Locator;

  constructor(private readonly page: Page) {
    this.shell = new AppShell(page);
    this.backLink = page.getByRole('link', { name: 'All speakers' });
    this.heading = page.getByRole('heading', { level: 1 });
    this.role = page.locator('.speaker-hero__role');
    this.communityLink = this.role.getByRole('link');
    this.topics = page.locator('.speaker-hero sx-topic-tag');
    this.bio = page.locator('.speaker-about p');
    this.upcomingRows = page.locator('.speaker-upcoming .event-row');
    this.noUpcoming = page.locator('sx-empty-state').filter({ hasText: 'No upcoming talks' });
    this.pastItems = page.locator('.speaker-past li');
    this.facts = page.locator('.speaker-facts sx-fact-item');
    this.invite = page.getByRole('link', { name: 'Invite to speak' });
    this.loadFailed = page.locator('sx-empty-state').filter({ hasText: "This profile didn't load" });
    this.skeleton = page.locator('.speaker-skeleton');
    this.notFound = page.getByRole('heading', { name: "We can't find that page" });
  }

  async open(slug: string): Promise<void> {
    await this.page.goto(`/speakers/${slug}`);
  }

  fact(label: string): Locator {
    return this.facts.filter({ hasText: label });
  }
}
