import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../icon/icon';
import { IconName } from '../icon/icons';

export type NotificationTone = 'neutral' | 'success' | 'warning' | 'danger';

const ICONS: Record<NotificationTone, IconName> = {
  neutral: 'bell',
  success: 'check-circle',
  warning: 'flag',
  danger: 'alert',
};

/**
 * One notification (design system: notification item, L2-065): tone icon, the title linking to its target (a
 * stretched link), text and time. Unread items carry a dot, a bold title and the hidden text " (unread)".
 */
@Component({
  selector: 'sx-notification-item',
  imports: [Icon, RouterLink],
  template: `
    <div class="notif" [class.notif--unread]="unread()">
      <span [class]="'notif__icon notif__icon--' + tone()" aria-hidden="true"
        ><sx-icon [name]="icon()" size="sm"
      /></span>
      <div>
        <p class="notif__title">
          <a [routerLink]="link()" (click)="opened.emit()">{{ title() }}</a>
          @if (unread()) {
            <span class="visually-hidden"> (unread)</span>
          }
        </p>
        @if (text()) {
          <p class="notif__text">{{ text() }}</p>
        }
      </div>
      <span class="notif__time">{{ time() }}</span>
    </div>
  `,
  styleUrl: './notification-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationItem {
  readonly title = input.required<string>();
  readonly link = input.required<string>();
  readonly text = input<string | null>(null);
  readonly time = input('');
  readonly tone = input<NotificationTone>('neutral');
  readonly unread = input(false);
  /** The title link was activated; the page marks the notification read. */
  readonly opened = output<void>();

  protected readonly icon = computed(() => ICONS[this.tone()] ?? 'bell');
}
