import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MonthGrid } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-month-grid-scenario',
  imports: [MonthGrid],
  template: `@for (i of items(); track i) {
    <sx-month-grid month="2026-11" label="November 2026" today="2026-11-02" />
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class MonthGridScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'MonthGrid', component: MonthGridScenario };
