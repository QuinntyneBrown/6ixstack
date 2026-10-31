import { APIRequestContext, Page, request } from '@playwright/test';
import { guarded } from './guarded';

async function xsrfHeader(page: Page): Promise<Record<string, string>> {
  const cookie = (await page.context().cookies()).find((c) => c.name === 'XSRF-TOKEN');
  return cookie ? { 'X-XSRF-TOKEN': decodeURIComponent(cookie.value) } : {};
}

/** The id of a waiting submission, read from the queue as the signed-in moderator. */
export async function submissionId(page: Page, slug: string): Promise<string> {
  const queue = await (await page.request.get('/api/moderation/queue')).json();
  const card = queue.cards.find((c: { slug: string }) => c.slug === slug);
  if (!card) throw new Error(`${slug} is not waiting in the queue`);
  return card.id;
}

/** Undoes an approval through the API, so a test leaves the shared database as it found it. */
export async function undoApproval(page: Page, id: string): Promise<void> {
  const response = await page.request.post(`/api/moderation/submissions/${id}/undo-approval`, {
    headers: await xsrfHeader(page),
  });
  if (!response.ok()) throw new Error(`Undo failed: ${response.status()}`);
}

/** Another moderator (Sam), signed in on their own connection, looking at a submission. */
export async function samIsReviewing(baseURL: string, id: string): Promise<APIRequestContext> {
  const sam = await request.newContext({ baseURL });
  await sam.post('/api/test/sign-in', { data: { email: 'sam@6ixstack.dev' } });
  const token = (await sam.storageState()).cookies.find((c) => c.name === 'XSRF-TOKEN')?.value ?? '';
  await sam.post(`/api/moderation/submissions/${id}/presence`, {
    headers: { 'X-XSRF-TOKEN': decodeURIComponent(token) },
  });
  return sam;
}

/** Answers the next approval with a 500, until the returned function is called. */
export async function failApprovals(page: Page): Promise<() => Promise<void>> {
  const handler = guarded(page, (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/problem+json',
      body: '{"status":500,"referenceCode":"5D2A-11F0"}',
    }),
  );
  await page.route('**/api/moderation/submissions/*/approve', handler);
  return () => page.unroute('**/api/moderation/submissions/*/approve', handler);
}

/** Answers approvals with the 409 another moderator's earlier decision produces. */
export async function approvalsConflict(page: Page, decidedBy: string): Promise<void> {
  await page.route('**/api/moderation/submissions/*/approve', (route) =>
    route.fulfill({
      status: 409,
      contentType: 'application/problem+json',
      body: JSON.stringify({ status: 409, decision: 'approved', decidedBy, reason: 'decided' }),
    }),
  );
}

/** Answers Undo with the 409 the server sends after the 8 s window. */
export async function undoTooLate(page: Page): Promise<void> {
  await page.route('**/api/moderation/submissions/*/undo-approval', (route) =>
    route.fulfill({
      status: 409,
      contentType: 'application/problem+json',
      body: JSON.stringify({ status: 409, decision: 'approved', decidedBy: null, reason: 'too-late' }),
    }),
  );
}

/** Answers approvals as the API does for a published (or duplicate) approval, without changing any data. */
export async function approvalsSucceed(
  page: Page,
  approved: { title: string; organizer: string; duplicate?: { slug: string; dateLabel: string } },
): Promise<void> {
  await page.route('**/api/moderation/submissions/*/approve', (route) => {
    const id = route.request().url().split('/').at(-2)!;
    return route.fulfill({
      json: {
        eventId: id,
        title: approved.title,
        organizerName: approved.organizer,
        decisionId: '00000000-0000-0000-0000-000000000001',
        undoDeadlineUtc: '2026-11-02T14:00:08Z',
        isPublished: true,
        possibleDuplicate: approved.duplicate ? { eventId: id, ...approved.duplicate } : null,
      },
    });
  });
}

/** Submits a fresh event through the public form's API, so a test can reject it without touching the seed. */
export async function freshSubmission(page: Page, title: string): Promise<{ title: string; email: string }> {
  const email = `reject-${Date.now()}-${Math.round(Math.random() * 1e6)}@example.com`;
  const response = await page.request.post('/api/submissions', {
    headers: await xsrfHeader(page),
    data: {
      title,
      organizerName: 'Toronto Test Meetup',
      description: 'A short talk about testing developer tools.',
      topics: ['dotnet'],
      date: '2026-12-02',
      timeZoneId: 'America/Toronto',
      startTime: '18:00',
      endTime: '20:00',
      format: 'inPerson',
      venueName: 'Centre for Social Innovation',
      city: 'Toronto',
      streetAddress: '192 Spadina Ave',
      streamUrl: null,
      isFree: true,
      priceCad: null,
      ticketUrl: null,
      contactEmail: email,
    },
  });
  if (!response.ok()) throw new Error(`Submission failed: ${response.status()}`);
  return { title, email };
}

/** Holds rejections until the returned function is called. */
export async function holdRejections(page: Page): Promise<() => void> {
  let release!: () => void;
  const released = new Promise<void>((resolve) => (release = resolve));
  await page.route(
    '**/api/moderation/submissions/*/reject',
    guarded(page, async (route) => {
      await released;
      await route.continue();
    }),
  );
  return release;
}

/** Answers rejections with a 500 until the returned function is called. */
export async function failRejections(page: Page): Promise<() => Promise<void>> {
  const handler = guarded(page, (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/problem+json',
      body: '{"status":500,"referenceCode":"8A1C-30DE"}',
    }),
  );
  await page.route('**/api/moderation/submissions/*/reject', handler);
  return () => page.unroute('**/api/moderation/submissions/*/reject', handler);
}

/** Answers rejections with the 409 an earlier approval by `decidedBy` produces. */
export async function rejectionsConflict(page: Page, decidedBy: string): Promise<void> {
  await page.route('**/api/moderation/submissions/*/reject', (route) =>
    route.fulfill({
      status: 409,
      contentType: 'application/problem+json',
      body: JSON.stringify({ status: 409, decision: 'approved', decidedBy, reason: 'decided' }),
    }),
  );
}

/** Answers rejections as the API does for a spam rejection, without changing any data. */
export async function rejectionsSucceed(
  page: Page,
  rejected: { title: string; organizer: string; to: string },
): Promise<void> {
  await page.route('**/api/moderation/submissions/*/reject', (route) =>
    route.fulfill({
      json: {
        eventId: route.request().url().split('/').at(-2),
        title: rejected.title,
        organizerName: rejected.organizer,
        status: 'rejected',
        emailPreview: {
          to: rejected.to,
          subject: `“${rejected.title}” wasn’t approved`,
          body: `A moderator reviewed “${rejected.title}”.\n\nReason: spam or advertising.\n\n“This is advertising for a trading course, not a developer event.”\n\nWe won’t list it on 6ixstack.`,
        },
      },
    }),
  );
}
