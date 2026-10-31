import type { Journey } from '../scripts/run-journey';

/** Sign in with a magic link: request it, open it from the dev mailbox, land signed in, and see it works once. */
const journey: Journey = async ({ page, shot }) => {
  const email = 'priya@gtaazure.ca';
  const field = page.getByLabel('Email', { exact: true });

  await page.goto('/');
  await page.locator('footer').getByRole('link', { name: 'Organizer sign in' }).click();
  await field.waitFor();
  await page.waitForTimeout(300);
  await shot('open-sign-in');

  await field.fill(email);
  await page.getByRole('button', { name: 'Email me a sign-in link' }).click();
  await page.getByRole('heading', { name: 'Check your inbox' }).waitFor();
  await page.waitForTimeout(300);
  await shot('check-your-inbox');

  const mailbox = `/api/dev/mailbox?to=${encodeURIComponent(email)}`;
  let link = '';
  for (let i = 0; i < 30 && !link; i++) {
    const mail = (await (await page.request.get(mailbox)).json()) as { subject: string; textBody: string }[];
    link =
      mail
        .find((m) => m.subject === 'Your 6ixstack sign-in link')
        ?.textBody.match(/https:\/\/\S+redeem\S+/)?.[0] ?? '';
    if (!link) await page.waitForTimeout(500);
  }
  await page.goto(mailbox);
  // Show the mailbox's JSON response indented, so the emailed link is readable.
  await page.evaluate(() => {
    const json = JSON.parse(document.body.innerText.replace(/^Pretty-print\s*/, '')) as unknown;
    document.body.innerHTML = '';
    const pre = document.createElement('pre');
    pre.style.cssText =
      'margin:24px;font:15px/1.6 ui-monospace,monospace;white-space:pre-wrap;word-break:break-all';
    pre.textContent = JSON.stringify(json, null, 2);
    document.body.append(pre);
  });
  await shot('link-in-mailbox');

  const url = new URL(link);
  await page.goto(url.pathname + url.search);
  await page.getByRole('heading', { name: 'Your events' }).waitFor();
  await page.waitForTimeout(400);
  await shot('signed-in');

  await page.goto(url.pathname + url.search);
  await page.getByRole('alert').filter({ hasText: 'That sign-in link has expired' }).waitFor();
  await page.waitForTimeout(300);
  await shot('link-used');
};

export default journey;
