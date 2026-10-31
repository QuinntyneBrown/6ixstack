import type { Journey } from '../scripts/run-journey';

/** Contact the team: the empty-form errors, a sent message, and the message in the team's dev mailbox. */
const journey: Journey = async ({ page, shot }) => {
  await page.goto('/contact');
  await page.getByRole('heading', { name: 'Contact', level: 1 }).waitFor();
  await page.waitForTimeout(600);
  await shot('contact');

  await page.getByRole('button', { name: 'Send message' }).click();
  await page.locator('.form-summary').waitFor();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(500);
  await shot('fix-errors');

  await page.getByLabel('Your name').fill('Priya Natarajan');
  await page.getByLabel('Email', { exact: true }).fill('priya@gtaazure.ca');
  await page.getByLabel('What is it about?').selectOption({ label: 'Listing correction' });
  await page
    .getByLabel('Message', { exact: true })
    .fill(
      'Our November meetup moved from Living Arts Centre to Sheridan College. Could you update the venue on Fabric for Power BI developers?',
    );
  await page.waitForTimeout(400);
  await shot('filled-in');

  await page.getByRole('button', { name: 'Send message' }).click();
  await page.getByText('Thanks, Priya — message sent').waitFor();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(600);
  await shot('message-sent');

  const mailbox = `/api/dev/mailbox?to=${encodeURIComponent('hello@6ixstack.dev')}`;
  for (let i = 0; i < 30; i++) {
    const mail = (await (await page.request.get(mailbox)).json()) as { subject: string }[];
    if (mail.some((m) => m.subject.startsWith('Contact:'))) break;
    await page.waitForTimeout(500);
  }
  await page.goto(mailbox);
  // Show the mailbox's JSON response indented, so the delivered message is readable.
  await page.evaluate(() => {
    const json = JSON.parse(document.body.innerText.replace(/^Pretty-print\s*/, '')) as unknown;
    document.body.innerHTML = '';
    const pre = document.createElement('pre');
    pre.style.cssText =
      'margin:24px;font:15px/1.6 ui-monospace,monospace;white-space:pre-wrap;word-break:break-all';
    pre.textContent = JSON.stringify(json, null, 2);
    document.body.append(pre);
  });
  await page.waitForTimeout(400);
  await shot('team-inbox');
};

export default journey;
