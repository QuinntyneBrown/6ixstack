import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DateTile } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-date-tile-scenario',
  imports: [DateTile],
  template: `@for (i of items(); track i) {
    <sx-date-tile month="Nov" day="5" />
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class DateTileScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'DateTile', component: DateTileScenario };
