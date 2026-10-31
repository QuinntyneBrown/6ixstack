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
