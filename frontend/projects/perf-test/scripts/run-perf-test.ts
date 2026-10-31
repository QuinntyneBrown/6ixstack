/**
 * Builds the perf-test app, serves it, and measures each scenario in headless Chromium, like Fluent UI's
 * apps/perf-test. Usage: npm run perf-test [-- --scenario Icon --iterations 1000 --runs 5]
 * Writes dist/perf-test/report.json and prints a table of median render times.
 */
import { execSync } from 'node:child_process';
import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';
import { chromium } from '@playwright/test';

const arg = (name: string, fallback: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const iterations = Number(arg('iterations', '1000'));
const runs = Number(arg('runs', '5'));
const only = arg('scenario', '');

const root = resolve(__dirname, '../../..');
const dist = join(root, 'dist/perf-test/browser');
execSync('npx ng build perf-test', { cwd: root, stdio: 'inherit' });

const types: Record<string, string> = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html' };
const server = createServer((req, res) => {
  const path = join(dist, (req.url ?? '/').split('?')[0]);
  const file = existsSync(path) && statSync(path).isFile() ? path : join(dist, 'index.html');
  res.setHeader('Content-Type', types[extname(file)] ?? 'application/octet-stream');
  createReadStream(file).pipe(res);
});

async function main() {
  await new Promise<void>((done) => server.listen(4301, done));
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:4301/');
  const names = only ? [only] : await page.locator('li a').allTextContents();
  const report: { scenario: string; iterations: number; medianMs: number; samples: number[] }[] = [];
  for (const name of names) {
    const samples: number[] = [];
    for (let run = 0; run < runs; run++) {
      await page.goto(`http://localhost:4301/?scenario=${name}&iterations=${iterations}`);
      await page.waitForFunction(() => window.__perf !== undefined);
      samples.push(await page.evaluate(() => window.__perf!.renderMs));
    }
    const sorted = [...samples].sort((a, b) => a - b);
    report.push({ scenario: name, iterations, medianMs: sorted[Math.floor(sorted.length / 2)], samples });
  }
  await browser.close();
  server.close();
  mkdirSync(join(root, 'dist/perf-test'), { recursive: true });
  writeFileSync(join(root, 'dist/perf-test/report.json'), JSON.stringify(report, null, 2));
  console.table(
    report.map(({ scenario, iterations: n, medianMs }) => ({ scenario, iterations: n, medianMs })),
  );
}

main().catch((error) => {
  console.error(error);
  server.close();
  process.exit(1);
});
