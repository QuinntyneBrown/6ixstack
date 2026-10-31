import { expect, test } from '../fixtures';
import { EditEventPage } from '../pages/edit-event.page';
import { OrganizerDashboardPage } from '../pages/organizer-dashboard.page';
import { failEventLoad, failSaves, holdSaves, queuedId, slowEventLoad } from '../support/editing';
import { ORGANIZER, signInAs } from '../support/session';

const DAY = 'Azure Data & AI Day GTA';

/** Opens the edit page of a dashboard row as Priya and waits for its details. */
async function openFromDashboard(
  page: import('@playwright/test').Page,
  title: string,
): Promise<EditEventPage> {
  await signInAs(page, ORGANIZER);
  const dashboard = new OrganizerDashboardPage(page);
  await dashboard.open();
  const row = dashboard.row(title);
  await (title === DAY ? row.edit : row.view).click();
  const edit = new EditEventPage(page);
  await expect(edit.title).toHaveValue(title);
  await page.mouse.move(0, 0);
  return edit;
}

// Visual parity with docs/mocks/pages/edit-event and forbidden/default. Saves are stubbed, so nothing changes.
test.describe('Edit event visuals', () => {
  test('default', async ({ page }) => {
    await openFromDashboard(page, DAY);
    await expect(page).toHaveScreenshot('edit-event-default-light.png', { fullPage: true });
  });

  test('invalid', async ({ page }) => {
    const edit = await openFromDashboard(page, DAY);
    await edit.streetAddress.fill('');
    await edit.ticketUrl.fill('tickets.example.org/azure-data-ai-day');
    await edit.saveChanges();
    await expect(edit.summary).toBeFocused();
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await expect(page).toHaveScreenshot('edit-event-invalid-light.png', { fullPage: true });
  });

  test('submitting', async ({ page }) => {
    const release = await holdSaves(page);
    const edit = await openFromDashboard(page, DAY);
    await edit.saveChanges();
    await expect(edit.save).toHaveText('Saving…');
    await page.mouse.move(0, 0);
    await expect(page.locator('form.form-card')).toHaveScreenshot('edit-event-submitting-light.png');
    await release();
  });

  test('success', async ({ page }) => {
    const release = await holdSaves(page);
    const edit = await openFromDashboard(page, DAY);
    await edit.saveChanges();
    await release();
    await expect(edit.saved).toBeVisible();
    await page.mouse.move(0, 0);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await expect(page).toHaveScreenshot('edit-event-success-light.png');
  });

  test('failed', async ({ page }) => {
    await failSaves(page);
    const edit = await openFromDashboard(page, DAY);
    await edit.saveChanges();
    await expect(edit.saveFailed).toBeVisible();
    await page.mouse.move(0, 0);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await expect(page).toHaveScreenshot('edit-event-failed-light.png');
  });

  test('read-only', async ({ page }) => {
    await openFromDashboard(page, 'Copilot Studio for developers');
    await expect(page).toHaveScreenshot('edit-event-read-only-light.png', { fullPage: true });
  });

  test('loading', async ({ page }) => {
    await signInAs(page, ORGANIZER);
    const dashboard = new OrganizerDashboardPage(page);
    await dashboard.open();
    const id = (await dashboard.row(DAY).edit.getAttribute('href'))!.split('/')[3];
    await slowEventLoad(page, 5_000);
    const edit = new EditEventPage(page);
    await edit.open(id);
    await expect(edit.skeleton.first()).toBeVisible();
    await expect(page).toHaveScreenshot('edit-event-loading-light.png');
  });

  test('error', async ({ page }) => {
    await signInAs(page, ORGANIZER);
    const dashboard = new OrganizerDashboardPage(page);
    await dashboard.open();
    const id = (await dashboard.row(DAY).edit.getAttribute('href'))!.split('/')[3];
    await failEventLoad(page);
    const edit = new EditEventPage(page);
    await edit.open(id);
    await expect(edit.loadFailed).toBeVisible();
    await expect(page).toHaveScreenshot('edit-event-error-light.png');
  });

  test('forbidden', async ({ page, baseURL }) => {
    const id = await queuedId(baseURL!, 'rust-in-production-at-scale');
    await signInAs(page, ORGANIZER);
    const edit = new EditEventPage(page);
    await edit.open(id);
    await expect(edit.forbidden).toBeVisible();
    await expect(page).toHaveScreenshot('forbidden-default-light.png');
  });

  test('dark theme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await openFromDashboard(page, DAY);
    await expect(page).toHaveScreenshot('edit-event-default-dark.png', { fullPage: true });
  });

  test('phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openFromDashboard(page, DAY);
    await expect(page).toHaveScreenshot('edit-event-default-phone.png', { fullPage: true });
  });
});
