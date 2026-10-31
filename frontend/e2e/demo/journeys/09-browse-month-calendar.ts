import type { Journey } from '../scripts/run-journey';

/** Browse the month calendar: November, next month and back, the Streaming filter, and the phone layout. */
const journey: Journey = async ({ page, shot }) => {
  const heading = page.locator('.cal-toolbar h2');

  await page.goto('/');
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Calendar' }).click();
  await page.locator('.cal__event').first().waitFor();
  await page.waitForTimeout(400);
  await shot('november');

  await page.getByRole('link', { name: 'Next month, December 2026' }).click();
  await heading.filter({ hasText: 'December 2026' }).waitFor();
  await page.getByText('Nothing listed for December yet').waitFor();
  await page.waitForTimeout(400);
  await shot('next-month');

  await page.getByRole('link', { name: 'Today', exact: true }).click();
  await heading.filter({ hasText: 'November 2026' }).waitFor();
  await page
    .getByRole('group', { name: 'Where' })
    .getByRole('button')
    .filter({ hasText: 'Streaming' })
    .click();
  await page.locator('.page-title .lead').filter({ hasText: 'match your filters' }).waitFor();
  await page.waitForTimeout(400);
  await shot('streaming');

  await page.getByRole('group', { name: 'Where' }).getByRole('button').filter({ hasText: 'All' }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.cal__day:not(.cal__day--outside)').nth(4).click();
  await page.locator('sx-calendar-day-list').waitFor();
  await page.locator('sx-calendar-day-list').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await shot('phone-day-list', { phone: true });
};

export default journey;
