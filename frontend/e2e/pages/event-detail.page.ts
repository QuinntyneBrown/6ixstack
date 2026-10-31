import { Locator, Page } from '@playwright/test';
import { AddToCalendarDialog } from './add-to-calendar.dialog';
import { AppShell } from './app-shell';

/** The event detail page (`/events/:slug`). */
export class EventDetailPage {
  readonly shell: AppShell;
  readonly share: Locator;
  readonly backLink: Locator;
  readonly title: Locator;
  readonly community: Locator;
  readonly topics: Locator;
  readonly dateTile: Locator;
  readonly facts: Locator;
  readonly about: Locator;
  readonly agendaItems: Locator;
  readonly speakers: Locator;
  readonly venueSection: Locator;
  readonly alerts: Locator;
  readonly aside: Locator;
  readonly dockedBar: Locator;

  constructor(private readonly page: Page) {
    this.share = page.getByRole('button', { name: 'Share', exact: true });
    this.shell = new AppShell(page);
    this.backLink = page.getByRole('link', { name: 'All events' });
    this.title = page.getByRole('heading', { level: 1 });
    this.community = page.locator('.detail-hero .lead a');
    this.topics = page.locator('.detail-hero .topic-tag');
    this.dateTile = page.locator('.detail-hero .date-tile');
    this.facts = page.getByRole('complementary', { name: 'Event details' }).locator('.facts .fact');
    this.about = page.getByRole('region', { name: 'About this event' });
    this.agendaItems = page.locator('.agenda li');
    this.speakers = page.getByRole('region', { name: 'Speakers' }).locator('a.person');
    this.venueSection = page.getByRole('region', { name: 'Venue' });
    this.alerts = page.locator('.detail-alerts .alert');
    this.aside = page.getByRole('complementary', { name: 'Event details' });
    this.dockedBar = page.locator('.sticky-cta');
  }

  async open(slug: string): Promise<void> {
    await this.page.goto(`/events/${slug}`);
    await this.title.waitFor();
  }

  /** Opens without waiting for the content, to look at the loading state. */
  async startOpening(slug: string): Promise<void> {
    await this.page.goto(`/events/${slug}`, { waitUntil: 'domcontentloaded' });
    await this.shell.main.waitFor();
  }

  get skeletons(): Locator {
    return this.page.locator('.detail-loading .skeleton');
  }

  get errorState(): Locator {
    return this.page.locator('.empty').filter({ hasText: "This event didn't load" });
  }

  errorAction(name: string): Locator {
    return this.errorState.getByRole('link', { name }).or(this.errorState.getByRole('button', { name }));
  }

  /** The text of each fact, label and value joined by " · ", e.g. "318 going · Capacity 400". */
  async factTexts(): Promise<string[]> {
    return this.facts.evaluateAll((facts) =>
      facts.map((f) =>
        [f.querySelector('.fact__label')?.textContent, f.querySelector('.fact__value')?.textContent]
          .filter(Boolean)
          .map((t) => t!.replace(/\s+/g, ' ').trim())
          .join(' · '),
      ),
    );
  }

  fact(label: string): Locator {
    return this.facts.filter({ has: this.page.locator('.fact__label', { hasText: label }) });
  }

  sectionHeading(name: string): Locator {
    return this.page.getByRole('heading', { level: 2, name, exact: true });
  }

  async agendaTexts(): Promise<string[]> {
    return (await this.agendaItems.allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());
  }

  action(name: string | RegExp): Locator {
    return this.aside.getByRole('link', { name }).or(this.aside.getByRole('button', { name }));
  }

  async openAddToCalendar(): Promise<AddToCalendarDialog> {
    await this.action('Add to my calendar').click();
    const dialog = new AddToCalendarDialog(this.page);
    await dialog.dialog.waitFor();
    return dialog;
  }

  get caption(): Locator {
    return this.aside.locator('.text-caption');
  }

  /** The struck-through time range of a cancelled event. */
  get struckTime(): Locator {
    return this.facts.first().locator('s');
  }

  alert(title: string): Locator {
    return this.alerts.filter({ has: this.page.locator('.alert__title', { hasText: title }) });
  }

  alertAction(title: string, name: string): Locator {
    return this.alert(title).getByRole('link', { name }).or(this.alert(title).getByRole('button', { name }));
  }

  url(): string {
    return new URL(this.page.url()).pathname;
  }
}
