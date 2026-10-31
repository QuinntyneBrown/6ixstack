import { expect, test } from '../fixtures';
import { ReviewQueuePage } from '../pages/review-queue.page';
import { MODERATOR, ORGANIZER, signInAs } from '../support/session';
import { emptyQueue, failQueue, slowQueue, withPendingChecks } from '../support/stub-api';

// L2-057 access, L2-058 content and states, L2-059 checks on the card; design: moderation/review-queue.
test.describe('Review queue', () => {
  test('lists waiting submissions oldest first under the summary', async ({ page }) => {
    await signInAs(page, MODERATOR);
    const queue = new ReviewQueuePage(page);
    await queue.open();

    // Other specs add submissions to the shared database; theirs are newer, so the seeded four always come first.
    await expect(queue.summary).toHaveText(
      /^\d+ waiting · oldest submitted yesterday · median review time 3 h$/,
    );
    expect((await queue.titles()).slice(0, 4)).toEqual([
      'Free crypto trading masterclass',
      'Fabric for Power BI developers',
      'Kubernetes on a budget',
      'Rust in production at scale',
    ]);
    await expect(queue.shell.submitEvent).toHaveCount(0);
  });

  test('a card shows the organizer, when and where, topics, checks and who sent it', async ({ page }) => {
    await signInAs(page, MODERATOR);
    const queue = new ReviewQueuePage(page);
    await queue.open();

    const card = queue.card('Kubernetes on a budget');
    await expect(card.organizer).toHaveText('Cloud Native Toronto');
    await expect(card.meta).toHaveText(['Thu, Nov 19 · 6:00 PM', 'Streaming online']);
    await expect(card.root.locator('sx-topic-tag')).toHaveText(['Azure', 'AWS']);
    await expect(card.check('Stream link reachable')).toHaveAttribute('data-outcome', 'passed');
    await expect(card.check('Possible duplicate of a Nov 19 listing')).toHaveAttribute(
      'data-outcome',
      'warning',
    );
    await expect(card.submitted).toHaveText('Submitted 5 hours ago · hello@cloudnativeto.ca');

    const crypto = queue.card('Free crypto trading masterclass');
    await expect(crypto.meta).toHaveText(['Sat, Nov 14 · 2:00 PM', 'Address not given']);
    await expect(crypto.root).toContainText('No topic picked');
    await expect(crypto.check('Not a developer topic')).toHaveAttribute('data-outcome', 'warning');
  });

  test('checks still running read Checking…', async ({ page }) => {
    await signInAs(page, MODERATOR);
    await withPendingChecks(page);
    const queue = new ReviewQueuePage(page);
    await queue.open();

    const card = queue.cardAt(0);
    await expect(card.checks.first()).toHaveText('Checking…');
    await expect(card.checks.first()).toHaveAttribute('data-outcome', 'pending');
  });

  test('a slow queue shows three skeleton cards', async ({ page }) => {
    await signInAs(page, MODERATOR);
    await slowQueue(page, 2_000);
    const queue = new ReviewQueuePage(page);
    await queue.open();

    await expect(queue.skeletonCards).toHaveCount(3);
    await expect(queue.summary).toHaveText('Loading submissions…');
    await expect(queue.cardAt(3).root).toBeVisible({ timeout: 10_000 });
  });

  test('a failed load says nothing changed and Try again reloads', async ({ page }) => {
    await signInAs(page, MODERATOR);
    const restore = await failQueue(page);
    const queue = new ReviewQueuePage(page);
    await queue.open();

    await expect(queue.failure).toContainText(
      'Submissions are safe. Nothing is approved or rejected until you act.',
    );
    await expect(queue.summary).toHaveText('Queue unavailable');

    await restore();
    await queue.tryAgain.click();
    await expect(queue.cardAt(3).root).toBeVisible();
  });

  test('with nothing waiting it says all caught up', async ({ page }) => {
    await signInAs(page, MODERATOR);
    await emptyQueue(page);
    const queue = new ReviewQueuePage(page);
    await queue.open();

    await expect(queue.empty).toBeVisible();
    await expect(queue.summary).toHaveText('0 waiting · last approval 12 minutes ago');
    await expect(queue.emptyAction('See what’s live')).toHaveAttribute('href', '/');
  });

  test('an organizer sees why they cannot review, with a way back', async ({ page }) => {
    await signInAs(page, ORGANIZER);
    const queue = new ReviewQueuePage(page);
    await queue.open();

    await expect(queue.forbidden).toContainText(
      'You’re signed in as Priya Natarajan, an organizer. To help moderate, ask the 6ixstack team.',
    );
    await expect(queue.summary).toHaveText('You don’t have access to this page');
    await expect(queue.emptyAction('Go to your events')).toHaveAttribute('href', '/organize');
    await expect(queue.emptyAction('Ask to moderate')).toHaveAttribute('href', '/contact');
  });

  test('an anonymous visitor is sent to sign in', async ({ page }) => {
    await page.goto('/admin/review');

    await expect(page).toHaveURL(/\/sign-in\?returnUrl=%2Fadmin%2Freview$/);
  });
});

// L2-064 keyboard shortcuts (J, K, ?); A and R arrive with approve and reject.
test.describe('Review queue shortcuts', () => {
  test('J and K move between cards', async ({ page }) => {
    await signInAs(page, MODERATOR);
    const queue = new ReviewQueuePage(page);
    await queue.open();
    await expect(queue.cardAt(3).root).toBeVisible();

    await queue.press('j');
    await expect(queue.cardAt(0).root).toBeFocused();
    await queue.press('j');
    await expect(queue.cardAt(1).root).toBeFocused();
    await queue.press('k');
    await expect(queue.cardAt(0).root).toBeFocused();
  });

  test('? lists the shortcuts and Escape closes the list', async ({ page }) => {
    await signInAs(page, MODERATOR);
    const queue = new ReviewQueuePage(page);
    await queue.open();
    await expect(queue.cardAt(3).root).toBeVisible();

    await queue.press('Shift+Slash');

    await expect(queue.shortcutsDialog).toBeVisible();
    await expect(queue.shortcutRows()).toHaveText(['J', 'K', '?']);
    await queue.press('Escape');
    await expect(queue.shortcutsDialog).toBeHidden();
  });
});
