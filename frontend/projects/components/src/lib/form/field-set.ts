import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** A group of choices (topics, format, price) with a legend, optional hint and an error (`{id}-error`). */
@Component({
  selector: 'sx-field-set',
  template: `
    <fieldset>
      <legend>{{ legend() }}</legend>
      <ng-content />
      @if (error()) {
        <span class="field__error" [id]="controlId() + '-error'">{{ error() }}</span>
      }
    </fieldset>
  `,
  styles: `
    :host {
      display: block;
    }
    fieldset {
      border: 0;
      padding: 0;
      margin: 0;
      min-width: 0;
    }
    legend {
      font: var(--sx-text-label);
      padding: 0;
      margin-bottom: var(--spacingHorizontalS);
    }
    .field__error {
      display: flex;
      gap: var(--spacingHorizontalXS);
      margin-top: var(--spacingHorizontalXS);
      font: var(--sx-text-body-sm);
      color: var(--colorStatusDangerForeground1);
    }
    .field__error::before {
      content: '⚠';
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldSet {
  readonly legend = input.required<string>();
  readonly controlId = input.required<string>();
  readonly error = input<string | null>(null);
}
