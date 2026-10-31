import { expect, test } from '../fixtures';
import { ReviewQueuePage } from '../pages/review-queue.page';
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
