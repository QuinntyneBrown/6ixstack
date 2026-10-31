import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { EmptyState } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-empty-state-scenario',
  imports: [EmptyState],
  template: `@for (i of items(); track i) {
    <sx-empty-state title="No events in the next two weeks" />
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class EmptyStateScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'EmptyState', component: EmptyStateScenario };
