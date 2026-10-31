import { APIRequestContext, Page, request, Route } from '@playwright/test';
import { guarded } from './guarded';
import { signInWithLink } from './session';

/** A moderator (Jordan) on their own connection, with the anti-forgery header for writes. */
async function jordan(baseURL: string): Promise<{ api: APIRequestContext; headers: Record<string, string> }> {
  const api = await request.newContext({ baseURL });
  const signedIn = await api.post('/api/test/sign-in', { data: { email: 'jordan@6ixstack.dev' } });
  if (!signedIn.ok()) throw new Error(`Moderator sign-in failed: ${signedIn.status()}`);
  const token = (await api.storageState()).cookies.find((c) => c.name === 'XSRF-TOKEN')?.value ?? '';
  return { api, headers: { 'X-XSRF-TOKEN': decodeURIComponent(token) } };
}

/** The id of a submission waiting in the queue. */
export async function queuedId(baseURL: string, slug: string): Promise<string> {
  const { api } = await jordan(baseURL);
  try {
    const queue = await (await api.get('/api/moderation/queue')).json();
    const card = queue.cards.find((c: { slug: string }) => c.slug === slug);
    if (!card) throw new Error(`${slug} is not waiting in the queue`);
    return card.id;
  } finally {
    await api.dispose();
  }
}

export interface OwnEvent {
  id: string;
  slug: string;
  title: string;
  email: string;
}

/**
 * A new organizer's own event, submitted from a fresh address, so edits never touch the seeded listings. With
 * `published`, the address is verified and Jordan approves it; with `sentBack`, Jordan asks for a venue address.
 * The page ends signed in as that organizer.
 */
