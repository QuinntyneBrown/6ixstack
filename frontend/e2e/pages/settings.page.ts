import { Locator, Page } from '@playwright/test';
import { AppShell } from './app-shell';

/** The settings page (`/settings`). */
export class SettingsPage {
  readonly shell: AppShell;
  readonly heading: Locator;
  readonly lead: Locator;
  readonly sectionNav: Locator;
  readonly name: Locator;
  readonly email: Locator;
  readonly website: Locator;
  readonly communityField: Locator;
  readonly decisionsSwitch: Locator;
  readonly reportsSwitch: Locator;
  readonly weeklySwitch: Locator;
  readonly communityLine: Locator;
  readonly save: Locator;
  readonly summary: Locator;
  readonly saved: Locator;
  readonly loadFailed: Locator;
  readonly skeleton: Locator;
  readonly deleteAccount: Locator;

  constructor(private readonly page: Page) {
    this.shell = new AppShell(page);
    this.heading = page.getByRole('heading', { level: 1 });
    this.lead = page.locator('.page-title .lead');
    this.sectionNav = page.getByRole('navigation', { name: 'Settings sections' });
    this.name = page.getByLabel('Name', { exact: true });
    this.email = page.getByLabel('Email', { exact: true });
    this.website = page.getByLabel(/^\s*Website/);
    this.communityField = page.getByRole('textbox', { name: 'Community', exact: true });
    this.decisionsSwitch = page.getByRole('switch', { name: 'My event is approved or needs changes' });
    this.reportsSwitch = page.getByRole('switch', { name: 'Someone reports a problem with my event' });
    this.weeklySwitch = page.getByRole('switch', { name: 'Weekly summary of going and feed numbers' });
    this.communityLine = page.locator('.settings-community');
    this.save = page.getByRole('button', { name: /^(Save settings|Saving…)$/ });
    this.summary = page.locator('.form-summary');
    this.saved = page.locator('sx-alert').filter({ hasText: 'Settings saved' });
    this.loadFailed = page.getByRole('alert').filter({ hasText: 'We couldn’t load your settings' });
    this.skeleton = page.locator('.settings-skeleton');
    this.deleteAccount = page.getByRole('button', { name: 'Delete account' });
  }

  async open(): Promise<void> {
    await this.page.goto('/settings');
    await this.heading.waitFor();
  }

  summaryItems(): Locator {
    return this.summary.getByRole('link');
  }
}
