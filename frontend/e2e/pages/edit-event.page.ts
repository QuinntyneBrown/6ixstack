import { Locator, Page } from '@playwright/test';
import { AppShell } from './app-shell';

/** The edit page (`/organize/events/{id}/edit`), including its forbidden and read-only states. */
export class EditEventPage {
  readonly shell: AppShell;
  readonly heading: Locator;
  readonly lead: Locator;
  readonly backLink: Locator;
  readonly statusLine: Locator;
  readonly title: Locator;
  readonly startTime: Locator;
  readonly streetAddress: Locator;
  readonly ticketUrl: Locator;
  readonly contactEmail: Locator;
  readonly save: Locator;
  readonly discard: Locator;
  readonly summary: Locator;
  readonly saved: Locator;
  readonly viewListing: Locator;
  readonly saveFailed: Locator;
  readonly readOnly: Locator;
  readonly duplicate: Locator;
  readonly loadFailed: Locator;
  readonly skeleton: Locator;
  readonly forbidden: Locator;

  constructor(private readonly page: Page) {
    this.shell = new AppShell(page);
    this.heading = page.getByRole('heading', { level: 1 });
    this.lead = page.locator('.page-title .lead');
    this.backLink = page.getByRole('link', { name: 'Your events' });
    this.statusLine = page.locator('sx-inline-status');
    this.title = page.getByLabel('Event title');
    this.startTime = page.getByLabel('Starts');
    this.streetAddress = page.getByLabel('Street address');
    this.ticketUrl = page.getByLabel('Registration or ticket link');
    this.contactEmail = page.getByLabel('Email', { exact: true });
    this.save = page.getByRole('button', { name: /^(Save changes|Saving…)$/ });
    this.discard = page.getByRole('link', { name: 'Discard changes' });
    this.summary = page.locator('.form-summary');
    this.saved = page.locator('sx-alert').filter({ hasText: 'Changes saved' });
    this.viewListing = this.saved.getByRole('link', { name: 'View the listing' });
    this.saveFailed = page.getByRole('alert').filter({ hasText: 'We couldn’t save your changes' });
    this.readOnly = page
      .locator('sx-alert')
      .filter({ hasText: 'This event has ended, so it can’t be edited' });
    this.duplicate = this.readOnly.getByRole('button', { name: 'Duplicate as a new event' });
    this.loadFailed = page.locator('sx-empty-state').filter({ hasText: 'We couldn’t open this event' });
    this.skeleton = page.locator('.form-skeleton');
    this.forbidden = page.locator('sx-status-page');
  }

  async open(id: string): Promise<void> {
    await this.page.goto(`/organize/events/${id}/edit`);
  }

  async moveStart(time: string): Promise<void> {
    await this.startTime.fill(time);
  }

  async saveChanges(): Promise<void> {
    await this.save.click();
  }

  summaryItems(): Locator {
    return this.summary.getByRole('link');
  }

  formFields(): Locator {
    return this.page.locator('sx-event-form-fields').locator('input, textarea, select');
  }
}
