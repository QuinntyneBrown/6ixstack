import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CalendarDayList } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-calendar-day-list-scenario',
  imports: [CalendarDayList],
  template: `@for (i of items(); track i) {
    <sx-calendar-day-list heading="Thursday, November 5" [events]="events" />
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class CalendarDayListScenario {
  readonly items = input.required<number[]>();
  readonly events = [
    { title: 'Bedrock in the real world', link: '/', time: '6:00 PM', topic: 'aws' as const },
  ];
}

export const scenario: Scenario = { name: 'CalendarDayList', component: CalendarDayListScenario };
