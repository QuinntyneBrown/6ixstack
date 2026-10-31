import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Text input, textarea and select styling on the native element (`<input sx-input>`, `<textarea sx-input>`,
 * `<select sx-input>`), so reactive forms bind to it directly. `aria-invalid="true"` shows the invalid state.
 */
@Component({
  selector: 'input[sx-input], textarea[sx-input], select[sx-input]',
  template: '<ng-content />',
  styleUrl: './input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Input {}
