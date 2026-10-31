import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon } from '../icon/icon';
import { IconName } from '../icon/icons';

/** One fact in an event's facts panel: an icon, a label and a value (projected, so it can hold a link). */
@Component({
  selector: 'sx-fact-item',
  imports: [Icon],
  template: `
    <div class="fact">
      <sx-icon [name]="icon()" />
      <div>
        <div class="fact__label">{{ label() }}</div>
        <div class="fact__value"><ng-content /></div>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
    .fact {
      display: grid;
      grid-template-columns: 1.25rem minmax(0, 1fr);
      gap: var(--spacingHorizontalM);
      align-items: start;
    }
    .fact > sx-icon {
      color: var(--colorNeutralForeground2);
      margin-top: 0.15rem;
    }
    .fact__label {
      font: var(--sx-text-label);
    }
    .fact__value {
      color: var(--colorNeutralForeground2);
      font: var(--sx-text-body-sm);
    }
    .fact__value:empty {
      display: none;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FactItem {
  readonly icon = input.required<IconName>();
  readonly label = input.required<string>();
}
