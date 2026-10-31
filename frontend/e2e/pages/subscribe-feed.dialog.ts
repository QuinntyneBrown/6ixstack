import { Locator, Page } from '@playwright/test';
import { FeedBuilderPart, FeedLinkPart } from './feed-builder.part';

/** The "Subscribe to a calendar feed" dialog. */
export class SubscribeFeedDialog {
  readonly panel: Locator;
  readonly description: Locator;
  readonly builder: FeedBuilderPart;
  readonly result: FeedLinkPart;
  readonly failure: Locator;
  readonly ready: Locator;
  readonly cancel: Locator;
  readonly done: Locator;

  constructor(page: Page) {
    this.panel = page.getByRole('dialog', { name: 'Subscribe to a calendar feed' });
    this.description = this.panel.locator('#subscribe-feed-description');
    this.builder = new FeedBuilderPart(this.panel);
    this.result = new FeedLinkPart(this.panel);
    this.failure = this.panel.getByRole('alert').filter({ hasText: 'We couldn’t create your feed' });
    this.ready = this.panel.locator('sx-alert').filter({ hasText: 'Your feed is ready' });
    this.cancel = this.panel.getByRole('button', { name: 'Cancel' });
    this.done = this.panel.getByRole('button', { name: 'Done' });
  }
}
