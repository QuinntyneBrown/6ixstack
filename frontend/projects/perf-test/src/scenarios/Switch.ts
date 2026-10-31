import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Switch } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-switch-scenario',
  imports: [Switch],
  template: `@for (i of items(); track i) {
    <label sx-switch><input type="checkbox" role="switch" />On</label>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SwitchScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'Switch', component: SwitchScenario };
