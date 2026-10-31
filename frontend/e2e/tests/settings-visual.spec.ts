import { expect, test } from '../fixtures';
import { SettingsPage } from '../pages/settings.page';
import { ORGANIZER, signInAs } from '../support/session';
import { failSettings, holdSettingsSave, settingsSaveAnswers, slowSettings } from '../support/stub-api';

// Visual parity with docs/mocks/pages/settings. Saves are stubbed, so Priya's settings stay as seeded.
test.describe('Settings visuals', () => {
  test.beforeEach(async ({ page }) => {
    await signInAs(page, ORGANIZER);
  });

  test('default', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.open();
    await expect(settings.name).toHaveValue('Priya Natarajan');
    await page.mouse.move(0, 0);
    await expect(page).toHaveScreenshot('settings-default-light.png', { fullPage: true });
  });

  test('invalid', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.open();
    await settings.name.fill('');
    await settings.website.fill('gtaazure');
    await settings.save.click();
    await expect(settings.summary).toBeFocused();
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.mouse.move(0, 0);
    await expect(page).toHaveScreenshot('settings-invalid-light.png', { fullPage: true });
  });

  test('submitting', async ({ page }) => {
    const release = await holdSettingsSave(page);
    const settings = new SettingsPage(page);
    await settings.open();
    await settings.save.click();
    await expect(settings.save).toHaveText('Saving…');
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.mouse.move(0, 0);
    await expect(page).toHaveScreenshot('settings-submitting-light.png', { fullPage: true });
    await release();
  });

  test('success', async ({ page }) => {
    await settingsSaveAnswers(page, '10:42 AM');
    const settings = new SettingsPage(page);
    await settings.open();
    await settings.save.click();
    await expect(settings.saved).toBeVisible();
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.mouse.move(0, 0);
    await expect(page).toHaveScreenshot('settings-success-light.png');
  });

  test('loading', async ({ page }) => {
    await slowSettings(page, 5_000);
    const settings = new SettingsPage(page);
    await settings.open();
    await expect(settings.skeleton).toBeVisible();
    await expect(page).toHaveScreenshot('settings-loading-light.png');
  });

  test('error', async ({ page }) => {
    await failSettings(page);
    const settings = new SettingsPage(page);
    await settings.open();
    await expect(settings.loadFailed).toBeVisible();
    await expect(page).toHaveScreenshot('settings-error-light.png');
  });

  test('dark theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    const settings = new SettingsPage(page);
    await settings.open();
    await expect(settings.name).toHaveValue('Priya Natarajan');
    await page.mouse.move(0, 0);
    await expect(page).toHaveScreenshot('settings-default-dark.png');
  });

  test('phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const settings = new SettingsPage(page);
    await settings.open();
    await expect(settings.name).toHaveValue('Priya Natarajan');
    await expect(page).toHaveScreenshot('settings-default-phone.png');
  });
});
