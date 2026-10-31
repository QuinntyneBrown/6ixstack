import type { Journey } from '../scripts/run-journey';

/** Build a custom feed: from the events page, choose topics and where, create and copy it, and see what it holds. */
const journey: Journey = async ({ page, shot }) => {
  const dialog = page.getByRole('dialog', { name: 'Subscribe to a calendar feed' });
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

  await page.goto('/');
  await page.locator('.event-row').first().waitFor();
  const cta = page.getByRole('button', { name: 'Get a calendar feed' });
  await cta.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.waitForTimeout(400);
  await shot('start-a-feed');

  await cta.click();
  await dialog.waitFor();
  await dialog.getByRole('checkbox', { name: 'AI', exact: true }).check();
  await dialog.getByRole('checkbox', { name: 'Azure', exact: true }).check();
  await page.waitForTimeout(400);
  await shot('choose-topics');

  await dialog.getByRole('button', { name: 'Create feed link' }).click();
  await dialog.getByText('Your feed is ready').waitFor();
  await dialog.getByRole('button', { name: /^Copy/ }).click();
  await page.locator('.toast').filter({ hasText: 'Feed link copied' }).waitFor();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(400);
  await shot('feed-ready');

  const feed = await (await page.request.get('/feeds/ai-azure-gta-stream.ics')).text();
  const titles = [...feed.replace(/\r\n /g, '').matchAll(/^SUMMARY:(.*)$/gm)].map((m) =>
    m[1].replace(/\\,/g, ','),
  );
  await page.goto('/feeds');
  await page.evaluate((list) => {
    document.body.innerHTML = '';
    const pre = document.createElement('pre');
    pre.style.cssText = 'margin:32px;font:16px/1.7 ui-monospace,monospace;white-space:pre-wrap';
    pre.textContent =
      `ai-azure-gta-stream.ics — ${list.length} events (upcoming, plus the last 30 days)\n\n` +
      list.map((t) => `• ${t}`).join('\n');
    document.body.append(pre);
  }, titles);
  await page.waitForTimeout(300);
  await shot('only-matching-events');
};

export default journey;
