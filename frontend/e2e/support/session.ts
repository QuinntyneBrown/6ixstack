import { guarded } from './guarded';
import { Page } from '@playwright/test';

export const ORGANIZER = 'priya@gtaazure.ca';
export const MODERATOR = 'jordan@6ixstack.dev';

/** Signs the page's browser context in as a seeded user through the test-only seam (ADR 0002). */
export async function signInAs(page: Page, email: string): Promise<void> {
  const response = await page.request.post('/api/test/sign-in', { data: { email } });
  if (!response.ok()) throw new Error(`Test sign-in failed for ${email}: ${response.status()}`);
}

/** Answers GET /api/auth/me with this unread count, keeping the rest of the real answer. */
export async function withUnreadCount(page: Page, count: number): Promise<void> {
  await page.route(
    '**/api/auth/me',
    guarded(page, async (route) => {
      const response = await route.fetch();
      const body = { ...(await response.json()), unreadNotificationCount: count };
      await route.fulfill({ response, json: body });
    }),
  );
}
