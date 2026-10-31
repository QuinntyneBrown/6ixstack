import { Locator, Page } from '@playwright/test';
import { AppShell } from './app-shell';
import { FeedBuilderPart, FeedLinkPart } from './feed-builder.part';

/** The calendar feeds page (`/feeds`). */
export class CalendarFeedsPage {
  readonly shell: AppShell;
  readonly heading: Locator;
  readonly feeds: Locator;
  readonly countSkeletons: Locator;
  readonly failure: Locator;
  readonly howItWorks: Locator;
  readonly builder: FeedBuilderPart;
  readonly ready: Locator;
  readonly result: FeedLinkPart;
  readonly buildAnother: Locator;

  constructor(private readonly page: Page) {
    this.shell = new AppShell(page);
    this.heading = page.getByRole('heading', { level: 1 });
    this.feeds = page.locator('.ready-feeds li');
    this.countSkeletons = page.locator('.ready-feeds sx-skeleton');
    this.failure = page.getByRole('alert').filter({ hasText: 'We couldn’t load the ready-made feeds' });
    this.howItWorks = page.getByRole('heading', { name: 'How it works' });
    this.builder = new FeedBuilderPart(page.locator('.feed-builder'));
    this.ready = page.locator('.feed-ready');
    this.result = new FeedLinkPart(this.ready);
    this.buildAnother = page.getByRole('button', { name: 'Build another feed' });
  }

  async open(): Promise<void> {
    await this.page.goto('/feeds');
    await this.heading.waitFor();
  }

  feed(name: string): Locator {
    return this.feeds.filter({
      has: this.page.locator('.list__title', { hasText: new RegExp(`^${name.replace('.', '\\.')}$`) }),
    });
  }

  meta(name: string): Locator {
    return this.feed(name).locator('.list__meta');
  }

  copy(name: string): Locator {
    return this.page.getByRole('button', { name: `Copy the ${name} feed link` });
  }

  toast(title: string): Locator {
    return this.page
      .locator('.toast')
      .filter({ has: this.page.locator('.toast__title', { hasText: title }) });
  }

  toastAction(title: string, action: string): Locator {
    return this.toast(title).getByRole('button', { name: action });
  }

  async clipboardText(): Promise<string> {
    return this.page.evaluate(() => navigator.clipboard.readText());
  }
}
