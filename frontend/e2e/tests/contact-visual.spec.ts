import { expect, test } from '../fixtures';
import { ContactPage } from '../pages/contact.page';
import { contactAnswers } from '../support/stub-api';

const NOTE =
  'Our November meetup moved from Living Arts Centre to Sheridan College. Could you update the venue on Fabric for Power BI developers?';

/** The contact page, filled in as the mocks show it. */
async function filled(page: import('@playwright/test').Page): Promise<ContactPage> {
  const contact = new ContactPage(page);
  await contact.open();
  await contact.fill('Priya Natarajan', 'priya@gtaazure.ca', 'Listing correction', NOTE);
  return contact;
}

// Visual parity with docs/mocks/pages/contact. Sends are stubbed except the success state.
test.describe('Contact visuals', () => {
  test('default', async ({ page }) => {
    const contact = new ContactPage(page);
    await contact.open();
    await expect(page).toHaveScreenshot('contact-default-light.png', { fullPage: true });
  });

  test('invalid', async ({ page }) => {
    const contact = new ContactPage(page);
    await contact.open();
    await contact.name.fill('Priya Natarajan');
    await contact.email.fill('priya@gtaazure');
    await contact.send.click();
    await expect(contact.summary).toBeFocused();
    await expect(page).toHaveScreenshot('contact-invalid-light.png', { fullPage: true });
  });

  test('submitting', async ({ page }) => {
    const release = await contactAnswers(page, 0);
    const contact = await filled(page);
    await contact.send.click();
    await expect(contact.send).toHaveText('Sending…');
    await page.mouse.move(0, 0);
    await expect(page).toHaveScreenshot('contact-submitting-light.png', { fullPage: true });
    await release();
  });

  test('success', async ({ page }) => {
    const contact = await filled(page);
    await contact.send.click();
    await expect(contact.sent).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(page).toHaveScreenshot('contact-success-light.png', { fullPage: true });
  });

  test('error', async ({ page }) => {
    await contactAnswers(page, 500);
    const contact = await filled(page);
    await contact.send.click();
    await expect(contact.failure).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(page).toHaveScreenshot('contact-error-light.png', { fullPage: true });
  });

  test('dark theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    const contact = new ContactPage(page);
    await contact.open();
    await expect(page).toHaveScreenshot('contact-default-dark.png', { fullPage: true });
  });

  test('phone width', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const contact = new ContactPage(page);
    await contact.open();
    await expect(page).toHaveScreenshot('contact-default-phone.png', { fullPage: true });
  });
});
