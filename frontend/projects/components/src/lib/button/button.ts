import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** `ghost-danger` is a quiet destructive action beside the main ones, such as Cancel event on the edit page. */
export type ButtonAppearance =
  'secondary' | 'primary' | 'ghost' | 'ghost-danger' | 'link' | 'danger' | 'on-feature';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Button styles for a native `<button>` or `<a>` (`<button sx-button appearance="primary">`). Keeps the
 * mock's `btn btn--*` classes. `busy` sets `aria-busy` and shows a spinner in place of the label.
 */
@Component({
  selector: 'button[sx-button], a[sx-button]',
  template: '<ng-content />',
  styleUrl: './button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()',
    '[attr.aria-busy]': 'busy() ? "true" : null',
  },
})
export class Button {
  readonly appearance = input<ButtonAppearance>('secondary');
  readonly size = input<ButtonSize>('md');
  readonly iconOnly = input(false, { transform: booleanAttribute });
  readonly block = input(false, { transform: booleanAttribute });
  readonly busy = input(false, { transform: booleanAttribute });

  protected readonly classes = computed(() =>
    [
      'btn',
      this.appearance() === 'secondary' ? '' : `btn--${this.appearance()}`,
      this.size() === 'md' ? '' : `btn--${this.size()}`,
      this.iconOnly() ? 'btn--icon' : '',
      this.block() ? 'btn--block' : '',
    ]
      .filter(Boolean)
      .join(' '),
  );
}
