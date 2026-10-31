import { expect, test } from '../fixtures';
import { CalendarFeedsPage } from '../pages/calendar-feeds.page';
import { EventsPage } from '../pages/events.page';
import { SubscribeFeedDialog } from '../pages/subscribe-feed.dialog';
import { failFeedCounts, failFeedCreation, holdFeedCreation } from '../support/stub-api';

// L2-035 custom feed builder on /feeds and in the subscribe dialog; design: feeds-and-sharing/build-custom-feed.
test.describe('Build a custom feed', () => {
  test('AI and Azure in the GTA and streaming gives a ready feed with its link and calendar options', async ({
    page,
    baseURL,
  }) => {
    const feeds = new CalendarFeedsPage(page);
    await feeds.open();
    await expect(feeds.builder.where('GTA and streaming')).toBeChecked();

    await feeds.builder.choose(['AI', 'Azure']);
    await feeds.builder.create.click();

    await expect(feeds.ready.getByRole('heading', { name: 'Your feed is ready' })).toBeVisible();
    await expect(feeds.ready).toContainText(
      'AI and Azure events, in the GTA and streaming. 10 events right now; new ones appear on their own.',
    );
    const link = `webcal://${new URL(baseURL!).host}/feeds/ai-azure-gta-stream.ics`;
    await expect(feeds.result.link).toHaveValue(link);
    await expect(feeds.result.option('Google Calendar')).toHaveAttribute(
      'href',
      `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(link)}`,
    );
    await expect(feeds.result.option('Outlook')).toHaveAttribute(
      'href',
      `https://outlook.live.com/calendar/addcalendar?url=${encodeURIComponent(link)}`,
    );
    await expect(feeds.result.option('Apple Calendar')).toHaveAttribute('href', link);

    await feeds.result.copy.click();
    await expect(feeds.toast('Feed link copied')).toBeVisible();
    await feeds.buildAnother.click();
    await expect(feeds.builder.create).toBeVisible();
  });

  test('without a topic it asks for one and focuses the first choice', async ({ page }) => {
    const feeds = new CalendarFeedsPage(page);
    await feeds.open();

    await feeds.builder.create.click();

    await expect(feeds.builder.topicError).toHaveText('Pick at least one topic, or choose “All topics”.');
    await expect(feeds.builder.allTopics).toBeFocused();
    await expect(feeds.builder.topic('AI')).toHaveAttribute('aria-invalid', 'true');
  });

  test('All topics sets the topics aside and feeds everything in the chosen place', async ({ page }) => {
    const feeds = new CalendarFeedsPage(page);
    await feeds.open();

    await feeds.builder.allTopics.check();
    await expect(feeds.builder.topic('AI')).toBeDisabled();
    await feeds.builder.where('GTA only').check();
    await feeds.builder.create.click();

    await expect(feeds.result.link).toHaveValue(/\/feeds\/all-gta\.ics$/);
    await expect(feeds.ready).toContainText('All events, in the GTA only.');
  });

  test('if the ready-made counts fail, the builder still works', async ({ page }) => {
    await failFeedCounts(page);
    const feeds = new CalendarFeedsPage(page);
    await feeds.open();

    await expect(feeds.failure).toContainText('You can still build your own feed below.');
    await feeds.builder.choose(['React']);
    await feeds.builder.create.click();
    await expect(feeds.result.link).toHaveValue(/\/feeds\/react-gta-stream\.ics$/);
  });

  test('the feed only holds matching events', async ({ request }) => {
    const body = await (await request.get('/feeds/ai-azure-gta-stream.ics')).text();

    expect(body).toContain('SUMMARY:Vector search in Postgres');
    expect(body).not.toContain('SUMMARY:Testing React in 2027');
  });
});

test.describe('Subscribe to a calendar feed dialog', () => {
  async function openDialog(page: import('@playwright/test').Page): Promise<SubscribeFeedDialog> {
    const events = new EventsPage(page);
    await events.open();
    await events.getCalendarFeed.click();
    const dialog = new SubscribeFeedDialog(page);
    await expect(dialog.panel).toBeVisible();
    return dialog;
  }

  test('opens from the events page and creates a feed', async ({ page }) => {
    const dialog = await openDialog(page);
    await expect(dialog.description).toHaveText(
      'Your calendar app checks the feed every few hours, so new and changed events show up on their own.',
    );

    await dialog.builder.choose(['AI', 'Azure']);
    await dialog.builder.create.click();

    await expect(dialog.ready).toContainText(
      'AI and Azure events, in the GTA and streaming. 10 events right now.',
    );
    await expect(dialog.result.link).toHaveValue(/\/feeds\/ai-azure-gta-stream\.ics$/);
    await expect(dialog.done).toBeFocused();
    await dialog.done.click();
    await expect(dialog.panel).toBeHidden();
  });

  test('while creating, the choices are locked and Cancel still works', async ({ page }) => {
    const dialog = await openDialog(page);
    await holdFeedCreation(page);
    await dialog.builder.choose(['AI']);

    await dialog.builder.create.click();

    await expect(dialog.builder.create).toHaveText('Creating feed…');
    await expect(dialog.builder.create).toHaveAttribute('aria-busy', 'true');
    await expect(dialog.builder.topic('Azure')).toBeDisabled();
    await expect(dialog.cancel).toBeEnabled();
    await dialog.cancel.click();
    await expect(dialog.panel).toBeHidden();
  });

  test('a failure keeps the choices and offers Try again', async ({ page }) => {
    const dialog = await openDialog(page);
    const restore = await failFeedCreation(page);
    await dialog.builder.choose(['AI', 'Azure']);

    await dialog.builder.create.click();

    await expect(dialog.failure).toContainText('Your choices are saved.');
    await expect(dialog.builder.topic('Azure')).toBeChecked();
    await expect(dialog.builder.create).toHaveText('Try again');
    await restore();
    await dialog.builder.create.click();
    await expect(dialog.ready).toBeVisible();
  });
});
