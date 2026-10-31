import { expect, test } from '../fixtures';
import { RejectSubmissionDialog, SentEmailDialog } from '../pages/reject-submission.dialog';
import { ReviewQueuePage } from '../pages/review-queue.page';
import { failRejections, holdRejections, rejectionsSucceed } from '../support/moderation';
import { MODERATOR, signInAs } from '../support/session';
import { stubQueue } from '../support/stub-api';

const CRYPTO = 'Free crypto trading masterclass';
const MESSAGE = 'This is advertising for a trading course, not a developer event.';

// Visual parity with docs/mocks/dialogs/reject-submission, dialogs/sent-email and moderation-toast/with-action.
test.describe('Reject submission visuals', () => {
  test.beforeEach(async ({ page }) => {
    await signInAs(page, MODERATOR);
    await stubQueue(page, 'review-queue');
  });

  async function openReject(page: import('@playwright/test').Page): Promise<RejectSubmissionDialog> {
    const queue = new ReviewQueuePage(page);
    await queue.open();
    await queue.card(CRYPTO).reject.click();
    const dialog = new RejectSubmissionDialog(page);
    await expect(dialog.panel).toBeVisible();
    return dialog;
  }

  test('default', async ({ page }) => {
    const dialog = await openReject(page);
    await expect(dialog.panel).toHaveScreenshot('reject-submission-default-light.png');
  });

  test('invalid', async ({ page }) => {
    const dialog = await openReject(page);
    await dialog.submit.click();
    await expect(dialog.reasonError).toBeVisible();
    await expect(dialog.panel).toHaveScreenshot('reject-submission-invalid-light.png');
  });

  test('busy', async ({ page }) => {
    const dialog = await openReject(page);
    await holdRejections(page);
    await dialog.rejectWith('Spam or advertising', MESSAGE);
    await expect(dialog.submit).toHaveText('Rejecting…');
    await expect(dialog.panel).toHaveScreenshot('reject-submission-busy-light.png');
  });

  test('failed', async ({ page }) => {
    const dialog = await openReject(page);
    await failRejections(page);
    await dialog.rejectWith('Spam or advertising', MESSAGE);
    await expect(dialog.failure).toBeVisible();
    await expect(dialog.panel).toHaveScreenshot('reject-submission-failed-light.png');
  });

  test('rejected toast and sent email', async ({ page }) => {
    const dialog = await openReject(page);
    await rejectionsSucceed(page, {
      title: CRYPTO,
      organizer: 'WealthFast Academy',
      to: 'promo@wealthfast.biz',
    });
    await dialog.rejectWith('Spam or advertising', MESSAGE);
    const queue = new ReviewQueuePage(page);
    const toast = queue.toast(`Rejected “${CRYPTO}”`);
    await expect(toast).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(toast).toHaveScreenshot('moderation-toast-with-action-light.png', {
      mask: [toast.locator('.toast__progress')],
    });
    await queue.toastAction(`Rejected “${CRYPTO}”`, 'View email').click();
    const sent = new SentEmailDialog(page);
    await expect(sent.panel).toBeVisible();
    await expect(sent.panel).toHaveScreenshot('sent-email-default-light.png');
  });
});
