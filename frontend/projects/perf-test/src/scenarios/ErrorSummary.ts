import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ErrorSummary } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-error-summary-scenario',
  imports: [ErrorSummary],
  template: `@for (i of items(); track i) {
    <sx-error-summary [errors]="errors" />
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ErrorSummaryScenario {
  readonly items = input.required<number[]>();
  readonly errors = [{ controlId: 'title', message: 'Enter a title for the event.' }];
}

export const scenario: Scenario = { name: 'ErrorSummary', component: ErrorSummaryScenario };
