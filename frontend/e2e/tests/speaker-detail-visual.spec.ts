import { expect, test } from '../fixtures';
import { SpeakerDetailPage } from '../pages/speaker-detail.page';
import { failSpeaker, slowSpeaker } from '../support/stub-api';

// Visual parity with docs/mocks/pages/speaker-detail.
test.describe('Speaker page visuals', () => {
  test('default', async ({ page }) => {
    const speaker = new SpeakerDetailPage(page);
    await speaker.open('priya-natarajan');
    await expect(speaker.upcomingRows).toHaveCount(1);
    await page.mouse.move(0, 0);
    await expect(page).toHaveScreenshot('speaker-detail-default-light.png', { fullPage: true });
  });

  test('no upcoming talks', async ({ page }) => {
    const speaker = new SpeakerDetailPage(page);
    await speaker.open('hannah-wright');
    await expect(speaker.noUpcoming).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(page).toHaveScreenshot('speaker-detail-empty-light.png');
  });

  test('error', async ({ page }) => {
    await failSpeaker(page);
    const speaker = new SpeakerDetailPage(page);
    await speaker.open('priya-natarajan');
    await expect(speaker.loadFailed).toBeVisible();
    await expect(page).toHaveScreenshot('speaker-detail-error-light.png');
  });

  test('loading', async ({ page }) => {
    await slowSpeaker(page, 5_000);
    const speaker = new SpeakerDetailPage(page);
    await speaker.open('priya-natarajan');
    await expect(speaker.skeleton).toBeVisible();
    await expect(page).toHaveScreenshot('speaker-detail-loading-light.png');
  });

  test('dark theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    const speaker = new SpeakerDetailPage(page);
    await speaker.open('priya-natarajan');
    await expect(speaker.upcomingRows).toHaveCount(1);
    await page.mouse.move(0, 0);
    await expect(page).toHaveScreenshot('speaker-detail-default-dark.png');
  });

  test('phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const speaker = new SpeakerDetailPage(page);
    await speaker.open('priya-natarajan');
    await expect(speaker.upcomingRows).toHaveCount(1);
    await expect(page).toHaveScreenshot('speaker-detail-default-phone.png');
  });
});
