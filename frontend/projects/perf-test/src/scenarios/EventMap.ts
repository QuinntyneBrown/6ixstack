import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { EventMap } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-event-map-scenario',
  imports: [EventMap],
  template: `@for (i of items(); track i) {
    <sx-event-map [still]="true" />
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class EventMapScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'EventMap', component: EventMapScenario };
