import { Locator, Page } from '@playwright/test';

/** The "Share this event" dialog. */
export class ShareEventDialog {
  readonly panel: Locator;
  readonly summary: Locator;
  readonly link: Locator;
  readonly copy: Locator;

  constructor(private readonly page: Page) {
    this.panel = page.getByRole('dialog', { name: 'Share this event' });
    this.summary = this.panel.locator('#share-event-description');
    this.link = this.panel.getByLabel('Event link');
    this.copy = this.panel.getByRole('button', { name: /^(Copy|Copied)$/ });
  }

  option(name: 'LinkedIn' | 'Bluesky' | 'Email'): Locator {
    return this.panel.getByRole('link', { name: new RegExp(`^${name}`) });
  }

  toast(title: string): Locator {
    return this.page
      .locator('.toast')
      .filter({ has: this.page.locator('.toast__title', { hasText: title }) });
  }
}
