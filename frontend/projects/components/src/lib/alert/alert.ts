import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Icon } from '../icon/icon';
import { IconName } from '../icon/icons';

export type AlertKind = 'info' | 'success' | 'warning' | 'danger';

export interface AlertAction {
  label: string;
  run: () => void;
}

const ICONS: Record<AlertKind, IconName> = {
  info: 'info',
  success: 'check-circle',
  warning: 'warning',
  danger: 'alert',
};

/**
 * An inline message about a condition: page-level alerts, event status alerts and, with `banner`, the full-width
 * site banners under the header. Text goes in the content; actions are rendered as buttons.
 */
@Component({
  selector: 'sx-alert',
  imports: [Icon],
  template: `
    <div [class]="classes()" [attr.role]="role()">
      <sx-icon [name]="icon()" />
      <div class="alert__body">
        <p class="alert__title">{{ title() }}</p>
        <div class="alert__text"><ng-content /></div>
        @if (actions().length) {
          <div class="alert__actions">
            @for (action of actions(); track action.label) {
              <button type="button" (click)="action.run()">{{ action.label }}</button>
            }
          </div>
        }
      </div>
      @if (dismissible()) {
        <button class="close" type="button" aria-label="Dismiss" (click)="dismissed.emit()">
          <sx-icon name="x" size="sm" />
        </button>
      }
    </div>
  `,
  styleUrl: './alert.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Alert {
  readonly kind = input<AlertKind>('info');
  readonly title = input.required<string>();
  readonly role = input<'status' | 'alert' | null>(null);
  readonly actions = input<AlertAction[]>([]);
  readonly dismissible = input(false, { transform: booleanAttribute });
  readonly banner = input(false, { transform: booleanAttribute });

  readonly dismissed = output<void>();

  protected readonly icon = computed(() => ICONS[this.kind()]);
  protected readonly classes = computed(
    () => `alert alert--${this.kind()}${this.banner() ? ' site-banner' : ''}`,
  );
}
