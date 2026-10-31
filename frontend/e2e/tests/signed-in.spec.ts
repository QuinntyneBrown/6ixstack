import { expect, test } from '../fixtures';
import { SignedInLandingPage } from '../pages/organize.page';
import { SignInPage } from '../pages/sign-in.page';
import { linkIn, waitForMail } from '../support/dev-mailbox';
import { MODERATOR, ORGANIZER, signInAs, withUnreadCount } from '../support/session';

const uniqueEmail = (name: string) => `${name}-${Date.now()}-${Math.round(Math.random() * 1e6)}@example.com`;

// L2-047 redeem, L2-048 guarded pages, L2-050 signed-in header; designs: identity/magic-link-sign-in,
// identity/sessions-and-sign-out.
test.describe('Signed in', () => {
  test('the emailed link signs a new organizer in, once', async ({ page }) => {
    const signIn = new SignInPage(page);
    const email = uniqueEmail('new-organizer');
    await signIn.open();
    await signIn.requestLink(email);
    await expect(signIn.sent).toBeVisible();
    const link = linkIn(
      await waitForMail(page.request, email, 'Your 6ixstack sign-in link'),
      'https://6ixstack.dev/auth/redeem',
    );

    await page.goto(link);

    const landing = new SignedInLandingPage(page);
    await expect(page).toHaveURL(/\/organize$/);
    await expect(landing.heading).toHaveText('Your events');
    await expect(landing.lead).toHaveText(`Signed in as ${email}`);
    await expect(landing.shell.account).toHaveAccessibleName(`Your dashboard, signed in as ${email}`);
    await expect(landing.shell.notifications).toHaveAccessibleName('Notifications');
    await expect(landing.shell.notificationsBadge).toHaveCount(0);
    await expect(landing.shell.submitEvent).toHaveCount(0);

    await page.context().clearCookies();
    await page.goto(link);
    await expect(page).toHaveURL(/\/sign-in\?link=expired$/);
    await expect(signIn.expired).toBeVisible();
    await expect(signIn.email).toHaveValue(email);
  });

  test('an organizer page sends an anonymous visitor to sign in and back', async ({ page }) => {
    const landing = new SignedInLandingPage(page);
    await landing.open('/organize');

    await expect(page).toHaveURL(/\/sign-in\?returnUrl=%2Forganize$/);

    const signIn = new SignInPage(page);
    const email = uniqueEmail('returning');
    await signIn.requestLink(email);
    const link = linkIn(
      await waitForMail(page.request, email, 'Your 6ixstack sign-in link'),
      'https://6ixstack.dev/auth/redeem',
    );
    await page.goto(link);
    await expect(page).toHaveURL(/\/organize$/);
    await expect(landing.heading).toHaveText('Your events');
  });

  test("a moderator's avatar opens the review queue", async ({ page }) => {
    await signInAs(page, MODERATOR);
    const landing = new SignedInLandingPage(page);
    await page.goto('/');

    await landing.shell.account.click();

    await expect(page).toHaveURL(/\/admin\/review$/);
    await expect(landing.heading).toHaveText('Review queue');
  });

  test('unread notifications show in the button name and a badge', async ({ page }) => {
    await signInAs(page, ORGANIZER);
    await withUnreadCount(page, 3);
    const landing = new SignedInLandingPage(page);

    await landing.open('/organize');

    await expect(landing.shell.notifications).toHaveAccessibleName('Notifications, 3 unread');
    await expect(landing.shell.notificationsBadge).toHaveText('3');
  });

  test('signed out, the header has no account controls', async ({ page }) => {
    const landing = new SignedInLandingPage(page);
    await page.goto('/');

    await expect(landing.shell.submitEvent).toBeVisible();
    await expect(landing.shell.account).toHaveCount(0);
    await expect(landing.shell.notifications).toHaveCount(0);
  });
});
