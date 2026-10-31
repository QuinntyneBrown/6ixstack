import { Locator, Page } from '@playwright/test';

type Kind = 'info' | 'success' | 'warning' | 'danger';

/** Time advanced after each interaction so the app renders; it counts toward toast countdowns. */
export const FRAME_MS = 50;

/** The Toast "Playground" story: buttons that raise each kind of toast into a toast region. */
export class ToastPlaygroundStory {
  readonly region: Locator;
  readonly toasts: Locator;

  constructor(private readonly page: Page) {
    this.region = page.locator('.toast-region');
    this.toasts = this.region.locator('.toast');
  }

  async open(): Promise<void> {
    await this.page.clock.install({ time: new Date('2026-11-02T14:00:00Z') });
    await this.page.goto('/iframe.html?id=components-toast--playground&viewMode=story');
    await this.page.getByRole('button', { name: 'Show info' }).waitFor();
    // Freeze time so only wait() moves it; each interaction then advances one frame to render.
    await this.page.clock.pauseAt(new Date('2026-11-02T14:01:00Z'));
  }

  private async frame(): Promise<void> {
    await this.page.clock.runFor(FRAME_MS);
  }

  async show(kind: Kind): Promise<void> {
    await this.page.getByRole('button', { name: `Show ${kind}` }).click();
    await this.frame();
  }

  toast(title: string): Locator {
    return this.toasts.filter({ has: this.page.locator('.toast__title', { hasText: title }) });
  }

  /** The toast titles, oldest first; use with a retrying assertion such as `toHaveText([...])`. */
  get titles(): Locator {
    return this.toasts.locator('.toast__title');
  }

  progressBar(title: string): Locator {
    return this.toast(title).locator('.toast__progress');
  }

  async dismiss(title: string): Promise<void> {
    await this.toast(title).getByRole('button', { name: 'Dismiss' }).click();
    await this.frame();
  }

  async hover(title: string): Promise<void> {
    await this.toast(title).hover();
    await this.frame();
  }

  async moveAway(): Promise<void> {
    await this.page.mouse.move(5, 5);
    await this.frame();
  }

  async wait(ms: number): Promise<void> {
    await this.page.clock.runFor(ms);
  }
}
