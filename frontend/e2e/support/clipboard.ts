import { Page } from '@playwright/test';

/** Makes copying fail, as it does when the browser refuses clipboard access. */
export async function blockCopying(page: Page): Promise<void> {
  await page.addInitScript(() => {
    document.execCommand = () => false;
    Object.defineProperty(navigator, 'clipboard', { configurable: true, get: () => undefined });
  });
}
