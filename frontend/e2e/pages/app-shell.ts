import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Locator, Page } from '@playwright/test';
import { MobileMenuDialog } from './mobile-menu.dialog';

/** The frame every screen sits in: skip link, site header, main region and footer. */
export class AppShell {
  readonly skipLink: Locator;
  readonly header: Locator;
  readonly brand: Locator;
  readonly brandMark: Locator;
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
    this.brandMark = this.brand.locator('.brand__mark');
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

  /**
   * Share of the brand mark's pixels that differ from the official Magic Patterns logo
   * (docs/assets/6ixstack-mark.svg) drawn at the same size on the page background: 0 is identical.
   */
  async brandMarkDifferenceFromOfficialLogo(): Promise<number> {
    const box = await this.brandMark.boundingBox();
    if (!box) throw new Error('The brand mark is not rendered');
    const shot = (await this.brandMark.screenshot({ animations: 'disabled' })).toString('base64');
    return this.differenceFromOfficialLogo(
      `data:image/png;base64,${shot}`,
      Math.round(box.width),
      Math.round(box.height),
    );
  }

  /** The tab icons the page declares, as written in `<link rel="icon">`. */
  async tabIcons(): Promise<{ href: string; type: string }[]> {
    return this.page.locator('link[rel~="icon"]').evaluateAll((links) =>
      links.map((link) => ({
        href: link.getAttribute('href') ?? '',
        type: link.getAttribute('type') ?? '',
      })),
    );
  }

  /** Fetches a declared tab icon the way the browser would. */
  async fetchTabIcon(href: string): Promise<{ status: number; contentType: string; body: Buffer }> {
    const response = await this.page.request.get(new URL(href, this.page.url()).toString());
    return {
      status: response.status(),
      contentType: response.headers()['content-type'] ?? '',
      body: await response.body(),
    };
  }

  /** The square sizes, in px, of the images inside an ICO tab icon, smallest first. */
  async tabIconIcoSizes(href: string): Promise<number[]> {
    const { body } = await this.fetchTabIcon(href);
    const count = body.readUInt16LE(4);
    const sizes: number[] = [];
    for (let i = 0; i < count; i++) {
      const width = body.readUInt8(6 + i * 16) || 256;
      const height = body.readUInt8(7 + i * 16) || 256;
      if (width !== height) throw new Error(`Icon image ${i} is not square: ${width}x${height}`);
      sizes.push(width);
    }
    return sizes.sort((a, b) => a - b);
  }

  /** Share of a tab icon's pixels, drawn at `size` px, that differ from the official logo at that size. */
  async tabIconDifferenceFromOfficialLogo(href: string, size: number): Promise<number> {
    const { contentType, body } = await this.fetchTabIcon(href);
    return this.differenceFromOfficialLogo(
      `data:${contentType};base64,${body.toString('base64')}`,
      size,
      size,
    );
  }

  private async differenceFromOfficialLogo(src: string, width: number, height: number): Promise<number> {
    const official = readFileSync(join(__dirname, '../../../docs/assets/6ixstack-mark.svg')).toString(
      'base64',
    );
    return this.page.evaluate(
      async ({ src, official, width, height }) => {
        const load = (url: string) =>
          new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
          });
        const pixels = async (url: string) => {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d')!;
          ctx.fillStyle = getComputedStyle(document.body).backgroundColor;
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(await load(url), 0, 0, width, height);
          return ctx.getImageData(0, 0, width, height).data;
        };
        const actual = await pixels(src);
        const expected = await pixels(`data:image/svg+xml;base64,${official}`);
        let different = 0;
        for (let i = 0; i < actual.length; i += 4) {
          const delta = Math.max(
            Math.abs(actual[i] - expected[i]),
            Math.abs(actual[i + 1] - expected[i + 1]),
            Math.abs(actual[i + 2] - expected[i + 2]),
          );
          if (delta > 64) different++;
        }
        return different / (width * height);
      },
      { src, official, width, height },
    );
  }

  async submitEventLabelVisible(): Promise<boolean> {
    return this.submitEvent.locator('.site-header__submit-label').isVisible();
  }
}
