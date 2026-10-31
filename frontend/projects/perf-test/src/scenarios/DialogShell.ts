import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DialogShell } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-dialog-shell-scenario',
  imports: [DialogShell],
  template: `@for (i of items(); track i) {
    <sx-dialog-shell title="Menu"><p>Body</p></sx-dialog-shell>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class DialogShellScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'DialogShell', component: DialogShellScenario };
