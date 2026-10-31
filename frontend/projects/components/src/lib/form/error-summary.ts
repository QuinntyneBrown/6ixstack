import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, input } from '@angular/core';
import { Icon } from '../icon/icon';

export interface FieldErrorItem {
  /** The id of the control to focus. */
  controlId: string;
  message: string;
}

/**
 * "Fix N things before you continue": a danger alert listing each problem as a link to its field. Call `focus()`
 * after a failed submit so screen readers announce it (forms pattern, L2-041).
 */
@Component({
  selector: 'sx-error-summary',
  imports: [Icon],
  template: `
    <div class="alert form-summary" role="alert" tabindex="-1">
      <sx-icon name="alert" />
      <div class="alert__body">
        <p class="alert__title">{{ title() }}</p>
        <ul>
          @for (error of errors(); track error.controlId) {
            <li>
              <a [href]="'#' + error.controlId" (click)="go($event, error.controlId)">{{ error.message }}</a>
            </li>
          }
        </ul>
      </div>
    </div>
  `,
  styleUrl: './error-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorSummary {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);

  readonly errors = input.required<FieldErrorItem[]>();
  /** Replaces the default "Fix N things before you continue", e.g. "Check your email address" on a one-field form. */
  readonly heading = input<string | null>(null);
  protected readonly title = computed(() => {
    const heading = this.heading();
    if (heading) return heading;
    const n = this.errors().length;
    return `Fix ${n} ${n === 1 ? 'thing' : 'things'} before you continue`;
  });

  focus(): void {
    this.host.nativeElement.querySelector<HTMLElement>('.form-summary')?.focus();
  }

  protected go(event: Event, controlId: string): void {
    const field = this.document.getElementById(controlId);
    if (field) {
      event.preventDefault();
      field.focus();
      field.scrollIntoView({ block: 'center' });
    }
  }
}
