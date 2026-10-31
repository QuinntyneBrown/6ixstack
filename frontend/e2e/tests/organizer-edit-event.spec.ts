import { expect, test } from '../fixtures';
import { EditEventPage } from '../pages/edit-event.page';
import { EventDetailPage } from '../pages/event-detail.page';
import { OrganizerDashboardPage } from '../pages/organizer-dashboard.page';
import { ReviewQueuePage } from '../pages/review-queue.page';
import { SubmitEventPage } from '../pages/submit-event.page';
import {
  failEventLoad,
  failSaves,
  holdSaves,
  ownEvent,
  queuedId,
  rejectAgain,
  retire,
  slowEventLoad,
} from '../support/editing';
import { MODERATOR, ORGANIZER, signInAs } from '../support/session';

const DAY = 'Azure Data & AI Day GTA';

// L2-054 edit, L2-055 permissions and past events, L2-062 moderator editing; design: organizer/edit-event.
// Saves that change data use the test's own events, so the seeded listings stay as they are.
test.describe('Edit an event', () => {
  test('Edit on the dashboard opens the event with its status line and details', async ({ page }) => {
    await signInAs(page, ORGANIZER);
    const dashboard = new OrganizerDashboardPage(page);
    await dashboard.open();

    await dashboard.row(DAY).edit.click();

    const edit = new EditEventPage(page);
    await expect(edit.heading).toHaveText('Edit event');
    await expect(edit.statusLine).toHaveText('Published · 318 going · last edited Oct 28');
    await expect(edit.title).toHaveValue(DAY);
    await expect(edit.startTime).toHaveValue('09:00');
    await expect(edit.contactEmail).toHaveCount(0);
    await expect(edit.backLink).toHaveAttribute('href', '/organize');
  });

  test('moving the start time saves at once and the event page says so', async ({ page, baseURL }) => {
    const own = await ownEvent(page, baseURL!, `Testing tools night ${Date.now()}`, 'published');
    try {
      const edit = new EditEventPage(page);
      await edit.open(own.id);
      await expect(edit.statusLine).toHaveText('Published · 0 going');

      await edit.moveStart('18:30');
      await edit.saveChanges();

      await expect(edit.saved).toContainText(
        'The listing is updated. The 0 people going and every calendar feed that includes it will see the new details within an hour.',
      );
      await edit.viewListing.click();
      await expect(new EventDetailPage(page).alert('Start time changed to 6:30 PM')).toBeVisible();
    } finally {
      await retire(baseURL!, own.id);
    }
  });

  test('saving a sent-back event puts it back in review', async ({ page, baseURL }) => {
    const own = await ownEvent(page, baseURL!, `Testing clinic ${Date.now()}`, 'sentBack');
    try {
      const edit = new EditEventPage(page);
      await edit.open(own.id);
      await expect(edit.statusLine).toHaveText('Needs changes');

      await edit.streetAddress.fill('192 Spadina Ave, 2nd floor');
      await edit.saveChanges();

      await expect(edit.saved).toContainText(`“${own.title}” is back in review.`);
      await expect(edit.statusLine).toHaveText(/^In review · last edited /);
    } finally {
      await rejectAgain(baseURL!, own.id);
    }
  });

  test('invalid details are listed in the summary and nothing is saved', async ({ page }) => {
    await signInAs(page, ORGANIZER);
    const dashboard = new OrganizerDashboardPage(page);
    await dashboard.open();
    await dashboard.row(DAY).edit.click();
    const edit = new EditEventPage(page);
    await expect(edit.title).toHaveValue(DAY);

    await edit.streetAddress.fill('');
    await edit.ticketUrl.fill('tickets.example.org/azure-data-ai-day');
    await edit.saveChanges();

    await expect(edit.summaryItems()).toHaveText([
      'Enter the street address.',
      'Enter a full link that starts with https://',
    ]);
    await expect(edit.summary).toBeFocused();
  });

  test('while saving the fields lock and the button says Saving…', async ({ page }) => {
    await signInAs(page, ORGANIZER);
    const release = await holdSaves(page);
    const dashboard = new OrganizerDashboardPage(page);
    await dashboard.open();
    await dashboard.row(DAY).edit.click();
    const edit = new EditEventPage(page);
    await expect(edit.title).toHaveValue(DAY);

    await edit.saveChanges();

    await expect(edit.save).toHaveText('Saving…');
    await expect(edit.title).toBeDisabled();
    await release();
    await expect(edit.saved).toBeVisible();
    await expect(edit.title).toBeEnabled();
  });

  test('a failed save keeps every value and lets you save again', async ({ page }) => {
    await signInAs(page, ORGANIZER);
    const restore = await failSaves(page);
    const dashboard = new OrganizerDashboardPage(page);
    await dashboard.open();
    await dashboard.row(DAY).edit.click();
    const edit = new EditEventPage(page);
    await expect(edit.title).toHaveValue(DAY);

    await edit.title.fill(`${DAY} 2026`);
    await edit.saveChanges();

    await expect(edit.saveFailed).toContainText(
      'Everything you entered is still here; save again in a moment.',
    );
    await expect(edit.title).toHaveValue(`${DAY} 2026`);
    await expect(edit.title).toBeEnabled();
    await restore();
  });

  test('Discard changes goes back to your events without saving', async ({ page }) => {
    await signInAs(page, ORGANIZER);
    const dashboard = new OrganizerDashboardPage(page);
    await dashboard.open();
    await dashboard.row(DAY).edit.click();
    const edit = new EditEventPage(page);
    await edit.title.fill('Something else');

    await edit.discard.click();

    await expect(dashboard.heading).toHaveText('Your events');
    await expect(dashboard.row(DAY).root).toBeVisible();
  });

  test('another community’s event says who owns it and who you are', async ({ page, baseURL }) => {
    const id = await queuedId(baseURL!, 'rust-in-production-at-scale');
    await signInAs(page, ORGANIZER);
    const edit = new EditEventPage(page);

    await edit.open(id);

    await expect(edit.heading).toHaveText("You can't edit this event");
    await expect(edit.forbidden).toContainText(
      '“Rust in production at scale” is managed by Toronto Rust Meetup.',
    );
    await expect(edit.forbidden).toContainText(
      "You're signed in as priya@gtaazure.ca for GTA Azure Community.",
    );
    await expect(edit.forbidden.getByRole('link', { name: 'Back to your events' })).toHaveAttribute(
      'href',
      '/organize',
    );
  });

  test('a past event is read-only and can be duplicated as a new event', async ({ page }) => {
    await signInAs(page, ORGANIZER);
    const dashboard = new OrganizerDashboardPage(page);
    await dashboard.open();
    await dashboard.row('Copilot Studio for developers').view.click();
    const edit = new EditEventPage(page);

    await expect(edit.heading).toHaveText('Copilot Studio for developers');
    await expect(edit.lead).toHaveText(/^Thursday, October 29, 2026 · /);
    await expect(edit.readOnly).toContainText('Past events stay on 6ixstack as a record.');
    await expect(edit.title).toBeDisabled();
    await expect(edit.save).toHaveCount(0);

    await edit.duplicate.click();

    const submit = new SubmitEventPage(page);
    await expect(submit.field('Event title')).toHaveValue('Copilot Studio for developers');
    await expect(submit.field('Date')).toHaveValue('');
    await expect(submit.field('Email')).toHaveValue(ORGANIZER);
  });

  test('a moderator edits a waiting submission from its card and it stays in review', async ({ page }) => {
    await signInAs(page, MODERATOR);
    const queue = new ReviewQueuePage(page);
    await queue.open();

    await queue.card('Kubernetes on a budget').edit.click();

    const edit = new EditEventPage(page);
    await expect(edit.statusLine).toHaveText(/^In review/);
    await edit.saveChanges();
    await expect(edit.saved).toContainText('Changes saved');
    await expect(edit.statusLine).toHaveText(/^In review · last edited /);
  });

  test('a slow load shows the form skeleton, and a failed one offers Try again', async ({ page }) => {
    await signInAs(page, ORGANIZER);
    const dashboard = new OrganizerDashboardPage(page);
    await dashboard.open();
    const href = (await dashboard.row(DAY).edit.getAttribute('href'))!;
    const id = href.split('/')[3];
    await slowEventLoad(page, 2_000);
    const restore = await failEventLoad(page);
    const edit = new EditEventPage(page);

    await edit.open(id);

    await expect(edit.loadFailed).toContainText('The listing is safe. Try again in a moment.');
    await expect(edit.loadFailed.getByRole('link', { name: 'Back to your events' })).toHaveAttribute(
      'href',
      '/organize',
    );
    await restore();
    await edit.loadFailed.getByRole('button', { name: 'Try again' }).click();
    await expect(edit.skeleton.first()).toBeVisible();
    await expect(edit.title).toHaveValue(DAY, { timeout: 10_000 });
  });
});
