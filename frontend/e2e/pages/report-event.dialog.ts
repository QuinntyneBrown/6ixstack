import { Locator, Page } from '@playwright/test';

/** The Report a problem dialog on an event page. */
export class ReportEventDialog {
  readonly panel: Locator;
  readonly description: Locator;
  readonly reasons: Locator;
  readonly reasonError: Locator;
  readonly details: Locator;
  readonly replyEmail: Locator;
  readonly replyEmailError: Locator;
  readonly cancel: Locator;
  readonly send: Locator;
  readonly failure: Locator;
  readonly sent: Locator;
  readonly backToEvent: Locator;

  constructor(private readonly page: Page) {
    this.panel = page.getByRole('dialog', { name: /^(Report a problem|Report sent)$/ });
    this.description = this.panel.locator('#report-description');
    this.reasons = this.panel.getByRole('radio');
    this.reasonError = this.panel.locator('#report-reason-error');
    this.details = this.panel.getByLabel(/^\s*Details/);
    this.replyEmail = this.panel.getByLabel(/^\s*Your email/);
    this.replyEmailError = this.panel.locator('#report-email-error');
    this.cancel = this.panel.getByRole('button', { name: 'Cancel' });
    this.send = this.panel.getByRole('button', { name: /^(Send report|Sending…|Try again)$/ });
    this.failure = this.panel.getByRole('alert').filter({ hasText: "Your report didn't send" });
    this.sent = page.getByRole('dialog', { name: 'Report sent' });
    this.backToEvent = this.sent.getByRole('button', { name: 'Back to the event' });
  }

  reason(label: string): Locator {
    return this.panel.getByRole('radio', { name: label });
  }

  async report(reason: string, details?: string): Promise<void> {
    await this.reason(reason).check();
    if (details) await this.details.fill(details);
    await this.send.click();
  }
}
