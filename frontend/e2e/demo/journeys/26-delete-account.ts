import type { Journey } from '../scripts/run-journey';

/** Delete account: a throwaway organizer opens Settings, deletes the account and lands signed out. */
const journey: Journey = async ({ page, shot }) => {
  const email = 'pat@example.com';
  await page.request.post('/api/auth/sign-in-links', { data: { email } });
  let link = '';
  for (let i = 0; i < 30 && !link; i++) {
    const mail = (await (
      await page.request.get(`/api/dev/mailbox?to=${encodeURIComponent(email)}`)
    ).json()) as {
      subject: string;
      textBody: string;
    }[];
    link =
      mail
        .find((m) => m.subject === 'Your 6ixstack sign-in link')
        ?.textBody.match(/https:\/\/\S+redeem\S+/)?.[0] ?? '';
    if (!link) await page.waitForTimeout(500);
  }
  const url = new URL(link);
  await page.goto(url.pathname + url.search);
  await page.goto('/settings#account');
  await page.getByRole('button', { name: 'Delete account' }).waitFor();
  await page
    .locator('#account')
    .evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.mouse.move(0, 0);
  await page.waitForTimeout(600);
  await shot('settings');

  await page.getByRole('button', { name: 'Delete account' }).click();
  const dialog = page.getByRole('dialog', { name: 'Delete your organizer account?' });
  await dialog.waitFor();
  await page.waitForTimeout(500);
  await shot('delete-account');

  await dialog.getByRole('textbox').fill(email);
  await page.waitForTimeout(400);
  await shot('type-to-confirm');

  await dialog.getByRole('button', { name: 'Delete account' }).click();
  await page.getByText('Your account was deleted').waitFor();
  await page.waitForTimeout(800);
  await shot('signed-out');
};

export default journey;
