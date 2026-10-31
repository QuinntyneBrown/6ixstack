import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SuccessPanel } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-success-panel-scenario',
  imports: [SuccessPanel],
  template: `@for (i of items(); track i) {
    <sx-success-panel title="Done"><p>Saved.</p></sx-success-panel>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SuccessPanelScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'SuccessPanel', component: SuccessPanelScenario };
