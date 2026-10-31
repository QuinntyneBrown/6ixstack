import { Locator, Page } from '@playwright/test';
import { AppShell } from './app-shell';

/** The About page (`/about`). */
export class AboutPage {
  readonly shell: AppShell;
  readonly heading: Locator;
  readonly stats: Locator;
  readonly prose: Locator;
  readonly getInTouch: Locator;

  constructor(private readonly page: Page) {
    this.shell = new AppShell(page);
    this.heading = page.getByRole('heading', { name: 'About 6ixstack', level: 1 });
    this.stats = page.locator('sx-stats-row');
    this.prose = page.locator('.prose');
    this.getInTouch = this.prose.getByRole('link', { name: 'Get in touch' });
  }

  async open(): Promise<void> {
    await this.page.goto('/about');
    await this.heading.waitFor();
  }

  /** The value shown for the stat with this label. */
  stat(label: string | RegExp): Locator {
    return this.stats.locator('sx-stat').filter({ hasText: label }).locator('.stat__value');
  }
}
