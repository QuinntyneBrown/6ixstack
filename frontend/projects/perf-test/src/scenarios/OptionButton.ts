import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { OptionButton } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-option-button-scenario',
  imports: [OptionButton],
  template: `@for (i of items(); track i) {
    <button sx-option-button type="button" icon="calendar" hint="Downloads an .ics file">
      Apple Calendar
    </button>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class OptionButtonScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'OptionButton', component: OptionButtonScenario };
