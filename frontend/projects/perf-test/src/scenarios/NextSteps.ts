import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NextSteps } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-next-steps-scenario',
  imports: [NextSteps],
  template: `@for (i of items(); track i) {
    <sx-next-steps [steps]="steps" />
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class NextStepsScenario {
  readonly items = input.required<number[]>();
  readonly steps = ['Check', 'Publish', 'Share'];
}

export const scenario: Scenario = { name: 'NextSteps', component: NextStepsScenario };
