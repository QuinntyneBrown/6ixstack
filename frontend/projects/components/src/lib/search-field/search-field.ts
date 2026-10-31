import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Icon } from '../icon/icon';

let nextId = 0;

/**
 * A search box in a `role="search"` form: a visually hidden label, the search icon and a `type="search"` input.
 * Emits `searched` on Enter and `valueChange` as the person types.
 */
@Component({
  selector: 'sx-search-field',
  imports: [Icon],
  template: `
    <form class="search" role="search" (submit)="$event.preventDefault(); searched.emit(input.value)">
      <label class="visually-hidden" [for]="id">{{ label() }}</label>
      <sx-icon name="search" />
      <input
        #input
        class="input"
        type="search"
        [id]="id"
        [placeholder]="placeholder()"
        [value]="value()"
        (input)="valueChange.emit(input.value)"
      />
    </form>
  `,
  styleUrl: './search-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchField {
  protected readonly id = `sx-search-${nextId++}`;

  readonly label = input.required<string>();
  readonly placeholder = input('');
  readonly value = input('');

  readonly searched = output<string>();
  readonly valueChange = output<string>();
}
