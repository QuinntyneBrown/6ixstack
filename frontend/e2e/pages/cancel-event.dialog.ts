import { Locator, Page } from '@playwright/test';

/** The Cancel “{title}”? dialog, opened from the dashboard or the edit page. */
export class CancelEventDialog {
  readonly panel: Locator;
  readonly description: Locator;
  readonly reason: Locator;
  readonly reasonError: Locator;
  readonly emailAttendees: Locator;
  readonly confirmName: Locator;
  readonly keep: Locator;
  readonly confirm: Locator;
  readonly failure: Locator;

  constructor(private readonly page: Page) {
    this.panel = page.getByRole('dialog', { name: /^Cancel “/ });
    this.description = this.panel.locator('#cancel-description');
    this.reason = this.panel.getByLabel(/^\s*Reason for attendees/);
    this.reasonError = this.panel.locator('#cancel-reason-error');
    this.emailAttendees = this.panel.getByRole('checkbox', { name: /^Email the / });
    this.confirmName = this.panel.getByLabel(/^\s*Type the event name to confirm/);
    this.keep = this.panel.getByRole('button', { name: 'Keep event' });
    this.confirm = this.panel.getByRole('button', { name: /^(Cancel event|Cancelling…|Try again)$/ });
    this.failure = this.panel.getByRole('alert').filter({ hasText: 'The event wasn’t cancelled' });
  }

  async cancelWith(reason: string): Promise<void> {
    await this.reason.fill(reason);
    await this.confirm.click();
  }

  /** The toast that confirms a cancellation. */
  toast(title: string): Locator {
    return this.page
      .locator('.toast')
      .filter({ has: this.page.locator('.toast__title', { hasText: `Cancelled “${title}”` }) });
  }
}
