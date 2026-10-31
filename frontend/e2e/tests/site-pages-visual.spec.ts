import { expect, test } from '../fixtures';
import { AboutPage } from '../pages/about.page';
import { CodeOfConductPage } from '../pages/code-of-conduct.page';
import { mockSiteStats } from '../support/stub-api';

// Visual parity with docs/mocks/pages/about and docs/mocks/pages/code-of-conduct.
test.describe('Site page visuals', () => {
  test('about', async ({ page }) => {
    await mockSiteStats(page);
    const about = new AboutPage(page);
    await about.open();
    await expect(about.stat('Communities')).toHaveText('86');
    await expect(page).toHaveScreenshot('about-default-light.png', { fullPage: true });
  });

  test('about, dark theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await mockSiteStats(page);
    const about = new AboutPage(page);
    await about.open();
    await expect(about.stat('Communities')).toHaveText('86');
    await expect(page).toHaveScreenshot('about-default-dark.png', { fullPage: true });
  });

  test('about, phone width', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockSiteStats(page);
    const about = new AboutPage(page);
    await about.open();
    await expect(about.stat('Communities')).toHaveText('86');
    await expect(page).toHaveScreenshot('about-default-phone.png', { fullPage: true });
  });

  test('code of conduct', async ({ page }) => {
    const conduct = new CodeOfConductPage(page);
    await conduct.open();
    await expect(page).toHaveScreenshot('code-of-conduct-default-light.png', { fullPage: true });
  });
});
