import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LogoTile } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-logo-tile-scenario',
  imports: [LogoTile],
  template: `@for (i of items(); track i) {
    <sx-logo-tile initials="GA" />
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class LogoTileScenario {
  readonly items = input.required<number[]>();
}

export const scenario: Scenario = { name: 'LogoTile', component: LogoTileScenario };
