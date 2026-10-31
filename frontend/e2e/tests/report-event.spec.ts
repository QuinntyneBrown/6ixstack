import { expect, test } from '../fixtures';
import { EventDetailPage } from '../pages/event-detail.page';
import { ReportEventDialog } from '../pages/report-event.dialog';
import { ownEvent, retire } from '../support/editing';
import { holdReports, reportsAnswer } from '../support/stub-api';

const DAY = 'azure-data-ai-day-gta';

/** The Azure Data & AI Day GTA page with Report a problem open. */
async function openReport(page: import('@playwright/test').Page): Promise<ReportEventDialog> {
  const detail = new EventDetailPage(page);
  await detail.open(DAY);
  await detail.reportProblem.click();
  const dialog = new ReportEventDialog(page);
  await expect(dialog.panel).toBeVisible();
  return dialog;
}

// L2-039 report form, L2-040 handling; design: submissions/report-problem. Real reports go to the test's own event,
// so seeded organizers are not notified; the busy and failed states are stubbed.
test.describe('Report a problem', () => {
  test('a report with a reason and details is sent and confirmed', async ({ page, baseURL }) => {
    const own = await ownEvent(page, baseURL!, `Report check ${Date.now()}`, 'published');
    try {
      await page.context().clearCookies();
      const detail = new EventDetailPage(page);
      await detail.open(own.slug);
      await detail.reportProblem.click();
      const dialog = new ReportEventDialog(page);
      await expect(dialog.description).toContainText(own.title);

      await dialog.report('Wrong date, time or venue', 'The ticket page says 6:30 PM.');

      await expect(dialog.sent).toContainText('Thanks — a moderator will check it today.');
      await expect(dialog.backToEvent).toBeFocused();
      await dialog.backToEvent.click();
      await expect(dialog.sent).toHaveCount(0);
      await expect(detail.reportProblem).toBeFocused();
    } finally {
      await retire(baseURL!, own.id);
    }
  });

  test('without a reason the error appears and focus moves to the first reason', async ({ page }) => {
    const dialog = await openReport(page);

    await dialog.send.click();

    await expect(dialog.reasonError).toHaveText(
      'Choose what is wrong so we can route it to the right person.',
    );
    await expect(dialog.reasons.first()).toBeFocused();
  });

  test('an invalid reply email asks for a real address', async ({ page }) => {
    const dialog = await openReport(page);
    await dialog.reason('Spam or not a dev event').check();
    await dialog.replyEmail.fill('not-an-email');

    await dialog.send.click();

    await expect(dialog.replyEmailError).toHaveText('Enter an email address like name@example.com.');
    await expect(dialog.replyEmail).toBeFocused();
  });

  test('while sending the fields lock and Cancel stays available', async ({ page }) => {
    const release = await holdReports(page);
    const dialog = await openReport(page);

    await dialog.report('Ticket or stream link is broken', 'The ticket link 404s.');

    await expect(dialog.send).toHaveText('Sending…');
    await expect(dialog.details).toBeDisabled();
    await expect(dialog.cancel).toBeEnabled();
    await release(500);
  });

  test('a failed send keeps what was written and offers Try again', async ({ page }) => {
    const restore = await reportsAnswer(page, 500);
    const dialog = await openReport(page);

    await dialog.report('The event is cancelled', 'The organizer posted that it is off.');

    await expect(dialog.failure).toContainText(
      'Check your connection and try again. Nothing you wrote was lost.',
    );
    await expect(dialog.reason('The event is cancelled')).toBeChecked();
    await expect(dialog.details).toHaveValue('The organizer posted that it is off.');
    await expect(dialog.send).toHaveText('Try again');
    await restore();
  });

  test('too many reports from one address shows the failed state', async ({ page }) => {
    await reportsAnswer(page, 429);
    const dialog = await openReport(page);

    await dialog.report('Spam or not a dev event');

    await expect(dialog.failure).toBeVisible();
  });
});
