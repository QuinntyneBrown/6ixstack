import type { Journey } from '../scripts/run-journey';

/** Manage events on the dashboard: Priya's events and statuses, a rejection's banner, and a first-time organizer. */
const journey: Journey = async ({ page, shot }) => {
  const signInAs = async (email: string) => {
    await page.context().clearCookies();
    const response = await page.request.post('/api/test/sign-in', { data: { email } });
    if (!response.ok()) throw new Error(`Sign-in failed for ${email}`);
  };
  const xsrf = async () =>
    decodeURIComponent((await page.context().cookies()).find((c) => c.name === 'XSRF-TOKEN')?.value ?? '');

  await signInAs('priya@gtaazure.ca');
  await page.goto('/');
  await page.getByRole('link', { name: /Your dashboard, signed in as/ }).waitFor();
  await shot('signed-in');

  await page.getByRole('link', { name: /Your dashboard, signed in as/ }).click();
  await page.locator('sx-table tbody tr').first().waitFor();
  await page.waitForTimeout(400);
  await shot('dashboard');

  // A moderator turns Fabric down with a note, then Priya looks again.
  await signInAs('jordan@6ixstack.dev');
  const queue = await (await page.request.get('/api/moderation/queue')).json();
  const fabric = queue.cards.find((c: { slug: string }) => c.slug === 'fabric-for-power-bi-developers').id;
  await page.request.post(`/api/moderation/submissions/${fabric}/reject`, {
    headers: { 'X-XSRF-TOKEN': await xsrf() },
    data: {
      reason: 'notDeveloperEvent',
      message: 'This reads like a product launch. Add the talks and speakers and send it again.',
    },
  });
  await signInAs('priya@gtaazure.ca');
  await page.goto('/organize');
  await page.locator('.submission-banner').waitFor();
  await page.waitForTimeout(400);
  await shot('rejected-banner');

  const email = 'maya@scarboroughdevs.ca';
  await page.context().clearCookies();
  await page.request.post('/api/auth/sign-in-links', { data: { email } });
  let link = '';
  for (let i = 0; i < 30 && !link; i++) {
    const mail = (await (
      await page.request.get(`/api/dev/mailbox?to=${encodeURIComponent(email)}`)
    ).json()) as {
      subject: string;
      textBody: string;
    }[];
    link =
      mail
        .find((m) => m.subject === 'Your 6ixstack sign-in link')
        ?.textBody.match(/https:\/\/\S+redeem\S+/)?.[0] ?? '';
    if (!link) await page.waitForTimeout(500);
  }
  const url = new URL(link);
  await page.goto(url.pathname + url.search);
  await page.getByText('List your first event').waitFor();
  await page.waitForTimeout(400);
  await shot('first-time-organizer');
};

export default journey;
