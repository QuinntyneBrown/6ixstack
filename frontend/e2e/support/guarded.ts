import { Page, Route } from '@playwright/test';

/**
 * Wraps a route handler that waits (a delay, a held request, a fetch) so that, when its test ends first and the page
 * closes, the late failure is ignored instead of surfacing in whichever test runs next in the same worker.
 */
export function guarded(
  page: Page,
  handler: (route: Route) => Promise<void>,
): (route: Route) => Promise<void> {
  return async (route) => {
    try {
      await handler(route);
    } catch (error) {
      if (!page.isClosed() && !/Test ended|has been closed/.test(String(error))) throw error;
    }
  };
}