export async function ownEvent(
  page: Page,
  baseURL: string,
  title: string,
  outcome: 'published' | 'sentBack' | 'waiting',
): Promise<OwnEvent> {
  const email = `owner-${Date.now()}-${Math.round(Math.random() * 1e6)}@example.com`;
  const submitted = await page.request.post('/api/submissions', {
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
  if (!submitted.ok()) throw new Error(`Submission failed: ${submitted.status()}`);

  if (outcome === 'published') {
    let link = '';
    for (let attempt = 0; attempt < 30 && !link; attempt++) {
      const mail = (await (
        await page.request.get(`/api/dev/mailbox?to=${encodeURIComponent(email)}`)
      ).json()) as {
        subject: string;
        textBody: string;
      }[];
      link =
        mail
          .find((m) => m.subject === 'Verify your email to publish events')
          ?.textBody.match(/https:\/\/\S+verify-email\S+/)?.[0] ?? '';
      if (!link) await new Promise((resolve) => setTimeout(resolve, 500));
    }
    if (!link) throw new Error(`No verification link reached ${email}`);
    const url = new URL(link);
    await page.request.get(url.pathname + url.search, { maxRedirects: 0 });
  }

  const { api, headers } = await jordan(baseURL);
  try {
    const queue = await (await api.get('/api/moderation/queue')).json();
    if (outcome === 'waiting') {
      const waiting = queue.cards.find((c: { title: string }) => c.title === title);
      await signInWithLink(page, email);
      return { id: waiting.id, slug: waiting.slug, title, email };
    }
    const card = queue.cards.find((c: { title: string }) => c.title === title);
    if (!card) throw new Error(`${title} is not waiting in the queue`);
    const decided =
      outcome === 'published'
        ? await api.post(`/api/moderation/submissions/${card.id}/approve`, { headers })
        : await api.post(`/api/moderation/submissions/${card.id}/reject`, {
            headers,
            data: { reason: 'missingVenueAddress', message: null },
          });
    if (!decided.ok()) throw new Error(`Moderation failed: ${decided.status()}`);
    await signInWithLink(page, email);
    return { id: card.id, slug: card.slug, title, email };
  } finally {
    await api.dispose();
  }
}

/** Takes a resubmitted test event out of the queue again, so later tests see the seeded queue. */
export async function rejectAgain(baseURL: string, id: string): Promise<void> {
  const { api, headers } = await jordan(baseURL);
  try {
    await api.post(`/api/moderation/submissions/${id}/reject`, {
      headers,
      data: { reason: 'notDeveloperEvent', message: null },
    });
  } finally {
    await api.dispose();
  }
}

/** Takes a published test event off the site: Jordan undoes the approval, then rejects it. */
export async function retire(baseURL: string, id: string): Promise<void> {
  const { api, headers } = await jordan(baseURL);
  try {
    const undone = await api.post(`/api/moderation/submissions/${id}/undo-approval`, { headers });
    if (!undone.ok()) throw new Error(`Undo failed: ${undone.status()}`);
  } finally {
    await api.dispose();
  }
  await rejectAgain(baseURL, id);
}

/** Holds PUT /api/organizer/events/* until the returned function answers it with a 200 built from the request. */
export async function holdSaves(page: Page): Promise<() => Promise<void>> {
  let held: Route | null = null;
  await page.route('**/api/organizer/events/*', async (route) => {
    if (route.request().method() !== 'PUT') {
      await route.fallback();
      return;
    }
    held = route;
  });
  return async () => {
    const body = held!.request().postDataJSON() as { title: string };
    await held!.fulfill({
      json: {
        slug: 'azure-data-ai-day-gta',
        title: body.title,
        status: 'published',
        goingCount: 318,
        resubmitted: false,
      },
    });
  };
}

/** Answers PUT /api/organizer/events/* with a 500 until the returned function is called. */
export async function failSaves(page: Page): Promise<() => Promise<void>> {
  const handler = (route: Route) =>
    route.request().method() === 'PUT'
      ? route.fulfill({ status: 500, contentType: 'application/problem+json', body: '{"status":500}' })
      : route.fallback();
  await page.route('**/api/organizer/events/*', handler);
  return () => page.unroute('**/api/organizer/events/*', handler);
}

/** Delays GET /api/organizer/events/{id} by `ms`. */
export async function slowEventLoad(page: Page, ms: number): Promise<void> {
  await page.route(
    /\/api\/organizer\/events\/[0-9a-f-]{36}$/,
    guarded(page, async (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      const response = await route.fetch();
      await new Promise((resolve) => setTimeout(resolve, ms));
      await route.fulfill({ response });
    }),
  );
}

/** Makes GET /api/organizer/events/{id} fail with a 500 until the returned function is called. */
export async function failEventLoad(page: Page): Promise<() => Promise<void>> {
  const pattern = /\/api\/organizer\/events\/[0-9a-f-]{36}$/;
  const handler = (route: Route) =>
    route.request().method() === 'GET'
      ? route.fulfill({ status: 500, contentType: 'application/problem+json', body: '{"status":500}' })
      : route.fallback();
  await page.route(pattern, handler);
  return () => page.unroute(pattern, handler);
}

/** Holds POST /api/organizer/events/{id}/cancel until the returned function answers it with a 500. */
export async function holdCancels(page: Page): Promise<() => Promise<void>> {
  let held: Route | null = null;
  await page.route('**/api/organizer/events/*/cancel', async (route) => {
    held = route;
  });
  return async () => {
    await held!.fulfill({ status: 500, contentType: 'application/problem+json', body: '{"status":500}' });
  };
}

/** Answers POST /api/organizer/events/{id}/cancel with a 500 until the returned function is called. */
export async function failCancels(page: Page): Promise<() => Promise<void>> {
  const handler = (route: Route) =>
    route.fulfill({ status: 500, contentType: 'application/problem+json', body: '{"status":500}' });
  await page.route('**/api/organizer/events/*/cancel', handler);
  return () => page.unroute('**/api/organizer/events/*/cancel', handler);
}

/** Answers the dashboard as if 6ixstack knew `count` people going to every event, so the email option shows. */
export async function withKnownAttendees(page: Page, count: number): Promise<void> {
  await page.route(
    '**/api/organizer/events',
    guarded(page, async (route) => {
      const response = await route.fetch();
      const body = (await response.json()) as { rows: { emailableAttendees: number }[] };
      for (const row of body.rows) row.emailableAttendees = count;
      await route.fulfill({ response, json: body });
    }),
  );
}

/** Answers POST /api/organizer/events/{id}/cancel with a success, without cancelling anything. */
export async function cancelsSucceed(page: Page, title: string, emailsQueued = 0): Promise<void> {
  await page.route('**/api/organizer/events/*/cancel', (route) =>
    route.fulfill({
      json: { title, status: 'cancelled', cancelledAtUtc: new Date().toISOString(), emailsQueued },
    }),
  );
}

/** Answers GET /api/organizer/events/{id} as if the event had been cancelled with `reason`. */
export async function asCancelled(page: Page, reason: string): Promise<void> {
  await page.route(
    /\/api\/organizer\/events\/[0-9a-f-]{36}$/,
    guarded(page, async (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      const response = await route.fetch();
      const body = await response.json();
      await route.fulfill({
        response,
        json: {
          ...body,
          status: 'cancelled',
          isReadOnly: true,
          readOnlyLead: 'Thursday, November 5, 2026 · 318 going',
          cancellationReason: reason,
          cancelledOnLabel: 'Oct 31',
        },
      });
    }),
  );
}
