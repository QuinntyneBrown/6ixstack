import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SiteHeader } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-site-header-scenario',
  imports: [SiteHeader],
  template: `@for (i of items(); track i) {
    <sx-site-header [items]="nav" />
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SiteHeaderScenario {
  readonly items = input.required<number[]>();
  protected readonly nav = [
    { label: 'Events', path: '/', exact: true },
    { label: 'Calendar', path: '/calendar' },
  ];
}

export const scenario: Scenario = { name: 'SiteHeader', component: SiteHeaderScenario };
