import { Locator, Page } from '@playwright/test';
import { MobileMenuDialog } from './mobile-menu.dialog';

/** The frame every screen sits in: skip link, site header, main region and footer. */
export class AppShell {
  readonly skipLink: Locator;
  readonly header: Locator;
  readonly brand: Locator;
  readonly primaryNav: Locator;
  readonly submitEvent: Locator;
  readonly menuButton: Locator;
  /** The menu button by class; while a modal is open the page behind it is hidden from the accessibility tree. */
  readonly menuButtonBehindModal: Locator;
  readonly main: Locator;
  readonly footer: Locator;
  readonly footerNav: Locator;

  constructor(private readonly page: Page) {
    this.skipLink = page.getByRole('link', { name: 'Skip to content' });
    this.header = page.locator('header.site-header');
    this.brand = this.header.getByRole('link', { name: '6ixstack home' });
    this.primaryNav = page.getByRole('navigation', { name: 'Primary' });
    this.submitEvent = this.header.getByRole('link', { name: 'Submit event' });
    this.menuButton = this.header.getByRole('button', { name: 'Open menu' });
    this.menuButtonBehindModal = this.header.locator('.site-header__menu');
    this.main = page.locator('main#main');
    this.footer = page.locator('footer.site-footer');
    this.footerNav = page.getByRole('navigation', { name: 'Footer' });
  }

  primaryLink(name: string): Locator {
    return this.primaryNav.getByRole('link', { name, exact: true });
  }

  async primaryLinkNames(): Promise<string[]> {
    return this.primaryNav.getByRole('link').allInnerTexts();
  }

  async footerLinkNames(): Promise<string[]> {
    return this.footerNav.getByRole('link').allInnerTexts();
  }

  async tagline(): Promise<string> {
    return (await this.footer.locator('p').first().innerText()).trim();
  }

  async pressTabFromTop(): Promise<void> {
    await this.page.locator('body').focus();
    await this.page.keyboard.press('Tab');
  }

  async useSkipLink(): Promise<void> {
    await this.skipLink.press('Enter');
  }

  async openMenu(): Promise<MobileMenuDialog> {
    await this.menuButton.click();
    const menu = new MobileMenuDialog(this.page);
    await menu.dialog.waitFor();
    return menu;
  }

  /** The computed page background and text colours, as `rgb(...)` strings. */
  async pageColours(): Promise<{ background: string; text: string; muted: string }> {
    return this.page.evaluate(() => {
      const body = getComputedStyle(document.body);
      const footer = document.querySelector('.site-footer__inner');
      return {
        background: body.backgroundColor,
        text: body.color,
        muted: footer ? getComputedStyle(footer).color : '',
      };
    });
  }

  async hasHorizontalScroll(): Promise<boolean> {
    return this.page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
  }

  async submitEventLabelVisible(): Promise<boolean> {
    return this.submitEvent.locator('.site-header__submit-label').isVisible();
  }
}
