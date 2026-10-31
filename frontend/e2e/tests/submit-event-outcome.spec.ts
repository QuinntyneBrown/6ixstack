import { expect, test } from '../fixtures';
import { EventsPage } from '../pages/events.page';
import { SubmitEventPage } from '../pages/submit-event.page';
import { linkIn, waitForMail } from '../support/dev-mailbox';
import { blockStorage } from '../support/storage';
import { failSubmissions, holdSubmission, rejectSubmission } from '../support/stub-api';

const uniqueEmail = (name: string) => `${name}-${Date.now()}-${Math.round(Math.random() * 1e6)}@example.com`;

// L2-043 outcome, L2-044 draft, L2-085 verification; design: submissions/submit-event.
test.describe('Submit an event: outcome', () => {
  test('a valid submission shows the success panel and stays out of the list', async ({ page }) => {
    const submit = new SubmitEventPage(page);
    const email = uniqueEmail('priya');
    await submit.open();
    await submit.fill(SubmitEventPage.validInput('Fabric for Power BI developers, part 2', email));

    await submit.submit();

    await expect(submit.successTitle()).toHaveText(
      'Thanks — “Fabric for Power BI developers, part 2” is in review',
    );
    await expect(submit.successText()).toHaveText(`We sent a confirmation to ${email}.`);
    await expect(submit.nextSteps()).toHaveCount(3);
    await expect(submit.successAction('Back to events')).toBeVisible();
    await expect(submit.successAction('Submit another event')).toBeVisible();
    await expect(submit.successAction('Sign in to manage it')).toBeVisible();

    const events = new EventsPage(page);
    await events.open();
    await events.searchFor('part 2');
    await expect(events.emptyState).toBeVisible();
    expect(await events.rowTitles()).not.toContain('Fabric for Power BI developers, part 2');
  });

  test('while submitting, fields are disabled and the button is busy', async ({ page }) => {
    const submit = new SubmitEventPage(page);
    await submit.open();
    await submit.fill(SubmitEventPage.validInput('Busy state check', uniqueEmail('busy')));
    const release = await holdSubmission(page);

    await submit.submit();

    await expect(submit.busyButton()).toHaveAttribute('aria-busy', 'true');
    await expect(submit.field('Event title')).toBeDisabled();
    release();
    await expect(submit.successPanel).toBeVisible();
  });

  test('a server failure keeps every value and offers to try again', async ({ page }) => {
    const submit = new SubmitEventPage(page);
    await submit.open();
    await submit.fill(SubmitEventPage.validInput('Kept after failure', uniqueEmail('fail')));
    const restore = await failSubmissions(page);

    await submit.submit();

    await expect(submit.failure).toBeVisible();
    await expect(submit.field('Event title')).toHaveValue('Kept after failure');
    await expect(submit.field('Venue name')).toHaveValue('Living Arts Centre');
    await expect(submit.topic('Azure')).toBeChecked();

    await restore();
    await submit.submit();
    await expect(submit.successPanel).toBeVisible();
  });

  test('server field errors land on their fields', async ({ page }) => {
    const submit = new SubmitEventPage(page);
    await submit.open();
    await submit.fill(SubmitEventPage.validInput('Server says no', uniqueEmail('server')));
    await rejectSubmission(page, { contactEmail: ['Enter an email address like name@example.com.'] });

    await submit.submit();

    await expect(submit.summaryItems()).toHaveText(['Enter an email address like name@example.com.']);
    await expect(submit.fieldError('contactEmail')).toHaveText(
      'Enter an email address like name@example.com.',
    );
  });

  test('a draft comes back after leaving and is cleared by submitting', async ({ page }) => {
    const submit = new SubmitEventPage(page);
    await submit.open();
    await submit.fill({ title: 'Half-finished idea', format: 'Hybrid' });
    await page.waitForTimeout(700);

    await submit.open();
    await expect(submit.field('Event title')).toHaveValue('Half-finished idea');
    await expect(submit.formatOption('Hybrid')).toBeChecked();

    await submit.fill({
      ...SubmitEventPage.validInput('', uniqueEmail('draft')),
      title: undefined,
      format: 'Hybrid',
    });
    await submit.submit();
    await expect(submit.successPanel).toBeVisible();
    await submit.open();
    await expect(submit.field('Event title')).toHaveValue('');
  });

  test('without browser storage the form still submits', async ({ page }) => {
    await blockStorage(page);
    const submit = new SubmitEventPage(page);
    await submit.open();
    await submit.fill(SubmitEventPage.validInput('No storage needed', uniqueEmail('nostore')));

    await submit.submit();

    await expect(submit.successPanel).toBeVisible();
  });

  test('the emailed verification link confirms the address', async ({ page }) => {
    const submit = new SubmitEventPage(page);
    const email = uniqueEmail('verify');
    await submit.open();
    await submit.fill(SubmitEventPage.validInput('Verify me', email));
    await submit.submit();
    await expect(submit.successPanel).toBeVisible();

    const mail = await waitForMail(page.request, email, 'Verify your email');
    await page.goto(linkIn(mail, 'https://6ixstack.dev/auth/verify-email'));

    const events = new EventsPage(page);
    await expect(events.toast('Your email is verified')).toBeVisible();
    await expect(page).toHaveURL(/\/$/);

    await page.goto(linkIn(mail, 'https://6ixstack.dev/auth/verify-email'));
    await expect(events.toast('That link didn’t work')).toBeVisible();
  });
});
