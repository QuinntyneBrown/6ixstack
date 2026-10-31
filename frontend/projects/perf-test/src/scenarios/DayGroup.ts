import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DayGroup } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-day-group-scenario',
  imports: [DayGroup],
  template: `@for (i of items(); track i) {
    <sx-day-group date="2026-11-05" weekday="Thursday" dateLabel="November 5" [events]="events" />
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class DayGroupScenario {
  readonly items = input.required<number[]>();
  protected readonly events = [
    {
      slug: 'x',
      title: 'Bedrock in the real world',
      organizer: 'AWS User Group Toronto',
      format: 'inPerson',
      topics: ['aws'],
      startTimeEt: '6:00 PM',
      sourceTime: null,
      locationLabel: '120 Bremner Blvd, Toronto',
      priceLabel: 'Free',
      goingCount: 128,
      isSoldOut: false,
      isCancelled: false,
    },
  ];
}

export const scenario: Scenario = { name: 'DayGroup', component: DayGroupScenario };
