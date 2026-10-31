import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ApiError, MODERATION_API, ReviewCardData, ReviewQueue } from 'api';
import { Alert, Button, EmptyState, isTopic, ReviewCard, Skeleton, TopicKey } from 'components';
import { catchError, map, of, switchMap, timer } from 'rxjs';
import { SessionStore } from '../../shell/session/session-store';
import { failed, loaded, loading, LoadState, SKELETON_DELAY_MS } from '../../shared/load-state';
import { ReviewQueueShortcuts } from './review-queue-shortcuts';

/** The review queue (`/admin/review`): waiting submissions and their checks, for moderators (moderation/review-queue). */
@Component({
  selector: 'sx-review-queue-page',
  imports: [Alert, Button, EmptyState, ReviewCard, ReviewQueueShortcuts, RouterLink, Skeleton],
  templateUrl: './review-queue-page.html',
  styleUrl: './review-queue-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewQueuePage {
  private readonly moderation = inject(MODERATION_API);
  protected readonly session = inject(SessionStore);

  private readonly reload = signal(0);
  protected readonly state = toSignal(
    toObservable(this.reload).pipe(
      switchMap(() =>
        this.moderation.getQueue().pipe(
          map((queue): LoadState<ReviewQueue> => loaded(queue)),
          catchError((error: unknown) => of(failed<ReviewQueue>(error))),
        ),
      ),
    ),
    { initialValue: loading<ReviewQueue>() },
  );
  /** True once the queue has taken longer than 300 ms (DelayedSkeleton, L2-058). */
  protected readonly slow = toSignal(timer(SKELETON_DELAY_MS).pipe(map(() => true)), { initialValue: false });

  protected readonly forbidden = computed(() => {
    const s = this.state();
    return s.status === 'failed' && s.error instanceof ApiError && s.error.kind === 'Forbidden';
  });
  protected readonly lead = computed(() => {
    const s = this.state();
    if (s.status === 'loaded') return s.data.summary;
    if (s.status === 'loading') return this.slow() ? 'Loading submissions…' : '';
    return this.forbidden() ? 'You don’t have access to this page' : 'Queue unavailable';
  });

  protected topics(card: ReviewCardData): TopicKey[] {
    return card.topics.filter(isTopic);
  }

  protected retry(): void {
    this.reload.update((n) => n + 1);
  }
}
