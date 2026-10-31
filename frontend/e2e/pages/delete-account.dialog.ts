import { Locator, Page } from '@playwright/test';

/** The "Delete your organizer account?" dialog on the settings page. */
export class DeleteAccountDialog {
  readonly panel: Locator;
  readonly description: Locator;
  readonly email: Locator;
  readonly emailError: Locator;
  readonly keep: Locator;
  readonly confirm: Locator;
  readonly failure: Locator;

  constructor(page: Page) {
    this.panel = page.getByRole('dialog', { name: 'Delete your organizer account?' });
    this.description = this.panel.locator('#delete-account-description');
    this.email = this.panel.getByRole('textbox');
    this.emailError = this.panel.locator('#delete-email-error');
    this.keep = this.panel.getByRole('button', { name: 'Keep account' });
    this.confirm = this.panel.getByRole('button', { name: /^(Delete account|Deleting…|Try again)$/ });
    this.failure = this.panel.getByRole('alert').filter({ hasText: 'Your account wasn’t deleted' });
  }
}
