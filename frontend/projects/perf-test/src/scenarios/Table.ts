import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Table } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-table-scenario',
  imports: [Table],
  template: `@for (i of items(); track i) {
    <sx-table
      ><table class="table">
        <tbody>
          <tr>
            <td>Event</td>
            <td class="num">1</td>
          </tr>
        </tbody>
      </table></sx-table
    >
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TableScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'Table', component: TableScenario };
