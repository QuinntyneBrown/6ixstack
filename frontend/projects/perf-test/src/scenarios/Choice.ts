import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Check, Choice } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-choice-scenario',
  imports: [Check, Choice],
  template: `@for (i of items(); track i) {
    <label sx-choice><input sx-check type="checkbox" />AI</label>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ChoiceScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'Choice', component: ChoiceScenario };
