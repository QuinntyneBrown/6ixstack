import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

/** `aria-describedby` for a control: its hint and its error, by the ids `FormField` gives them. */
export function describedBy(controlId: string, hint: boolean, error: boolean): string | null {
  const ids = [hint ? `${controlId}-help` : null, error ? `${controlId}-error` : null].filter(Boolean);
  return ids.length ? ids.join(' ') : null;
}

/**
 * A labelled form field: label, the projected control, a hint (`{id}-help`) and an error (`{id}-error`). Set the
 * control's `id`, `aria-invalid` and `aria-describedby` (see `describedBy`).
 */
@Component({
  selector: 'sx-form-field',
  template: `
    <div class="field">
      <label class="field__label" [for]="controlId()"
        >{{ label() }}
        @if (optional()) {
          <span class="optional">(optional)</span>
        }
      </label>
      <ng-content />
      @if (hint()) {
        <span class="field__help" [id]="controlId() + '-help'">{{ hint() }}</span>
      }
      @if (error()) {
        <span class="field__error" [id]="controlId() + '-error'">{{ error() }}</span>
      }
    </div>
  `,
  styleUrl: './form-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormField {
  readonly label = input.required<string>();
  readonly controlId = input.required<string>();
  readonly hint = input<string | null>(null);
  readonly error = input<string | null>(null);
  readonly optional = input(false, { transform: booleanAttribute });
}
