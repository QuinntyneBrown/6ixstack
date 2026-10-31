import type { Journey } from '../scripts/run-journey';

/** Reject a submission: open Reject, see the reason is required, give one with a note, and the card is gone. */
const journey: Journey = async ({ page, shot }) => {
  const crypto = page.locator('.review-card').filter({ hasText: 'Free crypto trading masterclass' });
  const dialog = page.getByRole('dialog', { name: /^Reject “/ });
  const response = await page.request.post('/api/test/sign-in', { data: { email: 'jordan@6ixstack.dev' } });
  if (!response.ok()) throw new Error('Sign-in failed');

  await page.goto('/admin/review');
  await crypto.waitFor();
  await page.waitForTimeout(400);
  await shot('review-queue');

  await crypto.getByRole('button', { name: /^Reject/ }).click();
  await dialog.waitFor();
  await dialog.getByRole('button', { name: 'Reject submission' }).click();
  await dialog.getByText('Choose a reason. The organizer sees it in their email.').waitFor();
  await page.waitForTimeout(300);
  await shot('reason-required');

  await dialog.getByRole('radio', { name: 'Spam or advertising' }).check();
  await dialog
    .getByLabel(/Message to the organizer/)
    .fill('This is advertising for a trading course, not a developer event.');
  await page.waitForTimeout(300);
  await shot('reason-and-note');

  await dialog.getByRole('button', { name: 'Reject submission' }).click();
  await dialog.waitFor({ state: 'hidden' });
  await page.locator('.toast').filter({ hasText: 'Rejected “Free crypto trading masterclass”' }).waitFor();
  await page.waitForTimeout(400);
  await shot('left-the-queue');
};

export default journey;
