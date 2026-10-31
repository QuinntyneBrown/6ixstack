import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { StatusPage } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-status-page-scenario',
  imports: [StatusPage],
  template: `@for (i of items(); track i) {
    <sx-status-page code="404" heading="We can't find that page" />
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class StatusPageScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'StatusPage', component: StatusPageScenario };
