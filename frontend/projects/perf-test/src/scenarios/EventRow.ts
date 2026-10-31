import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { EventRow } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-event-row-scenario',
  imports: [EventRow],
  template: `@for (i of items(); track i) {
    <sx-event-row [event]="event" date="2026-11-05" />
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class EventRowScenario {
  readonly items = input.required<number[]>();
  protected readonly event = {
    slug: 'x',
    title: 'Azure Data & AI Day GTA',
    organizer: 'GTA Azure Community',
    format: 'hybrid',
    topics: ['ai', 'azure'],
    startTimeEt: '9:00 AM',
    sourceTime: null,
    locationLabel: 'Living Arts Centre, Mississauga',
    priceLabel: '$49',
    goingCount: 318,
    isSoldOut: false,
    isCancelled: false,
  };
}

export const scenario: Scenario = { name: 'EventRow', component: EventRowScenario };
