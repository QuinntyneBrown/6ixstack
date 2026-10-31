import { expect, test } from '../fixtures';
import { CancelEventDialog } from '../pages/cancel-event.dialog';
import { EditEventPage } from '../pages/edit-event.page';
import { OrganizerDashboardPage } from '../pages/organizer-dashboard.page';
import { failCancels, holdCancels, ownEvent, withKnownAttendees } from '../support/editing';
import { ORGANIZER, signInAs } from '../support/session';

const DAY = 'Azure Data & AI Day GTA';
const REASON = 'Our venue double-booked the room. We’re moving to January and will post the new date here.';

/** Priya's dashboard with the Cancel dialog open for a row. */
async function openCancel(page: import('@playwright/test').Page, title: string): Promise<CancelEventDialog> {
  await signInAs(page, ORGANIZER);
  const dashboard = new OrganizerDashboardPage(page);
  await dashboard.open();
  await dashboard.row(title).cancel.click();
  const dialog = new CancelEventDialog(page);
  await expect(dialog.panel).toBeVisible();
  return dialog;
}

// L2-056 cancel an event; design: organizer/cancel-event. Seeded events are never cancelled: the full cancellation
// uses the test's own waiting submission, and the busy and failed states are stubbed.
test.describe('Cancel an event', () => {
  test('cancelling with a reason marks the event cancelled and says so', async ({ page, baseURL }) => {
    const own = await ownEvent(page, baseURL!, `Testing meetup ${Date.now()}`, 'waiting');
    const dashboard = new OrganizerDashboardPage(page);
    await dashboard.open();

    await dashboard.row(own.title).cancel.click();
    const dialog = new CancelEventDialog(page);
    await expect(dialog.panel).toHaveAccessibleName(`Cancel “${own.title}”?`);
    await expect(dialog.keep).toBeFocused();
    await expect(dialog.emailAttendees).toHaveCount(0);
    await dialog.cancelWith(REASON);

    await expect(dialog.panel).toHaveCount(0);
    await expect(dialog.toast(own.title)).toContainText(
      'It’s marked cancelled on 6ixstack and in calendar feeds.',
    );
    await expect(dashboard.row(own.title).status).toHaveText('Cancelled');
    await expect(dashboard.row(own.title).cancel).toHaveCount(0);
  });

  test('a cancelled event’s edit page is read-only and quotes the reason', async ({ page, baseURL }) => {
    const own = await ownEvent(page, baseURL!, `Testing workshop ${Date.now()}`, 'waiting');
    const edit = new EditEventPage(page);
    await edit.open(own.id);
    await edit.cancelEvent.click();
    await new CancelEventDialog(page).cancelWith(REASON);

    await expect(edit.cancelled).toContainText(REASON);
    await expect(edit.title).toBeDisabled();
    await expect(edit.save).toHaveCount(0);
    await expect(edit.cancelEvent).toHaveCount(0);
  });

  test('without a reason the error appears and focus moves to the reason', async ({ page }) => {
    const dialog = await openCancel(page, DAY);

    await dialog.confirmName.fill(DAY);
    await dialog.confirm.click();

    await expect(dialog.reasonError).toHaveText('Tell attendees why, in a sentence or two.');
    await expect(dialog.reason).toBeFocused();
    await expect(dialog.panel).toBeVisible();
  });

  test('a paid event needs its name typed before Cancel event enables', async ({ page }) => {
    const dialog = await openCancel(page, DAY);
    await dialog.reason.fill(REASON);

    await dialog.confirmName.fill('Azure Data & AI');
    await expect(dialog.confirm).toBeDisabled();
    await dialog.confirmName.fill('azure data & ai day gta');
    await expect(dialog.confirm).toBeEnabled();
  });

  test('while cancelling the inputs lock and Keep event still works', async ({ page }) => {
    const release = await holdCancels(page);
    const dialog = await openCancel(page, DAY);
    await dialog.confirmName.fill(DAY);

    await dialog.cancelWith(REASON);

    await expect(dialog.confirm).toHaveText('Cancelling…');
    await expect(dialog.confirm).toHaveAttribute('aria-busy', 'true');
    await expect(dialog.reason).toBeDisabled();
    await expect(dialog.keep).toBeEnabled();
    await release();
  });

  test('a failed cancellation keeps the reason and says nothing changed', async ({ page }) => {
    const restore = await failCancels(page);
    const dialog = await openCancel(page, DAY);
    await dialog.confirmName.fill(DAY);

    await dialog.cancelWith(REASON);

    await expect(dialog.failure).toContainText('It’s still published and nobody was emailed. Try again.');
    await expect(dialog.reason).toHaveValue(REASON);
    await expect(dialog.confirm).toHaveText('Try again');
    await restore();
  });

  test('Keep event closes the dialog and changes nothing', async ({ page }) => {
    const dialog = await openCancel(page, DAY);

    await dialog.keep.click();

    await expect(dialog.panel).toHaveCount(0);
    await expect(new OrganizerDashboardPage(page).row(DAY).status).toHaveText('Published');
  });

  test('when 6ixstack knows who is going, emailing them is offered and checked', async ({ page }) => {
    await withKnownAttendees(page, 318);
    const dialog = await openCancel(page, DAY);

    await expect(dialog.emailAttendees).toBeChecked();
    await expect(dialog.panel.getByText('Email the 318 people going')).toBeVisible();
  });

  test('Cancel event on the edit page opens the same dialog', async ({ page }) => {
    await signInAs(page, ORGANIZER);
    const dashboard = new OrganizerDashboardPage(page);
    await dashboard.open();
    await dashboard.row(DAY).edit.click();
    const edit = new EditEventPage(page);
    await expect(edit.title).toHaveValue(DAY);

    await edit.cancelEvent.click();

    const dialog = new CancelEventDialog(page);
    await expect(dialog.panel).toHaveAccessibleName(`Cancel “${DAY}”?`);
    await dialog.keep.click();
    await expect(edit.cancelEvent).toBeFocused();
  });
});
