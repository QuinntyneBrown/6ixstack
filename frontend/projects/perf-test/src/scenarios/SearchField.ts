import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SearchField } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-search-field-scenario',
  imports: [SearchField],
  template: `@for (i of items(); track i) {
    <sx-search-field label="Search events" />
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SearchFieldScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'SearchField', component: SearchFieldScenario };
