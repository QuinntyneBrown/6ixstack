import { Locator, Page } from '@playwright/test';
import { AppShell } from './app-shell';

/** Where a sign-in lands: the organizer dashboard (`/organize`) or the review queue (`/admin/review`). */
export class SignedInLandingPage {
  readonly shell: AppShell;
  readonly heading: Locator;
  readonly lead: Locator;

  constructor(private readonly page: Page) {
    this.shell = new AppShell(page);
    this.heading = page.getByRole('heading', { level: 1 });
    this.lead = page.locator('.page-title .lead');
  }

  async open(path: '/organize' | '/admin/review'): Promise<void> {
    await this.page.goto(path);
  }
}
