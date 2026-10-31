import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppNotification, NOTIFICATIONS_API, NotificationList } from 'api';
import { Button, EmptyState, Icon, NotificationItem, Skeleton } from 'components';
import { SessionStore } from '../../shell/session/session-store';
import { SKELETON_DELAY_MS } from '../../shared/load-state';

type PageState = { status: 'loading' } | { status: 'loaded'; data: NotificationList } | { status: 'failed' };

/** Notifications (`/notifications`): newest first, unread marked, Mark all as read (notifications/in-app-notifications). */
@Component({
  selector: 'sx-notifications-page',
  imports: [Button, EmptyState, Icon, NotificationItem, RouterLink, Skeleton],
  templateUrl: './notifications-page.html',
  styleUrl: './notifications-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsPage {
  private readonly api = inject(NOTIFICATIONS_API);
  protected readonly session = inject(SessionStore);

  private readonly attempt = signal(0);
  protected readonly state = signal<PageState>({ status: 'loading' });
  protected readonly slow = signal(false);
  protected readonly marking = signal(false);
  protected readonly skeletons = [0, 1, 2, 3];

  protected readonly data = computed(() => {
    const s = this.state();
    return s.status === 'loaded' ? s.data : null;
  });

  protected readonly lead = computed(() => {
    const s = this.state();
    if (s.status === 'failed') return 'Unavailable';
    if (s.status === 'loading') return this.slow() ? 'Loading…' : '';
    if (!s.data.items.length) return 'Nothing new';
    return s.data.unreadCount ? `${s.data.unreadCount} unread` : 'All caught up';
  });

  constructor() {
    effect((onCleanup) => {
      this.attempt();
      untracked(() => {
        this.state.set({ status: 'loading' });
        this.slow.set(false);
      });
      const timer = setTimeout(() => this.slow.set(true), SKELETON_DELAY_MS);
      const sub = this.api.list().subscribe({
        next: (data) => {
          clearTimeout(timer);
          this.state.set({ status: 'loaded', data });
          this.session.setUnreadCount(data.unreadCount);
        },
        error: () => {
          clearTimeout(timer);
          this.state.set({ status: 'failed' });
        },
      });
      onCleanup(() => {
        clearTimeout(timer);
        sub.unsubscribe();
      });
    });
  }

  protected retry(): void {
    this.attempt.update((n) => n + 1);
  }

  /** Opening a notification marks it read (L2-065 criterion 3). */
  protected opened(item: AppNotification): void {
    if (item.isRead) return;
    this.update((d) => ({
      unreadCount: Math.max(0, d.unreadCount - 1),
      items: d.items.map((i) => (i.id === item.id ? { ...i, isRead: true } : i)),
    }));
    this.api.markRead(item.id).subscribe({ error: () => undefined });
  }

  protected markAllRead(): void {
    if (this.marking()) return;
    this.marking.set(true);
    this.api.markAllRead().subscribe({
      next: () => {
        this.marking.set(false);
        this.update((d) => ({ unreadCount: 0, items: d.items.map((i) => ({ ...i, isRead: true })) }));
      },
      error: () => this.marking.set(false),
    });
  }

  private update(change: (d: NotificationList) => NotificationList): void {
    const d = this.data();
    if (!d) return;
    const next = change(d);
    this.state.set({ status: 'loaded', data: next });
    this.session.setUnreadCount(next.unreadCount);
  }
}
