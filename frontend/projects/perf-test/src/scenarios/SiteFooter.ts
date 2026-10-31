import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SiteFooter } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-site-footer-scenario',
  imports: [SiteFooter],
  template: `@for (i of items(); track i) {
    <sx-site-footer [items]="nav" />
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SiteFooterScenario {
  readonly items = input.required<number[]>();
  protected readonly nav = [
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
  ];
}

export const scenario: Scenario = { name: 'SiteFooter', component: SiteFooterScenario };
