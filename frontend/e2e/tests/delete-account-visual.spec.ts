import { expect, test } from '../fixtures';
import { DeleteAccountDialog } from '../pages/delete-account.dialog';
import { SettingsPage } from '../pages/settings.page';
import { ORGANIZER, signInAs } from '../support/session';
import { holdAccountDeletion } from '../support/stub-api';

async function openDelete(page: import('@playwright/test').Page): Promise<DeleteAccountDialog> {
  await signInAs(page, ORGANIZER);
  const settings = new SettingsPage(page);
  await settings.open();
  await settings.deleteAccount.click();
  const dialog = new DeleteAccountDialog(page);
  await expect(dialog.panel).toBeVisible();
  await page.mouse.move(0, 0);
  return dialog;
}

// Visual parity with docs/mocks/dialogs/delete-account. Deletion is stubbed, so Priya's account stays.
test.describe('Delete account visuals', () => {
  test('default', async ({ page }) => {
    const dialog = await openDelete(page);
    await expect(dialog.panel).toHaveScreenshot('delete-account-default-light.png');
  });

  test('invalid', async ({ page }) => {
    const dialog = await openDelete(page);
    await dialog.email.fill('priya@gtaazure.com');
    await dialog.email.press('Enter');
    await expect(dialog.emailError).toBeVisible();
    await expect(dialog.panel).toHaveScreenshot('delete-account-invalid-light.png');
  });

  test('confirm', async ({ page }) => {
    const dialog = await openDelete(page);
    await dialog.email.fill('priya@gtaazure.ca');
    await expect(dialog.confirm).toBeEnabled();
    await expect(dialog.panel).toHaveScreenshot('delete-account-confirm-light.png');
  });

  test('busy and failed', async ({ page }) => {
    const release = await holdAccountDeletion(page);
    const dialog = await openDelete(page);
    await dialog.email.fill('priya@gtaazure.ca');
    await dialog.confirm.click();
    await expect(dialog.confirm).toHaveText('Deleting…');
    await page.mouse.move(0, 0);
    await expect(dialog.panel).toHaveScreenshot('delete-account-busy-light.png');
    await release(500);
    await expect(dialog.failure).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(dialog.panel).toHaveScreenshot('delete-account-failed-light.png');
  });

  test('dark theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    const dialog = await openDelete(page);
    await expect(dialog.panel).toHaveScreenshot('delete-account-default-dark.png');
  });
});
