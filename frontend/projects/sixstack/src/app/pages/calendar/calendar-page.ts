import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EVENTS_API, MonthCalendar } from 'api';
import {
  Alert,
  AlertAction,
  Button,
  ButtonGroup,
  CalendarDayList,
  CalendarDayListEvent,
  Icon,
  isTopic,
  MonthGrid,
  MonthGridDays,
  monthLabel,
  SegmentedControl,
  SegmentedOption,
  shiftMonth,
  TOPIC_LABELS,
  TopicChip,
  TopicKey,
  TOPICS,
  TopicTag,
} from 'components';
import { catchError, map, of, skip, switchMap, timer } from 'rxjs';
import { EventFilters, FORMAT_LABELS } from '../../shared/filters/event-filters';
import { FilterStateStore } from '../../shared/filters/filter-state.store';
import { failed, loaded, loading, LoadState, SKELETON_DELAY_MS } from '../../shared/load-state';
import { torontoToday } from '../../shared/toronto-time';

const MONTH = /^(\d{4})-(0[1-9]|1[0-2])$/;

/** The month calendar (`/calendar`): grid, navigation, shared filters and states (discovery/month-calendar). */
@Component({
  selector: 'sx-calendar-page',
  imports: [
    Alert,
    Button,
    ButtonGroup,
    CalendarDayList,
    Icon,
    MonthGrid,
    RouterLink,
    SegmentedControl,
    TopicChip,
    TopicTag,
  ],
  providers: [FilterStateStore],
  templateUrl: './calendar-page.html',
  styleUrl: './calendar-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarPage {
  private readonly events = inject(EVENTS_API);
  private readonly store = inject(FilterStateStore);
  private readonly route = inject(ActivatedRoute);

  protected readonly topics = TOPICS;
  protected readonly topicLabels = TOPIC_LABELS;
  protected readonly today = torontoToday();
  private readonly currentMonth = this.today.slice(0, 7);

  protected readonly month = toSignal(
    this.route.queryParamMap.pipe(map((p) => validMonth(p.get('month')) ?? this.currentMonth)),
    { initialValue: validMonth(this.route.snapshot.queryParamMap.get('month')) ?? this.currentMonth },
  );
  protected readonly label = computed(() => monthLabel(this.month()));
  protected readonly monthLabelOf = monthLabel;
  protected readonly previous = computed(() => shiftMonth(this.month(), -1));
  protected readonly next = computed(() => shiftMonth(this.month(), 1));

  protected readonly filters = signal<EventFilters>(this.store.initial());
  private readonly attempt = signal(0);
  protected readonly state = toSignal(
    toObservable(
      computed(() => ({ month: this.month(), filters: this.filters(), attempt: this.attempt() })),
    ).pipe(
      switchMap(({ month, filters }) =>
        this.events.month({ month, format: filters.format, topics: filters.topics }).pipe(
          map((data): LoadState<MonthCalendar> => loaded(data)),
          catchError((error: unknown) => of(failed<MonthCalendar>(error))),
        ),
      ),
    ),
    { initialValue: loading<MonthCalendar>() },
  );
  /** True once a month has taken longer than 300 ms (DelayedSkeleton, L2-027). */
  private readonly slowAfter = toSignal(
    toObservable(this.month).pipe(switchMap(() => timer(SKELETON_DELAY_MS).pipe(map(() => true)))),
    { initialValue: false },
  );
  protected readonly data = computed(() => {
    const s = this.state();
    return s.status === 'loaded' && s.data.month === this.month() ? s.data : null;
  });
  protected readonly busy = computed(
    () => this.state().status !== 'failed' && !this.data() && this.slowAfter(),
  );
  protected readonly failed = computed(() => this.state().status === 'failed');
  protected readonly picked = signal<string | null>(null);

  protected readonly hasFilters = computed(
    () => this.filters().format !== 'all' || this.filters().topics.length > 0,
  );
  protected readonly monthName = computed(() => this.label().split(' ')[0]);

  protected readonly subtitle = computed(() => {
    const d = this.data();
    if (this.failed()) return 'Events unavailable';
    if (!d) return this.busy() ? `Loading ${this.monthName()}…` : '';
    if (d.totals.events === 0) return '0 events this month';
    if (this.hasFilters())
      return `${d.matchCount} of ${d.totals.events} events this month match your filters`;
    return `${d.totals.events} events this month · ${d.totals.gta} in the GTA · ${d.totals.streaming} streamable`;
  });

  protected readonly formatOptions = computed<SegmentedOption[]>(() => {
    const counts = this.data()?.counts;
    return (['all', 'gta', 'streaming'] as const).map((value) => ({
      value,
      label: FORMAT_LABELS[value],
      count: counts ? counts[value] : '–',
    }));
  });

  protected readonly gridDays = computed<MonthGridDays>(() => {
    const days: MonthGridDays = {};
    for (const day of this.data()?.days ?? []) {
      days[day.date] = day.events.map((e) => ({
        title: e.title,
        link: `/events/${e.slug}`,
        topic: e.firstTopic && isTopic(e.firstTopic) ? e.firstTopic : null,
      }));
    }
    return days;
  });

  /** The filtered-results alert (L2-027 criterion 1): "2 events match React in the GTA". */
  protected readonly match = computed(() => {
    const d = this.data();
    if (!d || !this.hasFilters() || d.totals.events === 0) return null;
    const f = this.filters();
    const topics = f.topics.map((t) => TOPIC_LABELS[t]).join(' or ');
    const where = f.format === 'gta' ? 'in the GTA' : f.format === 'streaming' ? 'streaming' : '';
    const phrase = [topics, where].filter(Boolean).join(' ') || 'your filters';
    const others = f.format === 'all' ? 0 : d.counts.all - d.matchCount;
    const actions: AlertAction[] = [];
    if (others > 0) {
      const include = f.format === 'gta' ? 'streaming' : 'in-person events';
      actions.push({
        label: `Include ${include} to see ${others} more`,
        run: () => this.chooseFormat('all'),
      });
    }
    actions.push({ label: 'Clear filters', run: () => this.clearFilters() });
    return { title: `${d.matchCount} event${d.matchCount === 1 ? '' : 's'} match ${phrase}`, actions };
  });

  protected readonly errorActions: AlertAction[] = [
    { label: 'Try again', run: () => this.attempt.update((n) => n + 1) },
  ];

  protected readonly dayList = computed<{ heading: string; events: CalendarDayListEvent[] } | null>(() => {
    const date = this.picked();
    const day = date ? this.data()?.days.find((d) => d.date === date) : null;
    if (!date || !day) return null;
    const [y, m, dd] = date.split('-').map(Number);
    const heading = new Date(Date.UTC(y, m - 1, dd)).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    });
    return {
      heading,
      events: day.events.map((e) => ({
        title: e.title,
        link: `/events/${e.slug}`,
        time: e.startTimeEt,
        topic: e.firstTopic && isTopic(e.firstTopic) ? e.firstTopic : null,
      })),
    };
  });

  constructor() {
    toObservable(this.filters)
      .pipe(skip(1), takeUntilDestroyed())
      .subscribe((filters) => this.store.save(filters));
    toObservable(this.month)
      .pipe(skip(1), takeUntilDestroyed())
      .subscribe(() => this.picked.set(null));
  }

  /** Query parameters for the List view: the events page with the same filters (L2-026 criterion 4). */
  protected listParams(): Record<string, string | null> {
    const f = this.filters();
    return {
      format: f.format === 'all' ? null : f.format,
      topics: f.topics.length ? f.topics.join(',') : null,
    };
  }

  protected chooseFormat(format: string): void {
    this.filters.update((f) => ({ ...f, format: format as EventFilters['format'] }));
  }

  protected isTopicSelected(topic: TopicKey): boolean {
    return this.filters().topics.includes(topic);
  }

  protected toggleTopic(topic: TopicKey): void {
    this.filters.update((f) => ({
      ...f,
      topics: f.topics.includes(topic)
        ? f.topics.filter((t) => t !== topic)
        : TOPICS.filter((t) => [...f.topics, topic].includes(t)),
    }));
  }

  protected clearFilters(): void {
    this.filters.update((f) => ({ ...f, format: 'all', topics: [] }));
  }
}

function validMonth(value: string | null): string | null {
  const match = value ? MONTH.exec(value) : null;
  return match && Number(match[1]) >= 2000 && Number(match[1]) <= 2100 ? value : null;
}
