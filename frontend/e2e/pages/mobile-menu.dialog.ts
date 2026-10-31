import { Locator, Page } from '@playwright/test';

/** The phone menu, a bottom-sheet dialog opened from the header's menu button. */
export class MobileMenuDialog {
  readonly dialog: Locator;
  readonly title: Locator;
  readonly close: Locator;
  readonly submitEvent: Locator;

  constructor(private readonly page: Page) {
    this.dialog = page.getByRole('dialog', { name: 'Menu' });
    this.title = this.dialog.getByRole('heading', { name: 'Menu' });
    this.close = this.dialog.getByRole('button', { name: 'Close' });
    this.submitEvent = this.dialog.getByRole('link', { name: 'Submit event' });
  }

  link(name: string): Locator {
    return this.dialog.getByRole('link', { name, exact: true });
  }

  async linkNames(): Promise<string[]> {
    const names = await this.dialog.getByRole('link').allInnerTexts();
    return names.map((n) => n.trim());
  }

  async pressEscape(): Promise<void> {
    await this.page.keyboard.press('Escape');
  }

  /** Presses Tab `times` times and reports whether focus stayed inside the dialog after every press. */
  async focusStaysInsideWhileTabbing(times: number): Promise<boolean> {
    for (let i = 0; i < times; i++) {
      await this.page.keyboard.press('Tab');
      const inside = await this.dialog.evaluate((el) => el.contains(document.activeElement));
      if (!inside) {
        return false;
      }
    }
    return true;
  }
}
