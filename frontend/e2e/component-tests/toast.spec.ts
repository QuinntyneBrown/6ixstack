import { expect, test } from '@playwright/test';
import { ToastPlaygroundStory } from '../pages/toast-playground.story';

// L2-074 toasts; design: docs/detailed-designs/site/toasts-and-banners.
test.describe('Toasts', () => {
  test('a toast has a title, text, an action and Dismiss inside a polite live region', async ({ page }) => {
    const story = new ToastPlaygroundStory(page);
    await story.open();

    await story.show('info');

    await expect(story.region).toHaveAttribute('role', 'status');
    await expect(story.region).toHaveAttribute('aria-live', 'polite');
    const toast = story.toast('Filters cleared');
    await expect(toast.locator('.toast__text')).toHaveText('Showing all 14 events.');
    await expect(toast.getByRole('button', { name: 'Undo' })).toBeVisible();
    await story.dismiss('Filters cleared');
    await expect(toast).toHaveCount(0);
  });

  test('an info toast disappears after 8 seconds', async ({ page }) => {
    const story = new ToastPlaygroundStory(page);
    await story.open();
    await story.show('info');

    await story.wait(7_900);
    await expect(story.toast('Filters cleared')).toHaveCount(1);
    await story.wait(200);

    await expect(story.toast('Filters cleared')).toHaveCount(0);
  });

  test('hovering pauses the countdown, which resumes from where it stopped', async ({ page }) => {
    const story = new ToastPlaygroundStory(page);
    await story.open();
    await story.show('success');
    await story.wait(7_000);

    await story.hover('Added to Google Calendar');
    await story.wait(5_000);
    await expect(story.toast('Added to Google Calendar')).toHaveCount(1);

    // Hovered with about 1 s left; after the pointer leaves, the rest of that second still runs.
    await story.moveAway();
    await story.wait(700);
    await expect(story.toast('Added to Google Calendar')).toHaveCount(1);
    await story.wait(300);
    await expect(story.toast('Added to Google Calendar')).toHaveCount(0);
  });

  test('a danger toast is an alert without a countdown and stays until dismissed', async ({ page }) => {
    const story = new ToastPlaygroundStory(page);
    await story.open();
    await story.show('danger');

    await story.wait(60_000);

    const toast = story.toast("Couldn't copy the link");
    await expect(toast).toHaveAttribute('role', 'alert');
    await expect(story.progressBar("Couldn't copy the link")).toHaveCount(0);
    await story.dismiss("Couldn't copy the link");
    await expect(toast).toHaveCount(0);
  });

  test('a fourth toast removes the oldest, keeping three with the newest at the bottom', async ({ page }) => {
    const story = new ToastPlaygroundStory(page);
    await story.open();

    await story.show('success');
    await story.show('info');
    await story.show('warning');
    await story.show('danger');

    await expect(story.titles).toHaveText([
      'Filters cleared',
      'Link checks are slow',
      "Couldn't copy the link",
    ]);
  });
});
