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
  readonly notifications: Locator;
  readonly notificationsBadge: Locator;
  readonly account: Locator;
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
    this.notifications = this.header.getByRole('link', { name: /^Notifications/ });
    this.notificationsBadge = this.notifications.locator('.badge');
    this.account = this.header.getByRole('link', { name: /signed in as/ });
    this.menuButtonBehindModal = this.header.locator('.site-header__menu');
    this.main = page.locator('main#main');
    this.footer = page.locator('footer.site-footer');
    this.footerNav = page.getByRole('navigation', { name: 'Footer' });
  }

  /** A site banner under the header, found by its title. */
  banner(title: string): Locator {
    return this.page
      .locator('.site-banner')
      .filter({ has: this.page.locator('.alert__title', { hasText: title }) });
  }

  bannerText(title: string): Locator {
    return this.banner(title).locator('.alert__text');
  }

  bannerAction(title: string, action: string): Locator {
    return this.banner(title).getByRole('button', { name: action, exact: true });
  }

  bannerDismiss(title: string): Locator {
    return this.banner(title).getByRole('button', { name: 'Dismiss' });
  }

  get banners(): Locator {
    return this.page.locator('.site-banner');
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

  /** Distance of the header's top edge from the top of the viewport. */
  async headerTop(): Promise<number> {
    return (await this.header.boundingBox())?.y ?? Number.NaN;
  }

  async scrollDown(px: number): Promise<void> {
    await this.page.evaluate((y) => window.scrollTo(0, y), px);
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
