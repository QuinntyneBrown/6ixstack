import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Alert } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-alert-scenario',
  imports: [Alert],
  template: `@for (i of items(); track i) {
    <sx-alert kind="info" title="Times are in Toronto time (ET)">Streams also show the source time.</sx-alert>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class AlertScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'Alert', component: AlertScenario };
