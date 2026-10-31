import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Button, ButtonGroup } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-button-group-scenario',
  imports: [Button, ButtonGroup],
  template: `@for (i of items(); track i) {
    <sx-button-group label="View"
      ><button sx-button type="button">List</button
      ><button sx-button type="button" aria-pressed="true">Month</button></sx-button-group
    >
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ButtonGroupScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'ButtonGroup', component: ButtonGroupScenario };
