import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SkipLink } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-skip-link-scenario',
  imports: [SkipLink],
  template: `@for (i of items(); track i) {
    <sx-skip-link />
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SkipLinkScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'SkipLink', component: SkipLinkScenario };
