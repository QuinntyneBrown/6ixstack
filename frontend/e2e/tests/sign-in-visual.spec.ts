import { expect, test } from '../fixtures';
import { SignedInLandingPage } from '../pages/organize.page';
import { SignInPage } from '../pages/sign-in.page';
import { ORGANIZER, signInAs, withUnreadCount } from '../support/session';
import { acceptSignInLink, holdSignInLink } from '../support/stub-api';

// Visual parity with docs/mocks/pages/sign-in and the signed-in header (pages/organizer-dashboard).
test.describe('Sign in visuals', () => {
  test('default', async ({ page }) => {
    const signIn = new SignInPage(page);
    await signIn.open();
    await expect(page).toHaveScreenshot('sign-in-default-light.png');
  });

  test('invalid', async ({ page }) => {
    const signIn = new SignInPage(page);
    await signIn.open();
    await signIn.requestLink('priya@gtaazure');
    await expect(signIn.errorSummary).toBeFocused();
    await expect(page).toHaveScreenshot('sign-in-invalid-light.png');
  });

  test('submitting', async ({ page }) => {
    const signIn = new SignInPage(page);
    await signIn.open();
    await holdSignInLink(page);
    await signIn.requestLink(ORGANIZER);
    await expect(signIn.sendingButton).toBeVisible();
    await expect(page).toHaveScreenshot('sign-in-submitting-light.png');
  });

  test('success', async ({ page }) => {
    const signIn = new SignInPage(page);
    await signIn.open();
    await acceptSignInLink(page);
    await signIn.requestLink('visual-check@example.com');
    await expect(signIn.resend).toHaveText('Resend link in 30s');
    await expect(page).toHaveScreenshot('sign-in-success-light.png');
  });

  test('expired link', async ({ page }) => {
    const signIn = new SignInPage(page);
    await signIn.rememberEmail(ORGANIZER);
    await signIn.open('?link=expired');
    await expect(page).toHaveScreenshot('sign-in-error-light.png');
  });

  test('dark theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    const signIn = new SignInPage(page);
    await signIn.open();
    await expect(page).toHaveScreenshot('sign-in-default-dark.png');
  });

  test('phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const signIn = new SignInPage(page);
    await signIn.open();
    await expect(page).toHaveScreenshot('sign-in-default-phone.png');
  });

  test('signed-in header', async ({ page }) => {
    await signInAs(page, ORGANIZER);
    await withUnreadCount(page, 3);
    const landing = new SignedInLandingPage(page);
    await landing.open('/organize');
    await expect(landing.shell.notificationsBadge).toHaveText('3');
    await expect(landing.shell.header).toHaveScreenshot('signed-in-header-light.png');
  });
});
