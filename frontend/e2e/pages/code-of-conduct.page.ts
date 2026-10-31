import { Locator, Page } from '@playwright/test';
import { AppShell } from './app-shell';

/** The Code of Conduct page (`/code-of-conduct`). */
export class CodeOfConductPage {
  readonly shell: AppShell;
  readonly heading: Locator;
  readonly prose: Locator;
  readonly conductEmail: Locator;
  readonly lastUpdated: Locator;

  constructor(private readonly page: Page) {
    this.shell = new AppShell(page);
    this.heading = page.getByRole('heading', { name: 'Code of conduct', level: 1 });
    this.prose = page.locator('.prose');
    this.conductEmail = this.prose.getByRole('link', { name: 'conduct@6ixstack.dev' });
    this.lastUpdated = this.prose.getByText(/^Last updated /);
  }

  async open(): Promise<void> {
    await this.page.goto('/code-of-conduct');
    await this.heading.waitFor();
  }

  section(name: string): Locator {
    return this.prose.getByRole('heading', { name, level: 2 });
  }
}
