import { Locator, Page } from '@playwright/test';
import { AppShell } from './app-shell';

/** The sign-in page (`/sign-in`): request a magic link, see it was sent, or recover from an expired one. */
export class SignInPage {
  readonly shell: AppShell;
  readonly heading: Locator;
  readonly email: Locator;
  readonly emailError: Locator;
  readonly sendButton: Locator;
  readonly sendingButton: Locator;
  readonly errorSummary: Locator;
  readonly expired: Locator;
  readonly sent: Locator;
  readonly resend: Locator;
  readonly differentEmail: Locator;

  constructor(private readonly page: Page) {
    this.shell = new AppShell(page);
    this.heading = page.getByRole('heading', { level: 1 });
    this.email = page.getByLabel('Email', { exact: true });
    this.emailError = page.locator('#email-error');
    this.sendButton = page.getByRole('button', { name: 'Email me a sign-in link' });
    this.sendingButton = page.getByRole('button', { name: 'Sending link…' });
    this.errorSummary = page.locator('.form-summary');
    this.expired = page.getByRole('alert').filter({ hasText: 'That sign-in link has expired' });
    this.sent = page.locator('.success-panel');
    this.resend = page.getByRole('button', { name: /^Resend link/ });
    this.differentEmail = page.getByRole('button', { name: 'Use a different email' });
  }

  async open(query = ''): Promise<void> {
    await this.page.goto(`/sign-in${query}`);
    await this.heading.waitFor();
  }

  summaryTitle(): Locator {
    return this.errorSummary.locator('.alert__title');
  }

  summaryItems(): Locator {
    return this.errorSummary.locator('li');
  }

  sentText(): Locator {
    return this.sent.locator('p').first();
  }

  async requestLink(email: string): Promise<void> {
    await this.email.fill(email);
    await this.sendButton.click();
  }

  /** Remembers `email` as the last requested address, as an earlier request in this browser would have. */
  async rememberEmail(email: string): Promise<void> {
    await this.page.addInitScript((value) => localStorage.setItem('sx.sign-in.email', value), email);
  }
}
