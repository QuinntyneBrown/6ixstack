import type { Journey } from '../scripts/run-journey';

/** Approve a submission: from the review queue, with its toast, to the event appearing in the list. */
const journey: Journey = async ({ page, shot }) => {
  const rust = page.locator('.review-card').filter({ hasText: 'Rust in production at scale' });
  const response = await page.request.post('/api/test/sign-in', { data: { email: 'jordan@6ixstack.dev' } });
  if (!response.ok()) throw new Error('Sign-in failed');

  await page.goto('/admin/review');
  await rust.waitFor();
  await rust.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await shot('review-queue');

  await rust.getByRole('button', { name: /^Approve/ }).click();
  await page.locator('.toast').filter({ hasText: 'Approved “Rust in production at scale”' }).waitFor();
  await page.waitForTimeout(400);
  await shot('approved-with-undo');

  await page.goto('/');
  await page.getByRole('button', { name: /Show .* more/ }).click();
  const row = page.locator('.event-row').filter({ hasText: 'Rust in production at scale' });
  await row.waitFor();
  await row.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.waitForTimeout(400);
  await shot('live-in-the-list');
};

export default journey;
