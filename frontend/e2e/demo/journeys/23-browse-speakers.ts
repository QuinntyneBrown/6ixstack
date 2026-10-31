import type { Journey } from '../scripts/run-journey';

/** Browse speakers: the directory, a search, a topic filter and the no-results state. */
const journey: Journey = async ({ page, shot }) => {
  await page.goto('/speakers');
  await page.locator('.card-grid sx-directory-card').first().waitFor();
  await page.waitForTimeout(600);
  await shot('speakers');

  const search = page.getByRole('searchbox', { name: 'Search speakers' });
  await search.fill('Shopify');
  await search.press('Enter');
  await page.waitForURL(/q=Shopify/);
  await page.waitForTimeout(800);
  await shot('search-a-speaker');

  await search.fill('');
  await search.press('Enter');
  await page.getByLabel('Topic', { exact: true }).selectOption({ label: 'React' });
  await page.waitForURL(/topic=react/);
  await page.waitForTimeout(800);
  await shot('filter-by-topic');

  await page.getByLabel('Topic', { exact: true }).selectOption({ label: 'All topics' });
  await search.fill('Kotlin');
  await search.press('Enter');
  await page.getByText('No speakers match “Kotlin”').waitFor();
  await page.waitForTimeout(600);
  await shot('no-results');
};

export default journey;
