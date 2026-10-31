import { Locator, Page } from '@playwright/test';

/** The Reject “{title}”? dialog on the review queue. */
export class RejectSubmissionDialog {
  readonly panel: Locator;
  readonly title: Locator;
  readonly description: Locator;
  readonly reasons: Locator;
  readonly reasonError: Locator;
  readonly message: Locator;
  readonly cancel: Locator;
  readonly submit: Locator;
  readonly failure: Locator;

  constructor(private readonly page: Page) {
    this.panel = page.getByRole('dialog', { name: /^Reject “/ });
    this.title = this.panel.locator('.dialog__title');
    this.description = this.panel.locator('#reject-description');
    this.reasons = this.panel.getByRole('radio');
    this.reasonError = this.panel.locator('#reason-error');
    this.message = this.panel.getByLabel(/^\s*Message to the organizer/);
    this.cancel = this.panel.getByRole('button', { name: 'Cancel' });
    this.submit = this.panel.getByRole('button', { name: /^(Reject submission|Rejecting…|Try again)$/ });
    this.failure = this.panel.getByRole('alert').filter({ hasText: 'The submission wasn’t rejected' });
  }

  reason(label: string): Locator {
    return this.panel.getByRole('radio', { name: label });
  }

  async rejectWith(reason: string, message?: string): Promise<void> {
    await this.reason(reason).check();
    if (message) await this.message.fill(message);
    await this.submit.click();
  }
}

/** The sent-email dialog opened by View email. */
export class SentEmailDialog {
  readonly panel: Locator;
  readonly recipient: Locator;
  readonly body: Locator;

  constructor(page: Page) {
    this.panel = page.getByRole('dialog', { name: /wasn’t approved|needs changes/ });
    this.recipient = this.panel.locator('.sent-email__to');
    this.body = this.panel.locator('.sent-email__body');
  }
}
