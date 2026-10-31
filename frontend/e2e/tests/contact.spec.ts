import { expect, test } from '../fixtures';
import { ContactPage } from '../pages/contact.page';
import { contactAnswers } from '../support/stub-api';

const NOTE = 'Our November meetup moved to Sheridan College. Could you update the venue?';

// L2-073 contact form; design: site/contact-form.
test.describe('Contact the team', () => {
  test('a valid message is sent and confirmed with the reply address', async ({ page }) => {
    const contact = new ContactPage(page);
    await contact.open();

    await contact.fill('Priya Natarajan', 'priya@gtaazure.ca', 'Listing correction', NOTE);
    await contact.send.click();

    await expect(contact.sent).toContainText('Thanks, Priya — message sent');
    await expect(contact.sent).toContainText('We’ll reply to priya@gtaazure.ca within two working days.');
  });

  test('missing and invalid fields are listed in the summary', async ({ page }) => {
    const contact = new ContactPage(page);
    await contact.open();

    await contact.name.fill('Priya');
    await contact.email.fill('priya@gtaazure');
    await contact.send.click();

    await expect(contact.summary).toContainText('Fix 2 things before sending');
    await expect(contact.summaryItems()).toHaveText([
      'Enter an email address like name@example.com',
      'Write a message so we know how to help',
    ]);
    await expect(contact.summary).toBeFocused();
    await contact.summaryItems().first().click();
    await expect(contact.email).toBeFocused();
  });

  test('fixing a field clears its error and keeps the others', async ({ page }) => {
    const contact = new ContactPage(page);
    await contact.open();
    await contact.send.click();
    await expect(contact.summaryItems()).toHaveCount(3);

    await contact.name.fill('Priya');

    await expect(contact.summaryItems()).toHaveText([
      'Enter an email address like name@example.com',
      'Write a message so we know how to help',
    ]);
    await expect(contact.name).not.toHaveAttribute('aria-invalid', 'true');
  });

  test('while sending the fields are read-only and the button says Sending…', async ({ page }) => {
    const release = await contactAnswers(page, 0);
    const contact = new ContactPage(page);
    await contact.open();
    await contact.fill('Priya', 'priya@gtaazure.ca', 'General question', NOTE);

    await contact.send.click();

    await expect(contact.send).toHaveText('Sending…');
    await expect(contact.message).toHaveAttribute('readonly', '');
    await release();
  });

  test('a failed send keeps everything and offers Try again', async ({ page }) => {
    const restore = await contactAnswers(page, 500);
    const contact = new ContactPage(page);
    await contact.open();
    await contact.fill('Priya', 'priya@gtaazure.ca', 'Press', NOTE);

    await contact.send.click();

    await expect(contact.failure).toContainText('Nothing you wrote was lost');
    await expect(contact.message).toHaveValue(NOTE);
    await expect(contact.send).toHaveText('Try again');
    await restore();
  });

  test('other ways to reach the team are listed', async ({ page }) => {
    const contact = new ContactPage(page);
    await contact.open();

    await expect(contact.otherWays).toContainText('hello@6ixstack.dev');
    await expect(contact.otherWays).toContainText('conduct@6ixstack.dev');
    await expect(contact.otherWays).toContainText('Use Report a problem on the event page');
  });
});
