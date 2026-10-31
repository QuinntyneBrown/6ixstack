import { Download, Locator, Page } from '@playwright/test';

/** The Add to my calendar dialog, opened from an event's detail page. */
export class AddToCalendarDialog {
  readonly dialog: Locator;
  readonly description: Locator;
  readonly options: Locator;
  readonly failure: Locator;
  /** The visible panel, for visual comparison. */
  readonly panel: Locator;

  constructor(private readonly page: Page) {
    this.dialog = page.getByRole('dialog', { name: 'Add to my calendar' });
    this.description = this.dialog.locator('.dialog__description');
    this.options = this.dialog.locator('.option-btn');
    this.failure = this.dialog.getByRole('alert');
    this.panel = this.dialog.locator('.dialog__panel');
  }

  option(name: string): Locator {
    return this.options.filter({ hasText: name });
  }

  async optionNames(): Promise<string[]> {
    return this.options.evaluateAll((els) =>
      els.map((e) => e.querySelector('.option-btn__label')?.firstChild?.textContent?.trim() ?? ''),
    );
  }

  /** Picks a download option and returns the file the browser saved. */
  async download(name: string): Promise<Download> {
    const download = this.page.waitForEvent('download');
    await this.option(name).click();
    return download;
  }

  async pressEscape(): Promise<void> {
    await this.page.keyboard.press('Escape');
  }
}
