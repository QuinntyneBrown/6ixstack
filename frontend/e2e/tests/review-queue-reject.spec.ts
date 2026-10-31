import { expect, test } from '../fixtures';
import { RejectSubmissionDialog, SentEmailDialog } from '../pages/reject-submission.dialog';
import { ReviewQueuePage } from '../pages/review-queue.page';
import { waitForMail } from '../support/dev-mailbox';
import { failRejections, freshSubmission, holdRejections, rejectionsConflict } from '../support/moderation';
import { MODERATOR, signInAs } from '../support/session';

const unique = (title: string) => `${title} ${Date.now() % 100000}`;

// L2-061 reject, L2-063 conflict, L2-064 R shortcut; design: moderation/reject-submission.
// Rejections cannot be undone, so every test rejects a submission it made itself.
test.describe('Reject a submission', () => {
  test.beforeEach(async ({ page }) => {
    await signInAs(page, MODERATOR);
  });

  test('the dialog names the submission and who gets the email, with Cancel focused', async ({ page }) => {
    const { title, email } = await freshSubmission(page, unique('Crypto riches night'));
    const queue = new ReviewQueuePage(page);
    await queue.open();

    await queue.card(title).reject.click();

    const dialog = new RejectSubmissionDialog(page);
    await expect(dialog.title).toHaveText(`Reject “${title}”?`);
    await expect(dialog.description).toHaveText(
      `Submitted by Toronto Test Meetup (${email}). They get an email with your reason.`,
    );
    await expect(dialog.reasons).toHaveCount(5);
    await expect(dialog.cancel).toBeFocused();
  });

  test('a reason is required, and focus moves to the first one', async ({ page }) => {
    const { title } = await freshSubmission(page, unique('No reason given'));
    const queue = new ReviewQueuePage(page);
    await queue.open();
    await queue.card(title).reject.click();
    const dialog = new RejectSubmissionDialog(page);

    await dialog.submit.click();

    await expect(dialog.reasonError).toHaveText('Choose a reason. The organizer sees it in their email.');
    await expect(dialog.reason('Missing or unclear venue address')).toBeFocused();
  });

  test('rejecting emails the sender, removes the card and offers View email', async ({ page }) => {
    const { title, email } = await freshSubmission(page, unique('Trading masterclass'));
    const queue = new ReviewQueuePage(page);
    await queue.open();
    const waiting = await queue.waitingCount();
    await queue.card(title).reject.click();
    const dialog = new RejectSubmissionDialog(page);

    await dialog.rejectWith('Spam or advertising', 'This is advertising, not a developer event.');

    await expect(dialog.panel).toBeHidden();
    await expect(queue.card(title).root).toHaveCount(0);
    await expect(queue.summary).toHaveText(new RegExp(`^${waiting - 1} waiting`));
    const toastTitle = `Rejected “${title}”`;
    await expect(queue.toast(toastTitle)).toContainText('Toronto Test Meetup was emailed your reason.');
    await queue.toastAction(toastTitle, 'View email').click();
    const sent = new SentEmailDialog(page);
    await expect(sent.recipient).toHaveText(`To ${email}`);
    await expect(sent.body).toContainText('Reason: spam or advertising.');
    await expect(sent.body).toContainText('This is advertising, not a developer event.');
    const mail = await waitForMail(page.request, email, `“${title}” wasn’t approved`);
    expect(mail.textBody).toContain('This is advertising, not a developer event.');
  });

  test('a missing venue address sends it back for changes', async ({ page }) => {
    const { title, email } = await freshSubmission(page, unique('Where is it'));
    const queue = new ReviewQueuePage(page);
    await queue.open();
    await queue.card(title).reject.click();

    await new RejectSubmissionDialog(page).rejectWith('Missing or unclear venue address');

    await expect(queue.toast(`Sent “${title}” back for changes`)).toContainText(
      'Toronto Test Meetup was emailed what to fix.',
    );
    const mail = await waitForMail(page.request, email, `“${title}” needs changes`);
    expect(mail.textBody).toContain('Edit it and resubmit: https://6ixstack.dev/organize');
  });

  test('while rejecting, choices are disabled and Escape does not close', async ({ page }) => {
    const { title } = await freshSubmission(page, unique('Slow reject'));
    const queue = new ReviewQueuePage(page);
    await queue.open();
    await queue.card(title).reject.click();
    const dialog = new RejectSubmissionDialog(page);
    const release = await holdRejections(page);

    await dialog.rejectWith('Not a developer event');

    await expect(dialog.submit).toHaveText('Rejecting…');
    await expect(dialog.submit).toHaveAttribute('aria-busy', 'true');
    await expect(dialog.reason('Spam or advertising')).toBeDisabled();
    await page.keyboard.press('Escape');
    await expect(dialog.panel).toBeVisible();
    release();
    await expect(dialog.panel).toBeHidden();
  });

  test('a failed rejection keeps the choices and offers Try again', async ({ page }) => {
    const { title } = await freshSubmission(page, unique('Failing reject'));
    const queue = new ReviewQueuePage(page);
    await queue.open();
    await queue.card(title).reject.click();
    const dialog = new RejectSubmissionDialog(page);
    const restore = await failRejections(page);

    await dialog.rejectWith('Duplicate of an existing listing', 'Already listed.');

    await expect(dialog.failure).toContainText('It’s still in the queue and nobody was emailed. Try again.');
    await expect(dialog.reason('Duplicate of an existing listing')).toBeChecked();
    await expect(dialog.message).toHaveValue('Already listed.');
    await expect(dialog.submit).toHaveText('Try again');
    await restore();
    await dialog.submit.click();
    await expect(dialog.panel).toBeHidden();
    await expect(queue.card(title).root).toHaveCount(0);
  });

  test('R opens Reject for the focused card', async ({ page }) => {
    const { title } = await freshSubmission(page, unique('Keyboard reject'));
    const queue = new ReviewQueuePage(page);
    await queue.open();
    await queue.card(title).root.focus();

    await queue.press('r');

    await expect(new RejectSubmissionDialog(page).title).toHaveText(`Reject “${title}”?`);
  });

  test('rejecting what someone already approved closes the dialog and says who', async ({ page }) => {
    const { title } = await freshSubmission(page, unique('Already approved'));
    await rejectionsConflict(page, 'Sam');
    const queue = new ReviewQueuePage(page);
    await queue.open();
    await queue.card(title).reject.click();

    await new RejectSubmissionDialog(page).rejectWith('Not a developer event');

    await expect(queue.toast(`Sam already approved “${title}”`)).toContainText(
      'It’s no longer in the queue.',
    );
    await expect(queue.card(title).root).toHaveCount(0);
  });
});
