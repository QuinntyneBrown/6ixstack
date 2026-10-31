import { BrowserContext, Page } from '@playwright/test';

/** Simulates the browser losing and regaining its connection. */
export async function goOffline(context: BrowserContext): Promise<void> {
  await context.setOffline(true);
}

export async function goOnline(context: BrowserContext): Promise<void> {
  await context.setOffline(false);
}

/** Makes the 6ixstack API unreachable (requests fail with no response) and counts health probes. */
export async function makeApiUnreachable(
  page: Page,
): Promise<{ probes: () => number; restore: () => Promise<void> }> {
  let probes = 0;
  await page.route('**/api/**', (route) => route.abort('connectionrefused'));
  await page.route('**/health/live', (route) => {
    probes++;
    return route.abort('connectionrefused');
  });
  return {
    probes: () => probes,
    restore: async () => {
      await page.unroute('**/api/**');
      await page.unroute('**/health/live');
    },
  };
}

export interface MaintenanceNotice {
  windowId: string;
  title: string;
  text: string;
}

/** Answers the maintenance-notice request with the given window, as the API would when one is configured. */
export async function announceMaintenance(page: Page, notice: MaintenanceNotice): Promise<void> {
  await page.route('**/api/site/notice', (route) =>
    route.fulfill({
      json: {
        ...notice,
        startsAtUtc: '2026-11-08T07:00:00Z',
        endsAtUtc: '2026-11-08T09:00:00Z',
      },
    }),
  );
}
