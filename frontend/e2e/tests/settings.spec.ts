import { expect, test } from '../fixtures';
import { SettingsPage } from '../pages/settings.page';
import { ORGANIZER, signInAs, signInWithLink } from '../support/session';
import { failSettings, holdSettingsSave, slowSettings } from '../support/stub-api';

const fresh = () => `settings-${Date.now()}-${Math.round(Math.random() * 1e6)}@example.com`;

// L2-068 profile, L2-069 email switches, L2-070 community; design: identity/account-settings. Tests that save use
// their own new organizer, so the seeded accounts keep their names.
test.describe('Account settings', () => {
  test('shows the profile, the email switches and the community', async ({ page }) => {
    await signInAs(page, ORGANIZER);
    const settings = new SettingsPage(page);
    await settings.open();

    await expect(settings.heading).toHaveText('Settings');
    await expect(settings.lead).toHaveText('Signed in as priya@gtaazure.ca');
    await expect(settings.name).toHaveValue('Priya Natarajan');
    await expect(settings.email).toHaveValue('priya@gtaazure.ca');
    await expect(settings.communityField).toHaveValue('GTA Azure Community');
    await expect(settings.communityField).toHaveAttribute('readonly', '');
    await expect(settings.decisionsSwitch).toBeChecked();
    await expect(settings.weeklySwitch).not.toBeChecked();
    await expect(settings.communityLine).toHaveText('You manage GTA Azure Community with 2 co-organizers.');
    await expect(settings.communityLine.getByRole('link')).toHaveAttribute(
      'href',
      '/communities/gta-azure-community',
    );
  });

  test('saving a new name and the weekly summary keeps them after a reload', async ({ page }) => {
    await signInWithLink(page, fresh());
    const settings = new SettingsPage(page);
    await settings.open();
    await expect(settings.communityLine).toHaveText('No community is assigned to your account yet.');

    await settings.name.fill('Jamie Rivera');
    await settings.weeklySwitch.check();
    await settings.save.click();

    await expect(settings.saved).toContainText('Saved at 9:00 AM.');
    await settings.open();
    await expect(settings.name).toHaveValue('Jamie Rivera');
    await expect(settings.weeklySwitch).toBeChecked();
  });

  test('a blank name and a bare website are listed in the summary', async ({ page }) => {
    await signInAs(page, ORGANIZER);
    const settings = new SettingsPage(page);
    await settings.open();

    await settings.name.fill('');
    await settings.website.fill('gtaazure');
    await settings.save.click();

    await expect(settings.summaryItems()).toHaveText([
      'Enter your name.',
      'Enter a full link like https://gtaazure.ca',
    ]);
    await expect(settings.summary).toBeFocused();
  });

  test('a new email waits for its confirmation link', async ({ page }) => {
    const email = fresh();
    await signInWithLink(page, email);
    const settings = new SettingsPage(page);
    await settings.open();

    await settings.name.fill('Sam Lee');
    await settings.email.fill(`new-${email}`);
    await settings.save.click();

    await expect(settings.saved).toContainText(`We sent a confirmation link to new-${email}.`);
    await expect(settings.lead).toHaveText(`Signed in as ${email}`);
  });

  test('while saving the fields lock and the button says Saving…', async ({ page }) => {
    await signInAs(page, ORGANIZER);
    const release = await holdSettingsSave(page);
    const settings = new SettingsPage(page);
    await settings.open();

    await settings.save.click();

    await expect(settings.save).toHaveText('Saving…');
    await expect(settings.name).toBeDisabled();
    await release();
  });

  test('a failed load offers Try again', async ({ page }) => {
    await signInAs(page, ORGANIZER);
    const restore = await failSettings(page);
    const settings = new SettingsPage(page);
    await settings.open();

    await expect(settings.loadFailed).toContainText('Nothing has been changed. Try again in a moment.');
    await restore();
    await settings.loadFailed.getByRole('button', { name: 'Try again' }).click();
    await expect(settings.name).toHaveValue('Priya Natarajan');
  });

  test('a slow load shows the form skeleton', async ({ page }) => {
    await signInAs(page, ORGANIZER);
    await slowSettings(page, 2_000);
    const settings = new SettingsPage(page);
    await settings.open();

    await expect(settings.skeleton).toBeVisible();
    await expect(settings.name).toHaveValue('Priya Natarajan', { timeout: 10_000 });
  });
});
