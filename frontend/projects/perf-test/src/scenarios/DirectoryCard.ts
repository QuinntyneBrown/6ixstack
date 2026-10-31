import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DirectoryCard } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-directory-card-scenario',
  imports: [DirectoryCard],
  template: `@for (i of items(); track i) {
    <sx-directory-card initials="GA" name="GTA Azure Community" link="/" />
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class DirectoryCardScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'DirectoryCard', component: DirectoryCardScenario };
