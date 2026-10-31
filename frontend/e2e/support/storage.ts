import { Page } from '@playwright/test';

/** Makes localStorage throw, as browsers do when site storage is blocked. */
export async function blockStorage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('Storage is blocked', 'SecurityError');
      },
    });
  });
}
