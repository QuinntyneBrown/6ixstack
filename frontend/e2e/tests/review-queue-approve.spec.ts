import { expect, test } from '../fixtures';
import { EventsPage } from '../pages/events.page';
import { ReviewQueuePage } from '../pages/review-queue.page';
import {
  approvalsConflict,
  failApprovals,
  samIsReviewing,
  submissionId,
  undoApproval,
  undoTooLate,
} from '../support/moderation';
import { MODERATOR, signInAs } from '../support/session';

const RUST = 'Rust in production at scale';

// L2-060 approve, L2-063 concurrent review, L2-064 A shortcut; design: moderation/approve-submission.
// Every approval is undone before the test ends, so the shared database stays as seeded.
test.describe('Approve a submission', () => {
  test.beforeEach(async ({ page }) => {
    await signInAs(page, MODERATOR);
  });

  test('approving removes the card and offers Undo, which puts it back', async ({ page }) => {
    const queue = new ReviewQueuePage(page);
    await queue.open();

    await queue.card(RUST).approve.click();

    await expect(queue.card(RUST).root).toHaveCount(0);
    const toast = queue.toast(`Approved “${RUST}”`);
    await expect(toast).toContainText('It’s live and Toronto Rust Meetup will be notified.');
    await queue.toastAction(`Approved “${RUST}”`, 'Undo').click();
    await expect(queue.card(RUST).root).toBeVisible();
  });

  test('an approved event appears on the events page', async ({ page }) => {
    const queue = new ReviewQueuePage(page);
    await queue.open();
    const id = await submissionId(page, 'rust-in-production-at-scale');
    await queue.card(RUST).approve.click();
    await expect(queue.toast(`Approved “${RUST}”`)).toBeVisible();

    try {
      const events = new EventsPage(page);
      await events.open();
      // November 17 is past the first two weeks, so it is on the next page of the list.
      await events.showMore.click();
      await expect(events.row(RUST).root).toBeVisible();
    } finally {
      await undoApproval(page, id);
    }
  });

  test('a possible duplicate is approved with a warning and a Compare link', async ({ page, context }) => {
    const queue = new ReviewQueuePage(page);
    await queue.open();
    const id = await submissionId(page, 'kubernetes-on-a-budget');

    await queue.card('Kubernetes on a budget').approve.click();

    try {
      const title = 'Approved with a possible duplicate';
      await expect(queue.toast(title)).toContainText(
        '“Kubernetes on a budget” may duplicate a Nov 19 listing.',
      );
      const opened = context.waitForEvent('page');
      await queue.toastAction(title, 'Compare').click();
      await expect(await opened).toHaveURL(/\/events\/cloud-native-toronto-november-meetup$/);
    } finally {
      await undoApproval(page, id);
    }
  });

  test('a failed approval keeps the card and offers Try again', async ({ page }) => {
    const restore = await failApprovals(page);
    const queue = new ReviewQueuePage(page);
    await queue.open();

    await queue.card(RUST).approve.click();

    const title = `Couldn’t approve “${RUST}”`;
    await expect(queue.toast(title)).toContainText('It’s still in the queue. Try again.');
    await expect(queue.card(RUST).root).toBeVisible();
    await restore();
    await queue.toastAction(title, 'Try again').click();
    await expect(queue.card(RUST).root).toHaveCount(0);
    await queue.toastAction(`Approved “${RUST}”`, 'Undo').click();
    await expect(queue.card(RUST).root).toBeVisible();
  });

  test('a submission someone else already approved leaves the queue with who decided', async ({ page }) => {
    await approvalsConflict(page, 'Sam');
    const queue = new ReviewQueuePage(page);
    await queue.open();

    await queue.card(RUST).approve.click();

    await expect(queue.toast(`Sam already approved “${RUST}”`)).toContainText('It’s no longer in the queue.');
    await expect(queue.card(RUST).root).toHaveCount(0);
  });

  test('Undo after the window says the approval stands', async ({ page }) => {
    const queue = new ReviewQueuePage(page);
    await queue.open();
    const id = await submissionId(page, 'rust-in-production-at-scale');
    await undoTooLate(page);
    await queue.card(RUST).approve.click();

    try {
      await queue.toastAction(`Approved “${RUST}”`, 'Undo').click();
      await expect(queue.toast(`Too late to undo “${RUST}”`)).toContainText(
        'It’s live and Toronto Rust Meetup will be notified.',
      );
    } finally {
      await page.unroute('**/api/moderation/submissions/*/undo-approval');
      await undoApproval(page, id);
    }
  });

  test('an unverified sender’s event goes live once they verify', async ({ page }) => {
    const queue = new ReviewQueuePage(page);
    await queue.open();
    const id = await submissionId(page, 'free-crypto-trading-masterclass');

    await queue.card('Free crypto trading masterclass').approve.click();

    try {
      await expect(queue.toast('Approved “Free crypto trading masterclass”')).toContainText(
        'It goes live when WealthFast Academy verifies their email.',
      );
    } finally {
      await undoApproval(page, id);
    }
  });

  test('A approves the focused card', async ({ page }) => {
    const queue = new ReviewQueuePage(page);
    await queue.open();
    await queue.card(RUST).root.focus();

    await queue.press('a');

    await expect(queue.card(RUST).root).toHaveCount(0);
    await queue.toastAction(`Approved “${RUST}”`, 'Undo').click();
    await expect(queue.card(RUST).root).toBeVisible();
  });

  test('another moderator reviewing the same submission is named', async ({ page, baseURL }) => {
    const queue = new ReviewQueuePage(page);
    await queue.open();
    const sam = await samIsReviewing(baseURL!, await submissionId(page, 'kubernetes-on-a-budget'));

    await queue.card('Kubernetes on a budget').root.focus();

    await expect(queue.toast('Sam is also reviewing “Kubernetes on a budget”')).toContainText(
      'Your actions won’t clash; the first decision wins.',
    );
    await sam.dispose();
  });
});
