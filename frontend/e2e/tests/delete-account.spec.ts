import { expect, test } from '../fixtures';
import { DeleteAccountDialog } from '../pages/delete-account.dialog';
import { EventsPage } from '../pages/events.page';
import { SettingsPage } from '../pages/settings.page';
import { ORGANIZER, signInAs, signInWithLink } from '../support/session';
import { holdAccountDeletion } from '../support/stub-api';

const fresh = () => `delete-${Date.now()}-${Math.round(Math.random() * 1e6)}@example.com`;

/** Settings with the delete dialog open. */
async function openDelete(page: import('@playwright/test').Page): Promise<DeleteAccountDialog> {
  const settings = new SettingsPage(page);
  await settings.open();
  await settings.deleteAccount.click();
  const dialog = new DeleteAccountDialog(page);
  await expect(dialog.panel).toBeVisible();
  return dialog;
}

// L2-071 delete account; design: identity/delete-account. Real deletions use a new organizer; Priya's account is
// only used for states that delete nothing.
test.describe('Delete account', () => {
  test('typing the email deletes the account and lands signed out on the events page', async ({ page }) => {
    const email = fresh();
    await signInWithLink(page, email);
    const dialog = await openDelete(page);
    await expect(dialog.confirm).toBeDisabled();

    await dialog.email.fill(`  ${email.toUpperCase()} `);
    await dialog.confirm.click();

    const events = new EventsPage(page);
    await expect(page).toHaveURL(/\/$/);
    await expect(events.toast('Your account was deleted')).toBeVisible();
    await expect(events.shell.account).toHaveCount(0);
    const me = await page.request.get('/api/auth/me');
    expect(me.status()).toBe(401);
  });

  test('the dialog says what is lost and focuses Keep account', async ({ page }) => {
    await signInAs(page, ORGANIZER);
    const dialog = await openDelete(page);

    await expect(dialog.description).toHaveText(
      'You lose access to edit GTA Azure Community events. Published events stay up, managed by your 2 co-organizers. This can’t be undone.',
    );
    await expect(dialog.keep).toBeFocused();
    await dialog.keep.click();
    await expect(dialog.panel).toHaveCount(0);
  });

  test('a wrong email keeps Delete account disabled and says so', async ({ page }) => {
    await signInAs(page, ORGANIZER);
    const dialog = await openDelete(page);

    await dialog.email.fill('priya@gtaazure.com');
    await dialog.email.press('Enter');

    await expect(dialog.emailError).toHaveText('That doesn’t match. Type priya@gtaazure.ca exactly.');
    await expect(dialog.confirm).toBeDisabled();
    await dialog.email.fill('priya@gtaazure.ca');
    await expect(dialog.confirm).toBeEnabled();
  });

  test('while deleting the field locks and the dialog cannot be dismissed; a failure says nothing changed', async ({
    page,
  }) => {
    await signInAs(page, ORGANIZER);
    const release = await holdAccountDeletion(page);
    const dialog = await openDelete(page);
    await dialog.email.fill('priya@gtaazure.ca');

    await dialog.confirm.click();

    await expect(dialog.confirm).toHaveText('Deleting…');
    await expect(dialog.email).toBeDisabled();
    await page.keyboard.press('Escape');
    await expect(dialog.panel).toBeVisible();
    await release(500);
    await expect(dialog.failure).toContainText('Nothing changed.');
    await expect(dialog.failure.getByRole('link', { name: 'contact us' })).toHaveAttribute(
      'href',
      /^mailto:/,
    );
    await expect(dialog.confirm).toHaveText('Try again');
  });
});
