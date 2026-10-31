import { Locator, Page } from '@playwright/test';
import { AppShell } from './app-shell';

export interface SubmissionInput {
  title?: string;
  organizer?: string;
  description?: string;
  topics?: string[];
  date?: string;
  start?: string;
  end?: string;
  format?: 'In person' | 'Streaming' | 'Hybrid';
  venue?: string;
  city?: string;
  address?: string;
  streamUrl?: string;
  paid?: boolean;
  price?: string;
  ticketUrl?: string;
  email?: string;
}

/** The submit page (`/submit`). */
export class SubmitEventPage {
  readonly shell: AppShell;
  readonly form: Locator;
  readonly errorSummary: Locator;
  readonly submitButton: Locator;
  readonly skeletonSections: Locator;
  readonly failure: Locator;
  readonly successPanel: Locator;

  constructor(private readonly page: Page) {
    this.shell = new AppShell(page);
    this.form = page.locator('form.submit-form');
    this.errorSummary = page.locator('.form-summary');
    this.submitButton = page.getByRole('button', { name: /Submit for review|Submitting…/ });
    this.skeletonSections = page.locator('.form-skeleton');
    this.failure = page.getByRole('alert').filter({ hasText: 'We couldn’t submit your event' });
    this.successPanel = page.locator('.success-panel');
  }

  async open(): Promise<void> {
    await this.page.goto('/submit');
    await this.form.waitFor();
  }

  async startOpening(): Promise<void> {
    await this.page.goto('/submit', { waitUntil: 'domcontentloaded' });
    await this.shell.main.waitFor();
  }

  sectionHeadings(): Locator {
    return this.form.locator('.form-section h2');
  }

  /** The control with this label; optional fields' names end in "(optional)". */
  field(label: string): Locator {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.form.getByLabel(new RegExp(`^\\s*${escaped}(\\s*\\(optional\\))?\\s*$`));
  }

  /** The inline error under the field with this label. */
  fieldError(id: string): Locator {
    return this.page.locator(`#${id}-error`);
  }

  formatOption(name: 'In person' | 'Streaming' | 'Hybrid'): Locator {
    return this.form.getByRole('radio', { name: new RegExp(`^${name}`) });
  }

  priceOption(name: 'Free' | 'Paid'): Locator {
    return this.form.getByRole('radio', { name, exact: true });
  }

  topic(name: string): Locator {
    return this.form.getByRole('checkbox', { name, exact: true });
  }

  summaryItems(): Locator {
    return this.errorSummary.locator('li');
  }

  async summaryMessages(): Promise<string[]> {
    return this.errorSummary.locator('li').allInnerTexts();
  }

  summaryLink(message: string): Locator {
    return this.errorSummary.getByRole('link', { name: message });
  }

  async fill(input: SubmissionInput): Promise<void> {
    if (input.title !== undefined) await this.field('Event title').fill(input.title);
    if (input.organizer !== undefined) await this.field('Community or organizer').fill(input.organizer);
    if (input.description !== undefined) await this.field('Description').fill(input.description);
    for (const t of input.topics ?? []) await this.topic(t).check();
    if (input.date !== undefined) await this.field('Date').fill(input.date);
    if (input.start !== undefined) await this.field('Starts').fill(input.start);
    if (input.end !== undefined) await this.field('Ends').fill(input.end);
    if (input.format) await this.formatOption(input.format).check();
    if (input.venue !== undefined) await this.field('Venue name').fill(input.venue);
    if (input.city !== undefined) await this.field('City').selectOption(input.city);
    if (input.address !== undefined) await this.field('Street address').fill(input.address);
    if (input.streamUrl !== undefined) await this.field('Livestream link').fill(input.streamUrl);
    if (input.paid) await this.priceOption('Paid').check();
    if (input.price !== undefined) await this.field('Price (CAD)').fill(input.price);
    if (input.ticketUrl !== undefined) await this.field('Registration or ticket link').fill(input.ticketUrl);
    if (input.email !== undefined) await this.field('Contact email').fill(input.email);
  }

  successTitle(): Locator {
    return this.successPanel.getByRole('heading', { level: 2 });
  }

  successText(): Locator {
    return this.successPanel.locator('p').first();
  }

  nextSteps(): Locator {
    return this.successPanel.locator('.steps-next li');
  }

  successAction(name: string): Locator {
    return this.successPanel.getByRole(name === 'Submit another event' ? 'button' : 'link', { name });
  }

  busyButton(): Locator {
    return this.page.getByRole('button', { name: 'Submitting…' });
  }

  async submit(): Promise<void> {
    await this.page.getByRole('button', { name: /^(Submit for review|Try again)$/ }).click();
  }

  /** A complete, valid in-person submission. */
  static validInput(title: string, email: string): SubmissionInput {
    return {
      title,
      organizer: 'GTA Azure Community',
      description: 'Move your Power BI reports onto Fabric without rewriting them.',
      topics: ['Azure'],
      date: '2026-11-18',
      start: '18:30',
      end: '20:30',
      venue: 'Living Arts Centre',
      city: 'Mississauga',
      address: '4141 Living Arts Dr',
      ticketUrl: 'https://tickets.example.com/fabric',
      email,
    };
  }
}
