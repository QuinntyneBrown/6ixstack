import { expect, test } from '../fixtures';
import { SignInPage } from '../pages/sign-in.page';
import { holdSignInLink } from '../support/stub-api';

const uniqueEmail = (name: string) => `${name}-${Date.now()}-${Math.round(Math.random() * 1e6)}@example.com`;

// L2-046 request a sign-in link, L2-047 expired link; design: identity/magic-link-sign-in.
test.describe('Sign in: request a link', () => {
  test('asks for an email, with the field focused and no Submit event in the header', async ({ page }) => {
    const signIn = new SignInPage(page);
    await signIn.open();

    await expect(signIn.heading).toHaveText('Sign in to 6ixstack');
    await expect(signIn.email).toBeFocused();
    await expect(signIn.shell.submitEvent).toHaveCount(0);
  });

  test('a malformed address shows the summary and inline error and keeps the input', async ({ page }) => {
    const signIn = new SignInPage(page);
    await signIn.open();

    await signIn.requestLink('priya@gtaazure');

    await expect(signIn.summaryTitle()).toHaveText('Check your email address');
    await expect(signIn.summaryItems()).toHaveText(['Enter an email address like name@example.com.']);
    await expect(signIn.emailError).toHaveText('Enter an email address like name@example.com.');
    await expect(signIn.email).toHaveValue('priya@gtaazure');
    await expect(signIn.email).toHaveAttribute('aria-invalid', 'true');
  });

  test('while sending, the field is read-only and the button says so', async ({ page }) => {
    const signIn = new SignInPage(page);
    await signIn.open();
    const release = await holdSignInLink(page);

    await signIn.requestLink(uniqueEmail('busy'));

    await expect(signIn.sendingButton).toHaveAttribute('aria-busy', 'true');
    await expect(signIn.email).toHaveAttribute('readonly', '');
    release();
    await expect(signIn.sent).toBeVisible();
  });

  test('a sent link names the inbox, and resend waits 30 seconds with a countdown', async ({ page }) => {
    const signIn = new SignInPage(page);
    const email = uniqueEmail('sent');
    await signIn.open();

    await signIn.requestLink(email);

    await expect(signIn.heading).toHaveText('Check your inbox');
    await expect(signIn.sentText()).toHaveText(
      `We sent a sign-in link to ${email}. It works once and expires in 15 minutes.`,
    );
    await expect(signIn.resend).toBeDisabled();
    await expect(signIn.resend).toHaveText('Resend link in 30s');
    await page.clock.runFor(10_000);
    await expect(signIn.resend).toHaveText('Resend link in 20s');
    await page.clock.runFor(20_000);
    await expect(signIn.resend).toBeEnabled();
    await expect(signIn.resend).toHaveText('Resend link');

    await signIn.resend.click();
    await expect(signIn.resend).toBeDisabled();

    await signIn.differentEmail.click();
    await expect(signIn.email).toHaveValue(email);
    await expect(signIn.email).toBeFocused();
  });

  test('an address with no account sees exactly the same confirmation', async ({ page }) => {
    const signIn = new SignInPage(page);
    await signIn.open();

    await signIn.requestLink(uniqueEmail('nobody-here'));

    await expect(signIn.heading).toHaveText('Check your inbox');
  });

  test('an expired link explains itself above the form, prefilled with the last address', async ({
    page,
  }) => {
    const signIn = new SignInPage(page);
    await signIn.rememberEmail('priya@gtaazure.ca');

    await signIn.open('?link=expired');

    await expect(signIn.expired).toBeVisible();
    await expect(signIn.email).toHaveValue('priya@gtaazure.ca');
  });
});
