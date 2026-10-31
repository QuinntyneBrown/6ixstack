import { test as base, expect } from '@playwright/test';

/** "Today" in every test is Monday, November 2, 2026, 9:00 AM in Toronto, as in the mocks. */
export const TODAY = new Date('2026-11-02T14:00:00Z');

export const test = base.extend({
  page: async ({ page }, use) => {
    // Time starts at TODAY and flows; tests can jump ahead with page.clock.runFor().
    await page.clock.install({ time: TODAY });
    await use(page);
  },
});

export { expect };
