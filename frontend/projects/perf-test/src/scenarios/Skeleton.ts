import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Skeleton } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-skeleton-scenario',
  imports: [Skeleton],
  template: `@for (i of items(); track i) {
    <sx-skeleton width="40%" />
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SkeletonScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'Skeleton', component: SkeletonScenario };
