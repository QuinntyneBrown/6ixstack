import { Locator, Page } from '@playwright/test';

/** The "Sign out of 6ixstack?" dialog on the settings page. */
export class SignOutDialog {
  readonly panel: Locator;
  readonly description: Locator;
  readonly stay: Locator;
  readonly signOut: Locator;

  constructor(page: Page) {
    this.panel = page.getByRole('dialog', { name: 'Sign out of 6ixstack?' });
    this.description = this.panel.locator('#sign-out-description');
    this.stay = this.panel.getByRole('button', { name: 'Stay signed in' });
    this.signOut = this.panel.getByRole('button', { name: /^(Sign out|Signing out…)$/ });
  }
}
