import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrentUser } from 'api';
import { Avatar, Badge, Button, Icon, Tooltip } from 'components';

/** The signed-in header's notifications button and account avatar (L2-050), projected into `SiteHeader`. */
@Component({
  selector: 'sx-account-controls',
  imports: [Avatar, Badge, Button, Icon, RouterLink, Tooltip],
  template: `
    <a
      sx-button
      appearance="ghost"
      iconOnly
      class="has-tooltip"
      routerLink="/notifications"
      [attr.aria-label]="notificationsLabel()"
    >
      <sx-icon name="bell" />
      @if (user().unreadNotificationCount > 0) {
        <sx-badge kind="count" aria-hidden="true">{{ user().unreadNotificationCount }}</sx-badge>
      }
      <sx-tooltip>Notifications</sx-tooltip>
    </a>
    <a class="account" [routerLink]="home()" [attr.aria-label]="accountLabel()">
      <sx-avatar size="sm" [initials]="user().initials" />
    </a>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--spacingHorizontalS);
    }
    sx-badge {
      position: absolute;
      top: calc(-1 * var(--spacingVerticalXXS));
      right: calc(-1 * var(--spacingHorizontalXXS));
    }
    .account {
      display: inline-flex;
      border-radius: var(--borderRadiusCircular);
      text-decoration: none;
    }
    .account:focus-visible {
      outline: var(--sx-focus-ring-width) solid var(--colorStrokeFocus2);
      outline-offset: 2px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountControls {
  readonly user = input.required<CurrentUser>();

  protected readonly home = computed(() =>
    this.user().role === 'moderator' ? '/admin/review' : '/organize',
  );
  protected readonly notificationsLabel = computed(() => {
    const n = this.user().unreadNotificationCount;
    return n > 0 ? `Notifications, ${n} unread` : 'Notifications';
  });
  protected readonly accountLabel = computed(
    () =>
      `${this.user().role === 'moderator' ? 'Review queue' : 'Your dashboard'}, signed in as ${this.user().name}`,
  );
}
