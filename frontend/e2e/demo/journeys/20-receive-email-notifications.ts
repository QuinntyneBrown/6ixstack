import type { Page } from '@playwright/test';
import type { Journey } from '../scripts/run-journey';

/** Shows the newest email to `to` with `subject` as a plain card, as the dev mailbox holds it. */
async function showEmail(page: Page, to: string, subject: string): Promise<void> {
  let mail: { subject: string; textBody: string; to: string } | undefined;
  for (let attempt = 0; attempt < 60 && !mail; attempt++) {
    const all = (await (await page.request.get(`/api/dev/mailbox?to=${encodeURIComponent(to)}`)).json()) as {
      subject: string;
      textBody: string;
      to: string;
    }[];
    mail = all.reverse().find((m) => m.subject === subject);
    if (!mail) await page.waitForTimeout(500);
  }
  if (!mail) throw new Error(`No “${subject}” email reached ${to}`);
  await page.goto('/about');
  await page.evaluate(
    ({ to, subject, body }) => {
      const main = document.querySelector('main')!;
      main.innerHTML = '';
      const card = document.createElement('article');
      card.style.cssText =
        'max-width:40rem;margin:4rem auto;padding:2rem;border:1px solid #d8d6d0;border-radius:16px;background:#fff;font:16px/1.6 system-ui';
      card.innerHTML = `<p style="color:#5c6270;margin:0">From 6ixstack · To ${to}</p><h1 style="font-size:1.5rem;margin:.5rem 0 1rem">${subject}</h1>`;
      const pre = document.createElement('pre');
      pre.style.cssText = 'white-space:pre-wrap;font:inherit;margin:0';
      pre.textContent = body;
      card.append(pre);
      main.append(card);
    },
    { to, subject, body: mail.textBody },
  );
  await page.waitForTimeout(400);
}

/** Receive email notifications: approve and reject as the moderator, then the emails the organizers get. */
const journey: Journey = async ({ page, shot }) => {
  const signedIn = await page.request.post('/api/test/sign-in', { data: { email: 'jordan@6ixstack.dev' } });
  if (!signedIn.ok()) throw new Error('Sign-in failed');

  await page.goto('/admin/review');
  const fabric = page.locator('.review-card').filter({ hasText: 'Fabric for Power BI developers' });
  await fabric.waitFor();
  await page.waitForTimeout(500);
  await shot('approve-a-submission');

  await fabric.getByRole('button', { name: /^Approve/ }).click();
  await page.locator('.toast').filter({ hasText: 'Approved “Fabric for Power BI developers”' }).waitFor();
  await showEmail(page, 'priya@gtaazure.ca', '“Fabric for Power BI developers” is live');
  await shot('approved-email');

  await page.goto('/admin/review');
  const crypto = page.locator('.review-card').filter({ hasText: 'Free crypto trading masterclass' });
  await crypto.getByRole('button', { name: /^Reject/ }).click();
  const dialog = page.getByRole('dialog', { name: /^Reject “/ });
  await dialog.getByRole('radio', { name: 'Spam or advertising' }).check();
  await dialog
    .getByLabel(/Message to the organizer/)
    .fill('This is advertising for a trading course, not a developer event.');
  await dialog.getByRole('button', { name: 'Reject submission' }).click();
  await page.locator('.toast').filter({ hasText: 'Rejected “Free crypto trading masterclass”' }).waitFor();
  await showEmail(page, 'promo@wealthfast.biz', '“Free crypto trading masterclass” wasn’t approved');
  await shot('rejected-email');
};

export default journey;
