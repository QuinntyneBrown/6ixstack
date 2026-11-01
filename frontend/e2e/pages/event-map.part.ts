import { Locator, Page } from '@playwright/test';

/** The "Where it's happening" map beside the events list (discovery/event-map). */
export class EventMapPart {
  readonly root: Locator;
  readonly column: Locator;
  readonly svg: Locator;
  readonly title: Locator;
  readonly subtitle: Locator;
  readonly dots: Locator;
  readonly rings: Locator;
  readonly arcs: Locator;
  readonly tip: Locator;
  readonly play: Locator;
  readonly showAllDates: Locator;
  readonly days: Locator;
  readonly notice: Locator;
  readonly pressedDay: Locator;
  readonly disabledDays: Locator;

  constructor(private readonly page: Page) {
    this.column = page.locator('.map-col');
    this.root = page.locator('.event-map');
    this.svg = this.root.locator('svg.event-map__svg');
    this.title = this.root.locator('.event-map__title');
    this.subtitle = this.root.locator('.event-map__sub');
    this.dots = this.root.locator('.event-map__event');
    this.rings = this.root.locator('.event-map__ring');
    this.arcs = this.root.locator('.event-map__stream');
    this.tip = this.root.locator('.event-map__tip');
    this.play = this.root.getByRole('button', { name: /^(Play the next two weeks|Pause)$/ });
    this.showAllDates = this.root.getByRole('button', { name: 'Show all dates' });
    this.days = this.root.getByRole('group', { name: 'Choose a day' }).getByRole('button');
    this.notice = this.root.locator('.event-map__notice');
    this.pressedDay = this.root.locator('.map-day[aria-pressed="true"]');
    this.disabledDays = this.root.locator('.map-day:disabled');
  }

  /** The dot or arc of an event, by its slug. */
  marker(slug: string): Locator {
    return this.root.locator(`[data-slug="${slug}"]`);
  }

  /** A timeline day by its label, such as "Thursday, November 5". */
  day(label: string): Locator {
    return this.root.locator(`.map-day[aria-label^="${label}:"]`);
  }

  /** The city labels that run past the edge of the map canvas. */
  async clippedCityLabels(): Promise<string[]> {
    return this.root.locator('.event-map__city').evaluateAll((labels) =>
      labels
        .filter((label) => {
          const box = label.getBoundingClientRect();
          const canvas = label.closest('.event-map__canvas')!.getBoundingClientRect();
          return box.left < canvas.left - 0.5 || box.right > canvas.right + 0.5;
        })
        .map((label) => label.textContent!.trim()),
    );
  }

  async clickMarker(slug: string): Promise<void> {
    await this.marker(slug).locator('circle, path').last().dispatchEvent('click');
  }
}
