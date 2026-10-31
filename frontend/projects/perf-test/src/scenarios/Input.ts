import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Input } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-input-scenario',
  imports: [Input],
  template: `@for (i of items(); track i) {
    <input sx-input aria-label="Title" value="Event" />
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class InputScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'Input', component: InputScenario };
