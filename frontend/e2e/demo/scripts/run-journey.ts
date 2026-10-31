/**
 * Runs frontend/e2e/demo/journeys/<nn>-<slug>.ts in Chromium at 1280 × 720 and saves a screenshot at each beat to
 * docs/demos/<nn>-<slug>/screenshots/NN-<beat>.png.
 *
 * The app and the API run as Playwright runs them: the API on a freshly seeded SQLite database with the clock at
 * Monday, November 2, 2026, and `ng serve`. Set DEMO_BASE_URL to use servers that are already running.
 */
import { ChildProcess, spawn } from 'node:child_process';
import { mkdirSync, readdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { Browser, BrowserContext, chromium, Page } from '@playwright/test';
import { startApi } from '../../support/api-server';
import { demoPaths, FRONTEND } from './paths';

export const TODAY = new Date('2026-11-02T14:00:00Z');

export interface ShotOptions {
  /** Capture the full page instead of the 1280 × 720 viewport. */
  fullPage?: boolean;
  /** Frame a phone-width capture in the middle of a 1280 × 720 canvas. */
  phone?: boolean;
  /** Capture this page instead of the journey's main page. */
  page?: Page;
}

export interface DemoContext {
  page: Page;
  context: BrowserContext;
  browser: Browser;
  baseURL: string;
  /** Saves the current view as the next numbered screenshot, e.g. shot('dark-theme') → 02-dark-theme.png. */
  shot(beat: string, options?: ShotOptions): Promise<void>;
  /** Base URL of the component library's built Storybook, started on first use. */
  storybookURL(): Promise<string>;
}

export type Journey = (demo: DemoContext) => Promise<void>;

async function waitFor(url: string, timeoutMs = 180_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`${url} did not start`);
}

/** Places a phone-width screenshot in the middle of a 1280 × 720 canvas in the page's own background colour. */
async function framePhoneShot(browser: Browser, page: Page, file: string): Promise<void> {
  const image = (await page.screenshot()).toString('base64');
  const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const frame = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await frame.setContent(
    `<body style="margin:0;height:720px;display:grid;place-items:center;background:${background}">` +
      `<img src="data:image/png;base64,${image}" style="max-height:680px;border-radius:24px;box-shadow:0 20px 48px rgb(0 0 0 / .25)"></body>`,
  );
  await frame.screenshot({ path: file });
  await frame.close();
}

export async function runJourney(journey: string): Promise<string[]> {
  const paths = demoPaths(journey);
  const module = (await import(resolve(__dirname, '../journeys', `${journey}.ts`))) as { default: Journey };

  const processes: ChildProcess[] = [];
  let baseURL = process.env['DEMO_BASE_URL'];
  if (!baseURL) {
    processes.push(await startApi('demo'));
    processes.push(
      spawn('npx', ['ng', 'serve', 'sixstack', '--port', '4210'], { cwd: FRONTEND, stdio: 'ignore' }),
    );
    baseURL = 'http://localhost:4210';
    await waitFor(baseURL);
  }

  rmSync(paths.screenshots, { recursive: true, force: true });
  mkdirSync(paths.screenshots, { recursive: true });

  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      baseURL,
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 1,
      colorScheme: 'light',
      locale: 'en-CA',
      timezoneId: 'America/Toronto',
    });
    const page = await context.newPage();
    await page.clock.install({ time: TODAY });
    let index = 0;
    let storybook: string | undefined;
    await module.default({
      page,
      context,
      browser,
      baseURL,
      shot: async (beat, options) => {
        index++;
        const target = options?.page ?? page;
        await target.waitForTimeout(400);
        const file = resolve(paths.screenshots, `${String(index).padStart(2, '0')}-${beat}.png`);
        if (options?.phone) {
          await framePhoneShot(browser, target, file);
        } else {
          await target.screenshot({ path: file, fullPage: options?.fullPage ?? false });
        }
        console.log(`  shot ${file}`);
      },
      storybookURL: async () => {
        if (!storybook) {
          processes.push(
            spawn('npx', ['tsx', 'e2e/support/serve-storybook.ts'], { cwd: FRONTEND, stdio: 'ignore' }),
          );
          storybook = 'http://localhost:6007';
          await waitFor(`${storybook}/iframe.html`, 600_000);
        }
        return storybook;
      },
    });
  } finally {
    await browser.close();
    processes.forEach((p) => p.kill());
  }
  return readdirSync(paths.screenshots).filter((f) => f.endsWith('.png'));
}
