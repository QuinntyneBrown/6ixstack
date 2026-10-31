import { request } from '@playwright/test';
import { expect, test } from '../fixtures';
import { EventsPage } from '../pages/events.page';
import { SettingsPage } from '../pages/settings.page';
import { SignOutDialog } from '../pages/sign-out.dialog';
import { ORGANIZER, signInAs } from '../support/session';
import { holdSignOut } from '../support/stub-api';

/** Settings with the sign-out dialog open. */
async function openSignOut(page: import('@playwright/test').Page): Promise<SignOutDialog> {
  await signInAs(page, ORGANIZER);
  const settings = new SettingsPage(page);
  await settings.open();
  await settings.signOut.click();
  const dialog = new SignOutDialog(page);
  await expect(dialog.panel).toBeVisible();
  return dialog;
}

// L2-049 sign out; design: identity/sessions-and-sign-out.
test.describe('Sign out', () => {
  test('the dialog explains it and focuses Stay signed in', async ({ page }) => {
    const dialog = await openSignOut(page);

    await expect(dialog.description).toHaveText(
      'You’ll need a new email link to sign back in. Other devices stay signed in.',
    );
    await expect(dialog.stay).toBeFocused();
    await dialog.stay.click();
    await expect(dialog.panel).toHaveCount(0);
  });

  test('signing out opens the events page signed out, and another device stays signed in', async ({
    page,
    baseURL,
  }) => {
    const phone = await request.newContext({ baseURL });
    await phone.post('/api/test/sign-in', { data: { email: ORGANIZER } });
    const dialog = await openSignOut(page);

    await dialog.signOut.click();

    const events = new EventsPage(page);
    await expect(page).toHaveURL(/\/$/);
    await expect(events.shell.account).toHaveCount(0);
    expect((await page.request.get('/api/auth/me')).status()).toBe(401);
    expect((await phone.get('/api/auth/me')).status()).toBe(200);
    await phone.dispose();
  });

  test('while signing out both buttons are disabled and Escape does not close it', async ({ page }) => {
    const release = await holdSignOut(page);
    const dialog = await openSignOut(page);

    await dialog.signOut.click();

    await expect(dialog.signOut).toHaveText('Signing out…');
    await expect(dialog.stay).toBeDisabled();
    await page.keyboard.press('Escape');
    await expect(dialog.panel).toBeVisible();
    await release();
    await expect(dialog.panel).toHaveCount(0);
  });
});
