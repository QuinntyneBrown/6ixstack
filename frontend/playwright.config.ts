import { defineConfig, devices } from '@playwright/test';

// PW_BASE_URL points the suite at servers that are already running, for example from the Linux
// Playwright container that renders CI's visual baselines (e2e/support/update-linux-baselines.sh).
const external = process.env['PW_BASE_URL'];

/**
 * Playwright runs in Chromium only (AGENTS.md) against `ng serve` proxying to the API, which the global
 * setup starts on a freshly seeded SQLite database with the clock fixed at Monday, November 2, 2026.
 */
export default defineConfig({
  testDir: './e2e/tests',
  outputDir: './test-results',
  snapshotPathTemplate: './e2e/visual-baselines/{testFileName}/{arg}-{platform}{ext}',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : [['list']],
  globalSetup: external ? undefined : './e2e/support/global-setup.ts',
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled', caret: 'hide' },
  },
  use: {
    baseURL: external ?? 'http://localhost:4200',
    trace: 'retain-on-failure',
    viewport: { width: 1280, height: 720 },
    locale: 'en-CA',
    timezoneId: 'America/Toronto',
    colorScheme: 'light',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } } },
  ],
  webServer: external
    ? undefined
    : {
        command: 'npx ng serve sixstack --port 4200',
        url: 'http://localhost:4200',
        reuseExistingServer: !process.env['CI'],
        timeout: 180_000,
      },
});
