import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-icon-scenario',
  imports: [Icon],
  template: `@for (i of items(); track i) {
    <sx-icon name="calendar" />
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class IconScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'Icon', component: IconScenario };
