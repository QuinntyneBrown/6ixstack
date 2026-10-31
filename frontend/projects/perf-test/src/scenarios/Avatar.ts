import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Avatar } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-avatar-scenario',
  imports: [Avatar],
  template: `@for (i of items(); track i) {
    <sx-avatar initials="PN" />
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class AvatarScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'Avatar', component: AvatarScenario };
