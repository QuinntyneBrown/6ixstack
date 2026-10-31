import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Button, Tooltip } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-tooltip-scenario',
  imports: [Button, Tooltip],
  template: `@for (i of items(); track i) {
    <button sx-button type="button" class="has-tooltip">i<sx-tooltip>Info</sx-tooltip></button>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TooltipScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'Tooltip', component: TooltipScenario };
