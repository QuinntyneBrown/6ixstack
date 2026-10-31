import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Description } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-description-scenario',
  imports: [Description],
  template: `@for (i of items(); track i) {
    <sx-description text="A full day of talks." />
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class DescriptionScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'Description', component: DescriptionScenario };
