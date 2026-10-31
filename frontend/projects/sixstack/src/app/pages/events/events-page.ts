import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { EventFormatFilter, EVENTS_API, UpcomingEvents } from 'api';
import {
  DayGroup,
  SegmentedControl,
  SegmentedOption,
  TOPIC_LABELS,
  TopicChip,
  TopicKey,
  TOPICS,
  ToastService,
} from 'components';
import { switchMap } from 'rxjs';
import { EventFilters, FORMAT_LABELS, NO_FILTERS } from './event-filters';

/** The events page (`/`): upcoming events grouped by day, with filters (discovery/browse-events). */
@Component({
  selector: 'sx-events-page',
  imports: [DayGroup, SegmentedControl, TopicChip],
  templateUrl: './events-page.html',
  styleUrl: './events-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventsPage {
  private readonly api = inject(EVENTS_API);
  private readonly toasts = inject(ToastService);

  protected readonly topics = TOPICS;
  protected readonly topicLabels = TOPIC_LABELS;
  private undoFilters: EventFilters | null = null;

  protected readonly filters = signal<EventFilters>(NO_FILTERS);
  protected readonly result = signal<UpcomingEvents | null>(null);

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
      .pipe(
        switchMap((f) => this.api.upcoming({ format: f.format, topics: f.topics, q: f.q })),
        takeUntilDestroyed(),
      )
      .subscribe((result) => {
        this.result.set(result);
        this.announceCleared(result);
      });
  }

  protected chooseFormat(format: string): void {
    this.filters.update((f) => ({ ...f, format: format as EventFormatFilter }));
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
