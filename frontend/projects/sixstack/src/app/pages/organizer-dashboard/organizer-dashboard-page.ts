import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ORGANIZER_EVENTS_API, OrganizerDashboard, OrganizerEventRow, SubmissionBanner } from 'api';
import {
  Alert,
  AlertAction,
  AlertKind,
  Badge,
  BadgeKind,
  Button,
  EmptyState,
  Icon,
  Skeleton,
  Stat,
  StatsRow,
  Table,
  ToastService,
} from 'components';
import { catchError, map, of, switchMap, timer } from 'rxjs';
import { ShareLauncher } from '../../shared/share/share-launcher';
import { failed, loaded, loading, LoadState, SKELETON_DELAY_MS } from '../../shared/load-state';
import { SubmissionBannerDismissals } from './submission-banner-dismissals';

const CONTACT = 'mailto:hello@6ixstack.dev';

const BANNER_KINDS: Record<SubmissionBanner['kind'], AlertKind> = {
  inReview: 'info',
  live: 'success',
  needsChanges: 'warning',
  notApproved: 'danger',
  unverified: 'warning',
};

const STATUS_BADGES: Record<OrganizerEventRow['status'], BadgeKind> = {
  published: 'success',
  inReview: 'info',
  draft: 'neutral',
  needsChanges: 'warning',
  past: 'neutral',
  cancelled: 'danger',
  notApproved: 'danger',
};

/** "Your events" (`/organize`): stats, the events table and the submission banner (organizer/organizer-dashboard). */
@Component({
  selector: 'sx-organizer-dashboard-page',
  imports: [Alert, Badge, Button, EmptyState, Icon, RouterLink, Skeleton, Stat, StatsRow, Table],
  templateUrl: './organizer-dashboard-page.html',
  styleUrl: './organizer-dashboard-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizerDashboardPage {
  private readonly api = inject(ORGANIZER_EVENTS_API);
  private readonly dismissals = inject(SubmissionBannerDismissals);
  private readonly shareLauncher = inject(ShareLauncher);
  private readonly toasts = inject(ToastService);

  private readonly attempt = signal(0);
  protected readonly state = toSignal(
    toObservable(this.attempt).pipe(
      switchMap(() =>
        this.api.dashboard().pipe(
          map((data): LoadState<OrganizerDashboard> => loaded(data)),
          catchError((error: unknown) => of(failed<OrganizerDashboard>(error))),
        ),
      ),
    ),
    { initialValue: loading<OrganizerDashboard>() },
  );
  /** Skeletons appear only after 300 ms (DelayedSkeleton, L2-052). */
  protected readonly slow = toSignal(timer(SKELETON_DELAY_MS).pipe(map(() => true)), { initialValue: false });
  protected readonly skeletons = [0, 1, 2, 3];
  protected readonly descending = signal(false);
  private readonly dismissedNow = signal<string | null>(null);

  protected readonly data = computed(() => {
    const s = this.state();
    return s.status === 'loaded' ? s.data : null;
  });

  protected readonly lead = computed(() => {
    const d = this.data();
    if (!d) return '';
    return d.communityName ? `${d.communityName} · signed in as ${d.email}` : `Signed in as ${d.email}`;
  });

  protected readonly rows = computed(() => {
    const rows = [...(this.data()?.rows ?? [])].sort((a, b) => a.startsAtUtc.localeCompare(b.startsAtUtc));
    return this.descending() ? rows.reverse() : rows;
  });

  protected readonly banner = computed(() => {
    const banner = this.data()?.banner;
    if (!banner || this.dismissedNow() === banner.key) return null;
    return banner.dismissible && this.dismissals.isDismissed(banner.key) ? null : banner;
  });

  protected readonly errorActions: AlertAction[] = [
    { label: 'Try again', run: () => this.attempt.update((n) => n + 1) },
    { label: 'Contact us', href: CONTACT },
  ];

  protected bannerKind(banner: SubmissionBanner): AlertKind {
    return BANNER_KINDS[banner.kind];
  }

  /** Actions that work today; Edit and resubmit and Add the address join with editing (journey 14). */
  protected bannerActions(banner: SubmissionBanner): AlertAction[] {
    switch (banner.kind) {
      case 'live':
        return [
          { label: 'View the listing', link: `/events/${banner.eventSlug}` },
          { label: 'Share it', run: () => this.share(banner) },
        ];
      case 'notApproved':
        return [{ label: 'Ask a question', href: CONTACT }];
      case 'unverified':
        return [{ label: 'Resend verification email', run: () => this.resend() }];
      default:
        return [];
    }
  }

  protected badge(row: OrganizerEventRow): BadgeKind {
    return STATUS_BADGES[row.status];
  }

  protected dismiss(banner: SubmissionBanner): void {
    this.dismissals.dismiss(banner.key);
    this.dismissedNow.set(banner.key);
  }

  protected toggleSort(): void {
    this.descending.update((d) => !d);
  }

  private share(banner: SubmissionBanner): void {
    const row = this.data()?.rows.find((r) => r.slug === banner.eventSlug);
    if (!row) return;
    this.shareLauncher.share(
      { slug: row.slug, title: row.title, summary: `${row.title} · ${row.dateLabel}` },
      null,
    );
  }

  private resend(): void {
    const email = this.data()?.email;
    this.api.resendVerification().subscribe({
      next: () =>
        this.toasts.show({ kind: 'success', title: 'We sent a new link', text: `Check ${email} for it.` }),
      error: () =>
        this.toasts.show({
          kind: 'danger',
          title: 'Couldn’t send the link',
          text: 'Try again in a moment.',
          action: { label: 'Try again', run: () => this.resend() },
        }),
    });
  }
}
