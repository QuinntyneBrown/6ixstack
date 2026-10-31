import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type InlineStatusKind = 'neutral' | 'success' | 'warning' | 'danger';

/** One status line with a coloured dot, such as "Published · 318 going" (design system: inline message, status). */
@Component({
  selector: 'sx-inline-status',
  template: '<span class="dot" aria-hidden="true"></span><ng-content />',
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--spacingHorizontalS);
      font: var(--sx-text-body-sm);
      color: var(--colorNeutralForeground2);
    }
    :host(.inline-status--success) {
      color: var(--colorStatusSuccessForeground1);
    }
    :host(.inline-status--warning) {
      color: var(--colorStatusWarningForeground1);
    }
    :host(.inline-status--danger) {
      color: var(--colorStatusDangerForeground1);
    }
    .dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background: currentColor;
    }
  `,
  host: { class: 'inline-status', '[class]': "'inline-status inline-status--' + kind()" },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InlineStatus {
  readonly kind = input<InlineStatusKind>('neutral');
}
