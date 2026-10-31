import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DockedActionBar } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-docked-action-bar-scenario',
  imports: [DockedActionBar],
  template: `@for (i of items(); track i) {
    <sx-docked-action-bar title="Thu, Nov 5 · 9:00 AM" summary="$49 · 318 going" />
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class DockedActionBarScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'DockedActionBar', component: DockedActionBarScenario };
