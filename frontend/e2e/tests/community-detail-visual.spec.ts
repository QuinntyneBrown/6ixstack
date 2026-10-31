import { expect, test } from '../fixtures';
import { CommunityDetailPage } from '../pages/community-detail.page';
import { failCommunity, nothingScheduled, slowCommunity } from '../support/stub-api';

// Visual parity with docs/mocks/pages/community-detail.
test.describe('Community page visuals', () => {
  test('default', async ({ page }) => {
    const community = new CommunityDetailPage(page);
    await community.open('gta-azure-community');
    await expect(community.organizers).toHaveCount(2);
    await page.mouse.move(0, 0);
    await expect(page).toHaveScreenshot('community-detail-default-light.png', { fullPage: true });
  });

  test('nothing scheduled', async ({ page }) => {
    await nothingScheduled(page);
    const community = new CommunityDetailPage(page);
    await community.open('gta-azure-community');
    await expect(community.nothingScheduled).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(page).toHaveScreenshot('community-detail-empty-light.png');
  });

  test('error', async ({ page }) => {
    await failCommunity(page);
    const community = new CommunityDetailPage(page);
    await community.open('gta-azure-community');
    await expect(community.loadFailed).toBeVisible();
    await expect(page).toHaveScreenshot('community-detail-error-light.png');
  });

  test('loading', async ({ page }) => {
    await slowCommunity(page, 5_000);
    const community = new CommunityDetailPage(page);
    await community.open('gta-azure-community');
    await expect(community.skeleton).toBeVisible();
    await expect(page).toHaveScreenshot('community-detail-loading-light.png');
  });

  test('dark theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    const community = new CommunityDetailPage(page);
    await community.open('gta-azure-community');
    await expect(community.organizers).toHaveCount(2);
    await page.mouse.move(0, 0);
    await expect(page).toHaveScreenshot('community-detail-default-dark.png');
  });

  test('phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const community = new CommunityDetailPage(page);
    await community.open('gta-azure-community');
    await expect(community.organizers).toHaveCount(2);
    await expect(page).toHaveScreenshot('community-detail-default-phone.png');
  });
});
