import type { Journey } from '../scripts/run-journey';

/** Read the site pages: About with its live stats, then the Code of Conduct from the footer. */
const journey: Journey = async ({ page, shot }) => {
  await page.goto('/about');
  await page.locator('sx-stats-row').waitFor();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(600);
  await shot('about');

  await page
    .getByRole('heading', { name: 'Who runs it' })
    .evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.waitForTimeout(500);
  await shot('who-runs-it');

  await page
    .getByRole('navigation', { name: 'Footer' })
    .getByRole('link', { name: 'Code of conduct' })
    .click();
  await page.getByRole('heading', { name: 'Code of conduct', level: 1 }).waitFor();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(600);
  await shot('code-of-conduct');

  await page
    .getByRole('heading', { name: 'Reporting' })
    .evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.waitForTimeout(500);
  await shot('reporting');
};

export default journey;
