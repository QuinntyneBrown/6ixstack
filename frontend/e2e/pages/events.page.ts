import { Page } from '@playwright/test';
import { AppShell } from './app-shell';

/** The events page (`/`). Journey 01 adds the list; the scaffold supplies its frame. */
export class EventsPage {
  readonly shell: AppShell;

  constructor(private readonly page: Page) {
    this.shell = new AppShell(page);
  }

  async open(): Promise<void> {
    await this.page.goto('/');
    await this.shell.main.waitFor();
  }
}
