import { expect, test } from '../fixtures';
import { SettingsPage } from '../pages/settings.page';
import { SignOutDialog } from '../pages/sign-out.dialog';
import { ORGANIZER, signInAs } from '../support/session';
import { holdSignOut } from '../support/stub-api';

// Visual parity with docs/mocks/dialogs/sign-out.
test.describe('Sign out visuals', () => {
  test.beforeEach(async ({ page }) => {
    await signInAs(page, ORGANIZER);
    const settings = new SettingsPage(page);
    await settings.open();
    await settings.signOut.click();
    await expect(new SignOutDialog(page).panel).toBeVisible();
    await page.mouse.move(0, 0);
  });

  test('default', async ({ page }) => {
    await expect(new SignOutDialog(page).panel).toHaveScreenshot('sign-out-default-light.png');
  });

  test('busy', async ({ page }) => {
    await holdSignOut(page);
    const dialog = new SignOutDialog(page);
    await dialog.signOut.click();
    await expect(dialog.signOut).toHaveText('Signing out…');
    await page.mouse.move(0, 0);
    await expect(dialog.panel).toHaveScreenshot('sign-out-busy-light.png');
  });

  test('dark theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(new SignOutDialog(page).panel).toHaveScreenshot('sign-out-default-dark.png');
  });
});
