import { expect, test } from '../fixtures';
import { SubmitEventPage } from '../pages/submit-event.page';
import { failSubmissions, slowReferenceData } from '../support/stub-api';

const filled = () => SubmitEventPage.validInput('Fabric for Power BI developers', 'priya@gtaazure.ca');

// Visual parity with docs/mocks/pages/submit-event.
test.describe('Submit an event visuals', () => {
  test('default', async ({ page }) => {
    const submit = new SubmitEventPage(page);
    await submit.open();
    await submit.fill(filled());
    await submit.settle();
    await expect(page).toHaveScreenshot('submit-event-default-light.png', { fullPage: true });
  });

  test('invalid', async ({ page }) => {
    const submit = new SubmitEventPage(page);
    await submit.open();
    await submit.submit();
    await expect(submit.errorSummary).toBeFocused();
    await submit.settle();
    await expect(page).toHaveScreenshot('submit-event-invalid-light.png', { fullPage: true });
  });

  test('error', async ({ page }) => {
    await failSubmissions(page);
    const submit = new SubmitEventPage(page);
    await submit.open();
    await submit.fill(filled());
    await submit.submit();
    await expect(submit.failure).toBeVisible();
    await submit.settle();
    await expect(page).toHaveScreenshot('submit-event-error-light.png', { fullPage: true });
  });

  test('loading', async ({ page }) => {
    await slowReferenceData(page, 5_000);
    const submit = new SubmitEventPage(page);
    await submit.startOpening();
    await expect(submit.skeletonSections).toHaveCount(3);
    await expect(page).toHaveScreenshot('submit-event-loading-light.png');
  });

  test('success', async ({ page }) => {
    const submit = new SubmitEventPage(page);
    await submit.open();
    await submit.fill({ ...filled(), email: 'priya+visual@gtaazure.ca' });
    await submit.submit();
    await expect(submit.successPanel).toBeVisible();
    await submit.settle();
    await expect(page).toHaveScreenshot('submit-event-success-light.png');
  });

  test('dark theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    const submit = new SubmitEventPage(page);
    await submit.open();
    await submit.fill(filled());
    await submit.settle();
    await expect(page).toHaveScreenshot('submit-event-default-dark.png', { fullPage: true });
  });

  test('phone, streaming', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const submit = new SubmitEventPage(page);
    await submit.open();
    await submit.fill({
      ...filled(),
      venue: undefined,
      city: undefined,
      address: undefined,
      format: 'Streaming',
      streamUrl: 'https://youtube.com/live/fabric',
    });
    await submit.settle();
    await expect(page).toHaveScreenshot('submit-event-streaming-phone.png', { fullPage: true });
  });
});
