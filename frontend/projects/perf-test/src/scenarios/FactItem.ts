import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FactItem } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-fact-item-scenario',
  imports: [FactItem],
  template: `@for (i of items(); track i) {
    <sx-fact-item icon="users" label="318 going">Capacity 400</sx-fact-item>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FactItemScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'FactItem', component: FactItemScenario };
