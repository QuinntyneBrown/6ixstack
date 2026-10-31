import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ApiError, EventAlert, EventDetail, EVENTS_API } from 'api';
import {
  Alert,
  AlertAction,
  Button,
  DateTile,
  Description,
  DockedActionBar,
  EmptyState,
  FactItem,
  Icon,
  isTopic,
  PersonLink,
  Skeleton,
  TopicKey,
  TopicTag,
} from 'components';
import { catchError, finalize, map, of, switchMap } from 'rxjs';
import { failed, loaded, loading, LoadState, SKELETON_DELAY_MS } from '../../shared/load-state';
import { NotFoundPage } from '../status/not-found-page';

/** The event detail page (`/events/:slug`): the API decides state, facts, actions and alerts (L2-017 to L2-024). */
@Component({
  selector: 'sx-event-detail-page',
  imports: [
    Alert,
    Button,
    DateTile,
    Description,
    DockedActionBar,
    EmptyState,
    FactItem,
    Icon,
    NotFoundPage,
    PersonLink,
    RouterLink,
    Skeleton,
    TopicTag,
  ],
  templateUrl: './event-detail-page.html',
  styleUrl: './event-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventDetailPage {
  private readonly api = inject(EVENTS_API);

  readonly slug = input.required<string>();
  protected readonly state = signal<LoadState<EventDetail>>(loading());
  private readonly reload = signal(0);
  /** True once the first load has taken longer than 300 ms (DelayedSkeleton). */
  protected readonly slow = signal(false);
  private joinTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.joinTimer));
    toObservable(computed(() => ({ slug: this.slug(), reload: this.reload() })))
      .pipe(
        switchMap(({ slug, reload }) => {
          const first = reload === 0 || this.state().status === 'failed';
          if (first) {
            this.state.set(loading());
          }
          const timer = first ? setTimeout(() => this.slow.set(true), SKELETON_DELAY_MS) : undefined;
          return this.api.detail(slug).pipe(
            map((detail) => loaded(detail)),
            catchError((error: unknown) => of(failed<EventDetail>(error))),
            finalize(() => {
              clearTimeout(timer);
              this.slow.set(false);
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((state) => {
        this.state.set(state);
        this.scheduleJoin(state);
      });
  }

  /** StreamJoinTimer: reloads once when the join window opens, so "Join the stream" appears without a refresh. */
  private scheduleJoin(state: LoadState<EventDetail>): void {
    clearTimeout(this.joinTimer);
    const join = state.status === 'loaded' ? state.data.actions.join : null;
    if (!join || join.url) {
      return;
    }
    const wait = Math.max(0, Date.parse(join.opensAtUtc) - Date.now());
    this.joinTimer = setTimeout(() => this.reload.update((n) => n + 1), wait);
  }

  /** Splits an app link such as "/?topics=dotnet,angular" for routerLink and queryParams. */
  protected findAnotherPath(href: string): string {
    return href.split('?')[0];
  }

  protected findAnotherQuery(href: string): Record<string, string> {
    return Object.fromEntries(new URLSearchParams(href.split('?')[1] ?? ''));
  }

  protected alertActions(alert: EventAlert): AlertAction[] {
    if (!alert.action) {
      return [];
    }
    const { label, href } = alert.action;
    if (href?.startsWith('/')) {
      return [{ label, link: href }];
    }
    if (href) {
      return [{ label, href }];
    }
    return [{ label, run: () => undefined }];
  }

  protected retry(): void {
    this.reload.update((n) => n + 1);
  }

  protected isNotFound(state: LoadState<EventDetail>): boolean {
    return state.status === 'failed' && state.error instanceof ApiError && state.error.kind === 'NotFound';
  }

  protected topics(detail: EventDetail): TopicKey[] {
    return detail.topics.filter(isTopic);
  }
}
