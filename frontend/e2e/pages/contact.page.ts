import { Locator, Page } from '@playwright/test';
import { AppShell } from './app-shell';

/** The contact page (`/contact`). */
export class ContactPage {
  readonly shell: AppShell;
  readonly heading: Locator;
  readonly name: Locator;
  readonly email: Locator;
  readonly topic: Locator;
  readonly message: Locator;
  readonly send: Locator;
  readonly summary: Locator;
  readonly sent: Locator;
  readonly failure: Locator;
  readonly otherWays: Locator;

  constructor(private readonly page: Page) {
    this.shell = new AppShell(page);
    this.heading = page.getByRole('heading', { level: 1 });
    this.name = page.getByLabel('Your name');
    this.email = page.getByLabel('Email', { exact: true });
    this.topic = page.getByLabel('What is it about?');
    this.message = page.getByLabel('Message', { exact: true });
    this.send = page.getByRole('button', { name: /^(Send message|Sending…|Try again)$/ });
    this.summary = page.locator('.form-summary');
    this.sent = page.locator('sx-success-panel');
    this.failure = page.getByRole('alert').filter({ hasText: "Your message didn't send" });
    this.otherWays = page.locator('.contact-ways');
  }

  async open(): Promise<void> {
    await this.page.goto('/contact');
    await this.heading.waitFor();
  }

  async fill(name: string, email: string, topic: string, message: string): Promise<void> {
    await this.name.fill(name);
    await this.email.fill(email);
    await this.topic.selectOption({ label: topic });
    await this.message.fill(message);
  }

  summaryItems(): Locator {
    return this.summary.getByRole('link');
  }
}
