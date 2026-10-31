import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SegmentedControl } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-segmented-control-scenario',
  imports: [SegmentedControl],
  template: `@for (i of items(); track i) {
    <sx-segmented-control label="Where" [options]="options" value="all" />
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SegmentedControlScenario {
  readonly items = input.required<number[]>();
  protected readonly options = [
    { value: 'all', label: 'All', count: 14 },
    { value: 'gta', label: 'In the GTA', count: 9 },
  ];
}

export const scenario: Scenario = { name: 'SegmentedControl', component: SegmentedControlScenario };
