import { guarded } from './guarded';
import { Page } from '@playwright/test';

export const ORGANIZER = 'priya@gtaazure.ca';
export const MODERATOR = 'jordan@6ixstack.dev';
/** GTA Azure's co-organizer, seeded with three unread and two read notifications. */
export const CO_ORGANIZER = 'marcus@gtaazure.ca';

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

/** Signs a brand-new address in through the real magic link, as a first-time organizer would. */
export async function signInWithLink(page: Page, email: string): Promise<void> {
  const requested = await page.request.post('/api/auth/sign-in-links', { data: { email } });
  if (!requested.ok()) throw new Error(`Sign-in link failed: ${requested.status()}`);
  for (let attempt = 0; attempt < 30; attempt++) {
    const mail = (await (
      await page.request.get(`/api/dev/mailbox?to=${encodeURIComponent(email)}`)
    ).json()) as {
      subject: string;
      textBody: string;
    }[];
    const link = mail
      .find((m) => m.subject === 'Your 6ixstack sign-in link')
      ?.textBody.match(/https:\/\/\S+redeem\S+/)?.[0];
    if (link) {
      const url = new URL(link);
      await page.goto(url.pathname + url.search);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`No sign-in link reached ${email}`);
}
