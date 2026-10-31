import { expect, test } from '../fixtures';
import { CommunitiesPage } from '../pages/communities.page';
import { failCommunities, slowCommunities } from '../support/stub-api';

// Visual parity with docs/mocks/pages/communities.
test.describe('Communities visuals', () => {
  test('default', async ({ page }) => {
    const communities = new CommunitiesPage(page);
    await communities.open();
    await expect(communities.cards).toHaveCount(10);
    await page.mouse.move(0, 0);
    await expect(page).toHaveScreenshot('communities-default-light.png', { fullPage: true });
  });

  test('no results', async ({ page }) => {
    const communities = new CommunitiesPage(page);
    await communities.open('?q=Rust');
    await expect(communities.empty).toBeVisible();
    await expect(page).toHaveScreenshot('communities-no-results-light.png');
  });

  test('empty city', async ({ page }) => {
    const communities = new CommunitiesPage(page);
    await communities.open('?city=Oakville');
    await expect(communities.empty).toBeVisible();
    await expect(page).toHaveScreenshot('communities-empty-light.png');
  });

  test('loading', async ({ page }) => {
    await slowCommunities(page, 5_000);
    const communities = new CommunitiesPage(page);
    await communities.open();
    await expect(communities.skeletonCards).toHaveCount(6);
    await expect(page).toHaveScreenshot('communities-loading-light.png');
  });

  test('error', async ({ page }) => {
    await failCommunities(page);
    const communities = new CommunitiesPage(page);
    await communities.open();
    await expect(communities.failure).toBeVisible();
    await expect(page).toHaveScreenshot('communities-error-light.png');
  });

  test('dark theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    const communities = new CommunitiesPage(page);
    await communities.open();
    await expect(communities.cards).toHaveCount(10);
    await page.mouse.move(0, 0);
    await expect(page).toHaveScreenshot('communities-default-dark.png');
  });

  test('phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const communities = new CommunitiesPage(page);
    await communities.open();
    await expect(communities.cards).toHaveCount(10);
    await expect(page).toHaveScreenshot('communities-default-phone.png');
  });
});
