import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon } from '../icon/icon';
import { IconName } from '../icon/icons';

/**
 * A large choice in an option list (`<a sx-option-button>` or `<button sx-option-button>`): a leading icon, the
 * label, a hint underneath and a trailing arrow. `busy` swaps the arrow for a spinner and sets `aria-busy`.
 */
@Component({
  selector: 'a[sx-option-button], button[sx-option-button]',
  imports: [Icon],
  template: `
    <sx-icon [name]="icon()" />
    <span class="option-btn__label"
      ><ng-content /><small>{{ hint() }}</small></span
    >
    @if (!busy()) {
      <span class="option-btn__end"><sx-icon [name]="endIcon()" /></span>
    }
  `,
  styleUrl: './option-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'option-btn',
    '[attr.aria-busy]': 'busy() ? "true" : null',
  },
})
export class OptionButton {
  readonly icon = input.required<IconName>();
  readonly hint = input('');
  readonly endIcon = input<IconName>('chevron-right');
  readonly busy = input(false, { transform: booleanAttribute });
}
