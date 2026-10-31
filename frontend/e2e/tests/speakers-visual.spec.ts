import { expect, test } from '../fixtures';
import { SpeakersPage } from '../pages/speakers.page';
import { failSpeakers, slowSpeakers } from '../support/stub-api';

// Visual parity with docs/mocks/pages/speakers.
test.describe('Speakers visuals', () => {
  test('default', async ({ page }) => {
    const speakers = new SpeakersPage(page);
    await speakers.open();
    await expect(speakers.cards).toHaveCount(9);
    await page.mouse.move(0, 0);
    await expect(page).toHaveScreenshot('speakers-default-light.png', { fullPage: true });
  });

  test('no results', async ({ page }) => {
    const speakers = new SpeakersPage(page);
    await speakers.open('?q=Kotlin');
    await expect(speakers.empty).toBeVisible();
    await expect(page).toHaveScreenshot('speakers-no-results-light.png');
  });

  test('empty period', async ({ page }) => {
    const speakers = new SpeakersPage(page);
    await speakers.open('?topic=angular&period=year');
    await expect(speakers.empty).toBeVisible();
    await expect(page).toHaveScreenshot('speakers-empty-light.png');
  });

  test('loading', async ({ page }) => {
    await slowSpeakers(page, 5_000);
    const speakers = new SpeakersPage(page);
    await speakers.open();
    await expect(speakers.skeletonCards).toHaveCount(6);
    await expect(page).toHaveScreenshot('speakers-loading-light.png');
  });

  test('error', async ({ page }) => {
    await failSpeakers(page);
    const speakers = new SpeakersPage(page);
    await speakers.open();
    await expect(speakers.failure).toBeVisible();
    await expect(page).toHaveScreenshot('speakers-error-light.png');
  });

  test('dark theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    const speakers = new SpeakersPage(page);
    await speakers.open();
    await expect(speakers.cards).toHaveCount(9);
    await page.mouse.move(0, 0);
    await expect(page).toHaveScreenshot('speakers-default-dark.png');
  });

  test('phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const speakers = new SpeakersPage(page);
    await speakers.open();
    await expect(speakers.cards).toHaveCount(9);
    await expect(page).toHaveScreenshot('speakers-default-phone.png');
  });
});
