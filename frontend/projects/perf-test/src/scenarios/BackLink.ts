import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { BackLink } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-back-link-scenario',
  imports: [BackLink],
  template: `@for (i of items(); track i) {
    <a sx-back-link href="#">Your events</a>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class BackLinkScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'BackLink', component: BackLinkScenario };
