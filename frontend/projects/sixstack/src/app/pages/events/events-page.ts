import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { EventFormatFilter, EVENTS_API, UpcomingEvents } from 'api';
import {
  Alert,
  AlertAction,
  Button,
  DayGroup,
  EmptyState,
  SearchField,
  SegmentedControl,
  SegmentedOption,
  Skeleton,
  TOPIC_LABELS,
  TopicChip,
  TopicKey,
  TOPICS,
  ToastService,
} from 'components';
import { RouterLink } from '@angular/router';
import { catchError, finalize, map, of, skip, switchMap } from 'rxjs';
import { failed, loaded, loading, LoadState, SKELETON_DELAY_MS } from '../../shared/load-state';
import {
  EventFilters,
  FORMAT_LABELS,
  MAX_SEARCH_LENGTH,
  NO_FILTERS,
} from '../../shared/filters/event-filters';
import { FilterStateStore } from '../../shared/filters/filter-state.store';

/** The events page (`/`): upcoming events grouped by day, with filters (discovery/browse-events). */
@Component({
  selector: 'sx-events-page',
  imports: [
    Alert,
    Button,
    DayGroup,
    EmptyState,
    RouterLink,
    SearchField,
    SegmentedControl,
    Skeleton,
    TopicChip,
  ],
  templateUrl: './events-page.html',
  styleUrl: './events-page.scss',
  providers: [FilterStateStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventsPage {
  private readonly api = inject(EVENTS_API);
  private readonly toasts = inject(ToastService);
  private readonly store = inject(FilterStateStore);

  protected readonly topics = TOPICS;
  protected readonly topicLabels = TOPIC_LABELS;
  private undoFilters: EventFilters | null = null;

  protected readonly filters = signal<EventFilters>(this.store.initial());
  private readonly attempt = signal(0);
  protected readonly state = signal<LoadState<UpcomingEvents>>(loading());
  /** True once a pending load has taken longer than 300 ms, so quick loads never flash a skeleton. */
  protected readonly slow = signal(false);
  /** The latest data, kept while a new load runs; null after a failure. */
  protected readonly result = computed(() => (this.state().status === 'failed' ? null : this.state().data));
  protected readonly skeletonRows = [0, 1, 2];

  protected readonly errorActions: AlertAction[] = [
    { label: 'Try again', run: () => this.attempt.update((n) => n + 1) },
    { label: 'Use a calendar feed instead', link: '/feeds' },
  ];

  protected readonly formatOptions = computed<SegmentedOption[]>(() => {
    const counts = this.result()?.formatCounts;
    return (['all', 'gta', 'streaming'] as const).map((value) => ({
      value,
      label: FORMAT_LABELS[value],
      count: counts ? counts[value] : '–',
    }));
  });

  protected readonly hasFilters = computed(() => {
    const f = this.filters();
    return f.format !== 'all' || f.topics.length > 0 || f.q.length > 0;
  });

  /** "about AI or React" for the result line. */
  protected readonly topicPhrase = computed(() => {
    const topics = this.filters().topics;
    return topics.length ? ` about ${topics.map((t) => TOPIC_LABELS[t]).join(' or ')}` : '';
  });

  constructor() {
    toObservable(this.filters)
      .pipe(skip(1), takeUntilDestroyed())
      .subscribe((filters) => this.store.save(filters));
    toObservable(computed(() => ({ filters: this.filters(), attempt: this.attempt() })))
      .pipe(
        switchMap(({ filters: f }) => {
          this.page = 1;
          this.state.update((s) => loading(s.status === 'failed' ? null : s.data));
          this.slow.set(false);
          const timer = setTimeout(() => this.slow.set(true), SKELETON_DELAY_MS);
          return this.api.upcoming({ format: f.format, topics: f.topics, q: f.q }).pipe(
            map((result) => loaded(result)),
            catchError((error: unknown) => of(failed<UpcomingEvents>(error))),
            finalize(() => clearTimeout(timer)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((state) => {
        this.slow.set(false);
        this.state.set(state);
        if (state.status === 'loaded') {
          this.announceCleared(state.data);
        }
      });
  }

  protected readonly loadingMore = signal(false);
  private page = 1;

  /** Appends the next 20 matches, merging a day that is already shown (L2-009). */
  protected showMore(): void {
    const current = this.state();
    if (current.status !== 'loaded' || this.loadingMore()) {
      return;
    }
    const f = this.filters();
    this.loadingMore.set(true);
    this.api
      .upcoming({ format: f.format, topics: f.topics, q: f.q, page: this.page + 1 })
      .pipe(finalize(() => this.loadingMore.set(false)))
      .subscribe({
        next: (next) => {
          this.page++;
          const days = [...current.data.days];
          for (const day of next.days) {
            const last = days[days.length - 1];
            if (last?.date === day.date) {
              days[days.length - 1] = { ...last, events: [...last.events, ...day.events] };
            } else {
              days.push(day);
            }
          }
          this.state.set(
            loaded({ ...current.data, days, shown: next.shown, total: next.total, hasMore: next.hasMore }),
          );
        },
        error: () =>
          this.toasts.show({
            kind: 'danger',
            title: "We couldn't load more events",
            text: 'Your list is still here. Try again in a moment.',
            action: { label: 'Try again', run: () => this.showMore() },
          }),
      });
  }

  protected chooseFormat(format: string): void {
    this.filters.update((f) => ({ ...f, format: format as EventFormatFilter }));
  }

  /** Runs the search; the query is truncated to 100 characters before it is sent (L2-004). */
  protected searchFor(text: string): void {
    const q = text.trim().slice(0, MAX_SEARCH_LENGTH);
    this.filters.update((f) => (f.q === q ? f : { ...f, q }));
  }

  protected isTopicSelected(topic: TopicKey): boolean {
    return this.filters().topics.includes(topic);
  }

  protected toggleTopic(topic: TopicKey): void {
    this.filters.update((f) => ({
      ...f,
      topics: f.topics.includes(topic)
        ? f.topics.filter((t) => t !== topic)
        : TOPICS.filter((t) => t === topic || f.topics.includes(t)),
    }));
  }

  /** Resets topics, format and search, and offers Undo in an info toast once the full list is back (L2-003). */
  protected clearFilters(): void {
    this.undoFilters = this.filters();
    this.filters.set(NO_FILTERS);
  }

  private announceCleared(result: UpcomingEvents): void {
    const previous = this.undoFilters;
    if (!previous) {
      return;
    }
    this.undoFilters = null;
    this.toasts.show({
      kind: 'info',
      title: 'Filters cleared',
      text: `Showing all ${result.formatCounts.all} events.`,
      action: { label: 'Undo', run: () => this.filters.set(previous) },
    });
  }
}
