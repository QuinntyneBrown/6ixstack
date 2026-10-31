import { APIRequestContext } from '@playwright/test';

export interface DevMail {
  to: string;
  subject: string;
  textBody: string;
}

/** Waits for an email to `to` whose subject starts with `subject` in the API's dev mailbox (the outbox polls each second). */
export async function waitForMail(request: APIRequestContext, to: string, subject: string): Promise<DevMail> {
  for (let attempt = 0; attempt < 30; attempt++) {
    const response = await request.get(`/api/dev/mailbox?to=${encodeURIComponent(to)}`);
    const mail = (await response.json()) as DevMail[];
    const found = mail.find((m) => m.subject.startsWith(subject));
    if (found) return found;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`No email "${subject}" reached ${to}`);
}

/** The first link in an email's text that starts with `prefix`, as a path the app can open. */
export function linkIn(mail: DevMail, prefix: string): string {
  const match = mail.textBody.match(new RegExp(`${prefix.replace(/[/.?]/g, '\\$&')}\\S+`));
  if (!match) throw new Error(`No ${prefix} link in "${mail.subject}"`);
  return new URL(match[0]).pathname + new URL(match[0]).search;
}
