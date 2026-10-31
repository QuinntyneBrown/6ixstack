import type { Journey } from '../scripts/run-journey';

/** Subscribe to a ready-made feed: the feeds page, copying a link, and what a calendar app receives. */
const journey: Journey = async ({ page, shot }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

  await page.goto('/');
  await page.locator('footer').getByRole('link', { name: 'Calendar feeds' }).click();
  await page.locator('.ready-feeds li').first().waitFor();
  await page.getByText('9 in the next two weeks').waitFor();
  await page.waitForTimeout(400);
  await shot('calendar-feeds');

  await page.getByRole('button', { name: 'Copy the AI feed link' }).focus();
  await page.waitForTimeout(300);
  await shot('ai-feed');

  await page.getByRole('button', { name: 'Copy the AI feed link' }).click();
  await page.locator('.toast').filter({ hasText: 'Feed link copied' }).waitFor();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(400);
  await shot('link-copied');

  // What a calendar app receives from the copied link, shown as text.
  const feed = await (await page.request.get('/feeds/ai-gta-stream.ics')).text();
  await page.goto('/feeds');
  await page.evaluate((text) => {
    document.body.innerHTML = '';
    const pre = document.createElement('pre');
    pre.style.cssText =
      'margin:24px;font:14px/1.5 ui-monospace,monospace;white-space:pre-wrap;word-break:break-all';
    const start = text.indexOf('BEGIN:VEVENT');
    pre.textContent = text.slice(0, text.indexOf('BEGIN:VTIMEZONE')) + '…\n' + text.slice(start, start + 900);
    document.body.append(pre);
  }, feed);
  await page.waitForTimeout(300);
  await shot('feed-contents');
};

export default journey;
