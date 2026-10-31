import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon } from '../icon/icon';
import { IconName } from '../icon/icons';

/**
 * Confirms a finished task in place of the form that did it: a success icon, a title, body content and actions
 * (`[slot=actions]`). The design system's empty state, success variant (`success-panel`). Announced as a status.
 */
@Component({
  selector: 'sx-success-panel',
  imports: [Icon],
  template: `
    <div class="success-panel" role="status">
      <span class="success-panel__icon"><sx-icon [name]="icon()" size="lg" /></span>
      <h2>{{ title() }}</h2>
      <ng-content />
      <div class="cluster"><ng-content select="[slot=actions]" /></div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .success-panel {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--spacingHorizontalL);
    }
    h2 {
      font: var(--sx-text-h3);
    }
    .success-panel__icon {
      display: grid;
      place-items: center;
      width: 3rem;
      height: 3rem;
      border-radius: 50%;
      background: var(--colorStatusSuccessBackground1);
      color: var(--colorStatusSuccessForeground3);
    }
    .cluster {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacingHorizontalM);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuccessPanel {
  readonly title = input.required<string>();
  readonly icon = input<IconName>('check-circle');
}
