import { expect, test } from '../fixtures';
import { SubmitEventPage } from '../pages/submit-event.page';

// L2-041 form and validation, L2-042 format-dependent fields, L2-045 loading; design: submissions/submit-event.
test.describe('Submit an event: the form', () => {
  test('shows every section with sensible defaults', async ({ page }) => {
    const submit = new SubmitEventPage(page);
    await submit.open();

    await expect(submit.sectionHeadings()).toHaveText([
      'Event basics',
      'When',
      'Where',
      'Tickets',
      'Your contact email',
    ]);
    await expect(submit.field('Time zone')).toHaveValue('America/Toronto');
    await expect(submit.formatOption('In person')).toBeChecked();
    await expect(submit.priceOption('Free')).toBeChecked();
    await expect(submit.field('Price (CAD)')).toBeDisabled();
    await expect(submit.field('Livestream link')).toBeHidden();
    await expect(submit.shell.submitEvent).toHaveCount(0);
  });

  test('lists what to fix in a summary that links to each field', async ({ page }) => {
    const submit = new SubmitEventPage(page);
    await submit.open();
    await submit.fill({
      organizer: 'GTA Azure Community',
      description: 'Move your Power BI reports onto Fabric.',
      date: '2026-11-18',
      start: '18:30',
      end: '17:30',
      venue: 'Living Arts Centre',
      address: '4141 Living Arts Dr',
      email: 'priya@gtaazure.ca',
    });

    await submit.submit();

    await expect(submit.errorSummary.locator('.alert__title')).toHaveText('Fix 3 things before you continue');
    expect(await submit.summaryMessages()).toEqual([
      'Enter a title for the event.',
      'Pick at least one topic so people can find it.',
      'End time must be after the 6:30 PM start.',
    ]);
    await expect(submit.errorSummary).toBeFocused();
    await expect(submit.fieldError('title')).toHaveText('Enter a title for the event.');
    await expect(submit.field('Event title')).toHaveAttribute('aria-invalid', 'true');

    await submit.summaryLink('Enter a title for the event.').click();
    await expect(submit.field('Event title')).toBeFocused();
  });

  test('format decides which venue and stream fields show', async ({ page }) => {
    const submit = new SubmitEventPage(page);
    await submit.open();

    await submit.formatOption('Streaming').check();
    await expect(submit.field('Venue name')).toBeHidden();
    await expect(submit.field('City')).toBeHidden();
    await expect(submit.field('Street address')).toBeHidden();
    await expect(submit.field('Livestream link')).toBeVisible();

    await submit.formatOption('Hybrid').check();
    await expect(submit.field('Venue name')).toBeVisible();
    await expect(submit.field('Street address')).toBeVisible();
    await expect(submit.field('Livestream link')).toBeVisible();

    await submit.formatOption('In person').check();
    await expect(submit.field('Livestream link')).toBeHidden();
  });

  test('a venue is needed in person, paid needs a price, and links must be https', async ({ page }) => {
    const submit = new SubmitEventPage(page);
    await submit.open();
    await submit.fill({ paid: true, ticketUrl: 'http://tickets.example.com' });
    await expect(submit.field('Price (CAD)')).toBeEnabled();

    await submit.submit();

    await expect(submit.fieldError('venueName')).toHaveText('Enter the venue name.');
    await expect(submit.fieldError('streetAddress')).toHaveText('Enter the street address.');
    await expect(submit.fieldError('priceCad')).toHaveText('Enter a price above $0.');
    await expect(submit.fieldError('ticketUrl')).toHaveText('Enter a full link that starts with https://');
  });

  test('a slow load shows three busy skeleton sections', async ({ page }) => {
    await page.route('**/api/reference-data', async (route) => {
      const response = await route.fetch();
      await new Promise((r) => setTimeout(r, 2_000));
      await route.fulfill({ response });
    });
    const submit = new SubmitEventPage(page);
    await submit.startOpening();

    await expect(submit.skeletonSections).toHaveCount(3);
    await expect(submit.skeletonSections.first()).toHaveAttribute('aria-busy', 'true');
    await expect(submit.form).toBeVisible({ timeout: 10_000 });
  });
});
