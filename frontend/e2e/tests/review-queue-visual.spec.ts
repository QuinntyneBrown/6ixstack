import { expect, test } from '../fixtures';
import { ReviewQueuePage } from '../pages/review-queue.page';
import { approvalsSucceed } from '../support/moderation';
import { MODERATOR, ORGANIZER, signInAs } from '../support/session';
import { emptyQueue, failQueue, slowQueue, stubQueue, withPendingChecks } from '../support/stub-api';

// Visual parity with docs/mocks/pages/review-queue and docs/mocks/dialogs/keyboard-shortcuts.
test.describe('Review queue visuals', () => {
  test.beforeEach(async ({ page }) => {
    await signInAs(page, MODERATOR);
  });

  test('default', async ({ page }) => {
    await stubQueue(page, 'review-queue');
    const queue = new ReviewQueuePage(page);
    await queue.open();
    await expect(queue.cards).toHaveCount(4);
    await expect(page).toHaveScreenshot('review-queue-default-light.png', { fullPage: true });
  });

  test('checking', async ({ page }) => {
    await stubQueue(page, 'review-queue');
    await withPendingChecks(page);
    const queue = new ReviewQueuePage(page);
    await queue.open();
    await expect(queue.cardAt(0).checks.first()).toHaveText('Checking…');
    await expect(queue.cardAt(0).root).toHaveScreenshot('review-queue-checking-light.png');
  });

  test('loading', async ({ page }) => {
    await stubQueue(page, 'review-queue');
    await slowQueue(page, 5_000);
    const queue = new ReviewQueuePage(page);
    await queue.open();
    await expect(queue.skeletonCards).toHaveCount(3);
    await expect(page).toHaveScreenshot('review-queue-loading-light.png');
  });

  test('empty', async ({ page }) => {
    await emptyQueue(page);
    const queue = new ReviewQueuePage(page);
    await queue.open();
    await expect(queue.empty).toBeVisible();
    await expect(page).toHaveScreenshot('review-queue-empty-light.png');
  });

  test('error', async ({ page }) => {
    await failQueue(page);
    const queue = new ReviewQueuePage(page);
    await queue.open();
    await expect(queue.failure).toBeVisible();
    await expect(page).toHaveScreenshot('review-queue-error-light.png');
  });

  test('dark theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await stubQueue(page, 'review-queue');
    const queue = new ReviewQueuePage(page);
    await queue.open();
    await expect(queue.cards).toHaveCount(4);
    await expect(page).toHaveScreenshot('review-queue-default-dark.png', { fullPage: true });
  });

  test('phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await stubQueue(page, 'review-queue');
    const queue = new ReviewQueuePage(page);
    await queue.open();
    await expect(queue.cards).toHaveCount(4);
    await expect(page).toHaveScreenshot('review-queue-default-phone.png', { fullPage: true });
  });

  test('approved toast with Undo', async ({ page }) => {
    await stubQueue(page, 'review-queue');
    await approvalsSucceed(page, { title: 'Rust in production at scale', organizer: 'Toronto Rust Meetup' });
    const queue = new ReviewQueuePage(page);
    await queue.open();
    await queue.card('Rust in production at scale').approve.click();
    const toast = queue.toast('Approved “Rust in production at scale”');
    await expect(toast).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(toast).toHaveScreenshot('moderation-toast-success-light.png', {
      mask: [toast.locator('.toast__progress')],
    });
  });

  test('approved with a possible duplicate toast', async ({ page }) => {
    await stubQueue(page, 'review-queue');
    await approvalsSucceed(page, {
      title: 'Kubernetes on a budget',
      organizer: 'Cloud Native Toronto',
      duplicate: { slug: 'cloud-native-toronto-november-meetup', dateLabel: 'Nov 19' },
    });
    const queue = new ReviewQueuePage(page);
    await queue.open();
    await queue.card('Kubernetes on a budget').approve.click();
    const toast = queue.toast('Approved with a possible duplicate');
    await expect(toast).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(toast).toHaveScreenshot('moderation-toast-warning-light.png', {
      mask: [toast.locator('.toast__progress')],
    });
  });

  test('keyboard shortcuts dialog', async ({ page }) => {
    await stubQueue(page, 'review-queue');
    const queue = new ReviewQueuePage(page);
    await queue.open();
    await expect(queue.cards).toHaveCount(4);
    await queue.press('Shift+Slash');
    await expect(queue.shortcutsDialog).toBeVisible();
    await expect(queue.shortcutsDialog).toHaveScreenshot('keyboard-shortcuts-default-light.png');
  });
});

test.describe('Review queue visuals, organizer', () => {
  test('forbidden', async ({ page }) => {
    await signInAs(page, ORGANIZER);
    const queue = new ReviewQueuePage(page);
    await queue.open();
    await expect(queue.forbidden).toBeVisible();
    await expect(page).toHaveScreenshot('review-queue-forbidden-light.png');
  });
});
