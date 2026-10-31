import type { Journey } from '../scripts/run-journey';

/** Submit an event: the form, its error summary, format-dependent fields, success and email verification. */
const journey: Journey = async ({ page, shot }) => {
  const form = page.locator('form.submit-form');
  const field = (label: string) => form.getByLabel(new RegExp(`^\\s*${label}(\\s*\\(optional\\))?\\s*$`));
  const top = () => page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  const email = 'maya@scarboroughdevs.ca';

  await page.goto('/');
  await page.getByRole('link', { name: 'Submit event' }).first().click();
  await form.waitFor();
  await shot('open-submit');

  await page.getByRole('button', { name: 'Submit for review' }).click();
  await page.locator('.form-summary').waitFor();
  await page.waitForTimeout(300);
  await top();
  await shot('error-summary');

  await field('Event title').fill('Fabric for Power BI developers');
  await field('Community or organizer').fill('Scarborough Devs');
  await field('Description').fill(
    'Move your Power BI reports onto Fabric without rewriting them, with time for questions.',
  );
  await form.getByRole('checkbox', { name: 'Azure', exact: true }).check();
  await field('Date').fill('2026-11-18');
  await field('Starts').fill('18:30');
  await field('Ends').fill('20:30');
  await form.getByRole('radio', { name: /^Streaming/ }).check();
  await field('Livestream link').fill('https://youtube.com/live/fabric-pbi');
  await field('Email').fill(email);
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page
    .getByRole('heading', { name: 'Where' })
    .evaluate((h) => h.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await page.evaluate(() => window.scrollBy({ top: -80, behavior: 'instant' }));
  await page.waitForTimeout(300);
  await shot('streaming-fields');

  await page.getByRole('button', { name: 'Submit for review' }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await shot('ready-to-submit');

  await page.getByRole('button', { name: 'Submit for review' }).click();
  await page.locator('.success-panel').waitFor();
  await top();
  await shot('in-review');

  const mailbox = `/api/dev/mailbox?to=${encodeURIComponent(email)}`;
  let link = '';
  for (let i = 0; i < 30 && !link; i++) {
    const mail = (await (await page.request.get(mailbox)).json()) as { subject: string; textBody: string }[];
    link =
      mail.find((m) => m.subject.startsWith('Verify'))?.textBody.match(/https:\/\/\S+verify-email\S+/)?.[0] ??
      '';
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
  await page.waitForTimeout(400);
  await shot('verification-email');

  const url = new URL(link);
  await page.goto(url.pathname + url.search);
  await page.locator('.toast').waitFor();
  await page.waitForTimeout(400);
  await shot('email-verified');
};

export default journey;
