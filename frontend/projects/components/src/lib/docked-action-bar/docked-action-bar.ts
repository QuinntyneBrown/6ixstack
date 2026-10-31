import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * A bar docked to the bottom of the screen on phones (below 768 px) with a short summary and the primary
 * action (`[slot=action]`), so the main action stays in reach while reading (L2-023). Hidden from 768 px.
 */
@Component({
  selector: 'sx-docked-action-bar',
  template: `
    <div class="sticky-cta">
      <div class="sticky-cta__text">
        <div class="sticky-cta__title">{{ title() }}</div>
        <div class="sticky-cta__summary">{{ summary() }}</div>
      </div>
      <ng-content select="[slot=action]" />
    </div>
  `,
  styleUrl: './docked-action-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DockedActionBar {
  readonly title = input.required<string>();
  readonly summary = input('');
}
