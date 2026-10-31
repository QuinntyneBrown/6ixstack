import { Locator, Page } from '@playwright/test';
import { AppShell } from './app-shell';

/** One submission card in the review queue. */
export class ReviewCardPart {
  readonly title: Locator;
  readonly organizer: Locator;
  readonly meta: Locator;
  readonly checks: Locator;
  readonly submitted: Locator;

  constructor(readonly root: Locator) {
    this.title = root.locator('h2');
    this.organizer = root.locator('.review-card__organizer');
    this.meta = root.locator('.meta-item');
    this.checks = root.getByRole('list', { name: 'Automatic checks' }).getByRole('listitem');
    this.submitted = root.locator('.review-card__submitted');
    this.approve = root.getByRole('button', { name: /^Approve/ });
  }

  readonly approve: Locator;

  /** The check with this message; `outcome` reads its passed, warning or pending state. */
  check(message: string): Locator {
    return this.checks.filter({ hasText: message });
  }
}

/** The review queue (`/admin/review`). */
export class ReviewQueuePage {
  readonly shell: AppShell;
  readonly heading: Locator;
  readonly summary: Locator;
  readonly cards: Locator;
  readonly skeletonCards: Locator;
  readonly failure: Locator;
  readonly tryAgain: Locator;
  readonly empty: Locator;
  readonly forbidden: Locator;
  readonly shortcutsDialog: Locator;

  constructor(private readonly page: Page) {
    this.shell = new AppShell(page);
    this.heading = page.getByRole('heading', { level: 1 });
    this.summary = page.locator('.page-title .lead');
    this.cards = page.locator('.review-list .review-card');
    this.skeletonCards = page.locator('.review-list[aria-busy="true"] .review-card');
    this.failure = page.getByRole('alert').filter({ hasText: 'We couldn’t load the queue' });
    this.tryAgain = this.failure.getByRole('button', { name: 'Try again' });
    this.empty = page.locator('.empty').filter({ hasText: 'All caught up' });
    this.forbidden = page.locator('.empty').filter({ hasText: 'Only moderators can review submissions' });
    this.shortcutsDialog = page.getByRole('dialog', { name: 'Keyboard shortcuts' });
  }

  async open(): Promise<void> {
    await this.page.goto('/admin/review');
    await this.heading.waitFor();
  }

  card(title: string): ReviewCardPart {
    return new ReviewCardPart(
      this.cards.filter({ has: this.page.getByRole('heading', { name: title, exact: true }) }),
    );
  }

  cardAt(index: number): ReviewCardPart {
    return new ReviewCardPart(this.cards.nth(index));
  }

  async titles(): Promise<string[]> {
    return this.cards.locator('h2').allInnerTexts();
  }

  emptyAction(name: string): Locator {
    return this.page.locator('.empty').getByRole('link', { name });
  }

  /** The toast with this title. */
  toast(title: string): Locator {
    return this.page
      .locator('.toast')
      .filter({ has: this.page.locator('.toast__title', { hasText: title }) });
  }

  toastAction(title: string, action: string): Locator {
    return this.toast(title).getByRole('button', { name: action });
  }

  shortcutRows(): Locator {
    return this.shortcutsDialog.locator('dt');
  }

  async press(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }
}
