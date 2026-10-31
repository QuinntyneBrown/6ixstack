import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ActiveToast, Toast } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-toast-scenario',
  imports: [Toast],
  template: `@for (i of items(); track i) {
    <sx-toast [toast]="toast" />
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ToastScenario {
  readonly items = input.required<number[]>();
  protected readonly toast: ActiveToast = {
    id: 1,
    kind: 'success',
    title: 'Added to Google Calendar',
    text: 'Azure Data & AI Day GTA, Thu Nov 5.',
    remainingMs: 8000,
    paused: true,
  };
}

export const scenario: Scenario = { name: 'Toast', component: ToastScenario };
