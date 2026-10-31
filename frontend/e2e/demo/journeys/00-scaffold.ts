import type { Journey } from '../scripts/run-journey';

/** The 6ixstack app shell: light and dark themes, the phone menu, the not-found page, toasts and site banners. */
const journey: Journey = async ({ page, context, shot, storybookURL }) => {
  await page.goto('/');
  await page.getByRole('heading', { level: 1 }).waitFor();
  await shot('events-light');

  await page.emulateMedia({ colorScheme: 'dark' });
  await shot('events-dark');
  await page.emulateMedia({ colorScheme: 'light' });

  await page.setViewportSize({ width: 390, height: 720 });
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('dialog', { name: 'Menu' }).waitFor();
  await page.waitForTimeout(500);
  await shot('mobile-menu', { phone: true });
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 1280, height: 720 });

  await page.goto('/no-such-event');
  await page.getByRole('heading', { name: "We can't find that page" }).waitFor();
  await shot('not-found');

  // No app feature raises a toast yet, so this beat shows the library's toasts in Storybook.
  const storybook = await storybookURL();
  const toasts = await context.newPage();
  await toasts.goto(`${storybook}/iframe.html?id=components-toast--playground&viewMode=story`);
  for (const kind of ['success', 'info', 'danger']) {
    await toasts.getByRole('button', { name: `Show ${kind}` }).click();
  }
  await toasts.waitForTimeout(600);
  await shot('toasts', { page: toasts });
  await toasts.close();

  await page.goto('/');
  await page.getByRole('heading', { level: 1 }).waitFor();
  await context.setOffline(true);
  await page.getByText("You're offline").waitFor();
  await shot('offline-banner');

  await context.setOffline(false);
  await page.getByText("You're back online").waitFor();
  await shot('back-online-banner');
};

export default journey;
