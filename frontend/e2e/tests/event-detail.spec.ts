import { expect, test } from '../fixtures';
import { EventDetailPage } from '../pages/event-detail.page';
import { EventsPage } from '../pages/events.page';

// L2-017 event detail content; design: docs/detailed-designs/discovery/view-event-detail.
test.describe('Event detail', () => {
  test('opens from the list', async ({ page }) => {
    const events = new EventsPage(page);
    await events.open();

    await events.row('Azure Data & AI Day GTA').title.click();

    const detail = new EventDetailPage(page);
    await expect(detail.title).toHaveText('Azure Data & AI Day GTA');
    expect(detail.url()).toBe('/events/azure-data-ai-day-gta');
  });

  test('shows the hero and the facts panel', async ({ page }) => {
    const detail = new EventDetailPage(page);
    await detail.open('azure-data-ai-day-gta');

    await expect(detail.backLink).toHaveAttribute('href', '/');
    await expect(detail.dateTile).toHaveText(/Nov\s*5/);
    await expect(detail.community).toHaveText('GTA Azure Community');
    await expect(detail.community).toHaveAttribute('href', '/communities/gta-azure-community');
    await expect(detail.topics).toHaveText(['AI', 'Azure']);
    expect(await detail.factTexts()).toEqual([
      'Thursday, November 5, 2026 · 9:00 AM – 5:00 PM ET',
      'Living Arts Centre · 4141 Living Arts Dr, Mississauga · Directions',
      'Livestream available · Keynote and main-stage sessions; labs are in person only',
      '$49 · includes lunch · Student tickets $15 with a valid ID',
      '318 going · Capacity 400',
    ]);
    await expect(detail.fact('Living Arts Centre').getByRole('link', { name: 'Directions' })).toHaveAttribute(
      'href',
      /^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=/,
    );
  });

  test('shows About, the agenda in order, speakers and the venue', async ({ page }) => {
    const detail = new EventDetailPage(page);
    await detail.open('azure-data-ai-day-gta');

    await expect(detail.about).toContainText('A full day of Fabric, Azure OpenAI and data platform sessions');
    expect(await detail.agendaTexts()).toEqual([
      '9:00 AM Registration and coffee',
      '9:30 AM Keynote: Fabric one year later — Priya Natarajan',
      '11:00 AM Grounding Azure OpenAI on your lakehouse — Aisha Rahman',
      '12:30 PM Lunch',
      '1:30 PM Lab: build a real-time dashboard with Eventstream',
      '4:15 PM Panel: data teams in Canadian banks — Marcus Bell, Kenji Watanabe',
    ]);
    await expect(detail.speakers).toHaveCount(4);
    await expect(detail.speakers.first()).toHaveAttribute('href', '/speakers/priya-natarajan');
    await expect(detail.speakers.first()).toContainText('Priya Natarajan');
    await expect(detail.venueSection).toContainText('Step-free access from the Square One transit terminal');
  });

  test('leaves out the agenda and speakers when there are none', async ({ page }) => {
    const detail = new EventDetailPage(page);
    await detail.open('bedrock-in-the-real-world');

    await expect(detail.about).toBeVisible();
    await expect(detail.sectionHeading('Agenda')).toHaveCount(0);
    await expect(detail.sectionHeading('Speakers')).toHaveCount(0);
  });
});
