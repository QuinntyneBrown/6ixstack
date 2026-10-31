import { Locator, Page } from '@playwright/test';
import { AppShell } from './app-shell';

/** The status pages: not found (404), forbidden (403), server error (500) and offline. */
export class StatusPage {
  readonly shell: AppShell;
  readonly heading: Locator;
  readonly code: Locator;
  readonly message: Locator;

  constructor(private readonly page: Page) {
    this.shell = new AppShell(page);
    this.heading = page.getByRole('heading', { level: 1 });
    this.code = page.locator('.status-page__code');
    this.message = page.locator('.status-page p').first();
  }

  async open(path: string): Promise<void> {
    await this.page.goto(path);
    await this.heading.waitFor();
  }

  action(name: string): Locator {
    return this.page.locator('.status-page').getByRole('link', { name, exact: true });
  }

  actionButton(name: string): Locator {
    return this.page.locator('.status-page').getByRole('button', { name, exact: true });
  }

  url(): string {
    return new URL(this.page.url()).pathname;
  }

  title(): Promise<string> {
    return this.page.title();
  }
}
