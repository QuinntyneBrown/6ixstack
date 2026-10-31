import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { List, ListItem } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-list-scenario',
  imports: [List, ListItem],
  template: `@for (i of items(); track i) {
    <ul sx-list>
      <li sx-list-item title="Everything" meta="14 in the next two weeks"></li>
    </ul>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ListScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'List', component: ListScenario };
