import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PersonLink } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-person-link-scenario',
  imports: [PersonLink],
  template: `@for (i of items(); track i) {
    <sx-person-link name="Priya Natarajan" role="Azure MVP" initials="PN" link="/speakers/priya-natarajan" />
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class PersonLinkScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'PersonLink', component: PersonLinkScenario };
