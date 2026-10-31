import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Stat, StatsRow } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-stat-scenario',
  imports: [Stat, StatsRow],
  template: `@for (i of items(); track i) {
    <sx-stats-row><sx-stat label="Going" value="318" /></sx-stats-row>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class StatScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'Stat', component: StatScenario };
