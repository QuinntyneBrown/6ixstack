import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: string;
  /** Optional count shown after the label; a string allows "–" when counts are unavailable. */
  count?: number | string | null;
}

/**
 * A single-select switch of a few options, each a toggle button with `aria-pressed` (the events page's
 * All / In the GTA / Streaming switch, L2-002). `label` names the group for assistive technology.
 */
@Component({
  selector: 'sx-segmented-control',
  template: `
    <div class="segmented" role="group" [attr.aria-label]="label()">
      @for (option of options(); track option.value) {
        <button
          class="segmented__item"
          type="button"
          [attr.aria-pressed]="option.value === value()"
          (click)="valueChange.emit(option.value)"
        >
          {{ option.label }}
          @if (option.count !== undefined && option.count !== null) {
            <span class="segmented__count">{{ option.count }}</span>
          }
        </button>
      }
    </div>
  `,
  styleUrl: './segmented-control.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentedControl {
  readonly label = input.required<string>();
  readonly options = input.required<SegmentedOption[]>();
  readonly value = input.required<string>();
  readonly valueChange = output<string>();
}
