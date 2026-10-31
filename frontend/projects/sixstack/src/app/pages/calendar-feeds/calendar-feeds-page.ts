import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FEEDS_API, ReadyMadeFeedCounts } from 'api';
import { Alert, AlertAction, Button, Icon, List, ListItem, LogoTile, NextSteps, Skeleton } from 'components';
import { catchError, map, of, switchMap, timer } from 'rxjs';
import { FeedLinkCopier, feedLink } from '../../shared/feeds/feed-link-copier';
import { failed, loaded, loading, LoadState, SKELETON_DELAY_MS } from '../../shared/load-state';
import { READY_MADE_FEEDS, ReadyMadeFeed } from './ready-made-feeds';

/** Calendar feeds (`/feeds`): the ready-made feeds and how subscribing works (feeds-and-sharing designs). */
@Component({
  selector: 'sx-calendar-feeds-page',
  imports: [Alert, Button, Icon, List, ListItem, LogoTile, NextSteps, Skeleton],
  templateUrl: './calendar-feeds-page.html',
  styleUrl: './calendar-feeds-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarFeedsPage {
  private readonly api = inject(FEEDS_API);
  private readonly copier = inject(FeedLinkCopier);
  private readonly host = inject(DOCUMENT).location.host;
  private readonly howItWorks = viewChild<ElementRef<HTMLElement>>('howItWorks');

  protected readonly feeds = READY_MADE_FEEDS;
  protected readonly steps = [
    'Pick a feed — a ready-made one or your own mix of topics.',
    'Add it once to Google Calendar, Outlook or Apple Calendar.',
    'Stop checking. New and changed events show up on their own, in Toronto time.',
  ];

  private readonly attempt = signal(0);
  protected readonly state = toSignal(
    toObservable(this.attempt).pipe(
      switchMap(() =>
        this.api.readyMadeCounts().pipe(
          map((data): LoadState<ReadyMadeFeedCounts> => loaded(data)),
          catchError((error: unknown) => of(failed<ReadyMadeFeedCounts>(error))),
        ),
      ),
    ),
    { initialValue: loading<ReadyMadeFeedCounts>() },
  );
  /** Count skeletons appear only after 300 ms (DelayedSkeleton). */
  protected readonly slow = toSignal(timer(SKELETON_DELAY_MS).pipe(map(() => true)), { initialValue: false });
  protected readonly retryActions: AlertAction[] = [
    { label: 'Try again', run: () => this.attempt.update((n) => n + 1) },
  ];

  private readonly counts = computed(() => {
    const s = this.state();
    return s.status === 'loaded' ? new Map(s.data.feeds.map((f) => [f.key, f.upcomingCount])) : null;
  });

  protected count(feed: ReadyMadeFeed): number | null {
    return this.counts()?.get(feed.key) ?? null;
  }

  protected copy(feed: ReadyMadeFeed): void {
    this.copier.copy(feedLink(feed.slug, this.host), () => {
      const heading = this.howItWorks()?.nativeElement;
      heading?.scrollIntoView({ block: 'start' });
      heading?.focus();
    });
  }
}
