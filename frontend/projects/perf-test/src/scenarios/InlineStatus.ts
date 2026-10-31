import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { InlineStatus } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-inline-status-scenario',
  imports: [InlineStatus],
  template: `@for (i of items(); track i) {
    <sx-inline-status kind="success">Published</sx-inline-status>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class InlineStatusScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'InlineStatus', component: InlineStatusScenario };
