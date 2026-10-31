import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

/**
 * An on/off switch (design system: switch): wrap a `<input type="checkbox" role="switch">` and its visible label in
 * `<label sx-switch>`. The input keeps native keyboard and form behaviour.
 */
@Component({
  selector: 'label[sx-switch]',
  template: '<ng-content />',
  styleUrl: './switch.scss',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'switch' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Switch {}
