import type { Journey } from '../scripts/run-journey';

/** Browse communities: the directory, a topic search, a city and sort, and the no-results state. */
const journey: Journey = async ({ page, shot }) => {
  await page.goto('/communities');
  const cards = page.locator('.card-grid sx-directory-card');
  await cards.first().waitFor();
  await page.waitForTimeout(600);
  await shot('communities');

  const search = page.getByRole('searchbox', { name: 'Search communities' });
  await search.fill('azure');
  await search.press('Enter');
  await page.waitForURL(/q=azure/);
  await page.waitForTimeout(800);
  await shot('search-a-topic');

  await search.fill('');
  await search.press('Enter');
  await page.getByLabel('City', { exact: true }).selectOption('Toronto');
  await page.getByLabel('Sort by').selectOption({ label: 'Next event soonest' });
  await page.waitForURL(/sort=next/);
  await page.waitForTimeout(800);
  await shot('city-and-sort');

  await page.getByLabel('City', { exact: true }).selectOption('');
  await search.fill('Rust');
  await search.press('Enter');
  await page.getByText('No communities match “Rust”').waitFor();
  await page.waitForTimeout(600);
  await shot('no-results');
};

export default journey;
