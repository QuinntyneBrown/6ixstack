import type { Journey } from '../scripts/run-journey';

/** Review submissions: the moderator's queue, its automated checks, keyboard moves, and an organizer's view. */
const journey: Journey = async ({ page, shot }) => {
  const signInAs = async (email: string) => {
    await page.context().clearCookies();
    const response = await page.request.post('/api/test/sign-in', { data: { email } });
    if (!response.ok()) throw new Error(`Sign-in failed for ${email}`);
  };

  await signInAs('jordan@6ixstack.dev');
  await page.goto('/');
  await page.getByRole('link', { name: /Review queue, signed in as/ }).waitFor();
  await shot('signed-in-moderator');

  await page.getByRole('link', { name: /Review queue, signed in as/ }).click();
  await page.locator('.review-card').nth(3).waitFor();
  await page.waitForTimeout(400);
  await shot('review-queue');

  const kubernetes = page.locator('.review-card').filter({ hasText: 'Kubernetes on a budget' });
  await kubernetes.scrollIntoViewIfNeeded();
  await kubernetes.focus();
  await page.waitForTimeout(300);
  await shot('automated-checks');

  await page.keyboard.press('j');
  await page.waitForTimeout(300);
  await shot('keyboard-next');

  await page.keyboard.press('Shift+Slash');
  await page.getByRole('dialog', { name: 'Keyboard shortcuts' }).waitFor();
  await page.waitForTimeout(400);
  await shot('shortcuts-list');
  await page.keyboard.press('Escape');

  await signInAs('priya@gtaazure.ca');
  await page.goto('/admin/review');
  await page.getByText('Only moderators can review submissions').waitFor();
  await page.waitForTimeout(300);
  await shot('organizer-forbidden');
};

export default journey;
