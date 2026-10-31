import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FeatureCard } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-feature-card-scenario',
  imports: [FeatureCard],
  template: `@for (i of items(); track i) {
    <sx-feature-card />
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FeatureCardScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'FeatureCard', component: FeatureCardScenario };
