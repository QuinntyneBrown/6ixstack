import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SidebarNav } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-sidebar-nav-scenario',
  imports: [SidebarNav],
  template: `@for (i of items(); track i) {
    <sx-sidebar-nav label="Sections" [items]="[{ label: 'Profile', fragment: 'profile' }]" />
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SidebarNavScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'SidebarNav', component: SidebarNavScenario };
