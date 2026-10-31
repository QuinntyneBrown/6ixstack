import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SpeakerCard, SpeakerDirectory, SPEAKERS_API, SpeakingPeriod } from 'api';
import {
  Alert,
  AlertAction,
  Button,
  DirectoryCard,
  EmptyState,
  Input,
  isTopic,
  SearchField,
  Skeleton,
  TOPIC_LABELS,
  TopicKey,
  TOPICS,
} from 'components';
import { catchError, finalize, map, of, switchMap } from 'rxjs';
import { failed, loaded, loading, LoadState, SKELETON_DELAY_MS } from '../../shared/load-state';

const PERIODS: { value: SpeakingPeriod; label: string }[] = [
  { value: 'any', label: 'Any time' },
  { value: 'month', label: 'Speaking this month' },
  { value: 'year', label: 'Spoke this year' },
];

interface SpeakerFilters {
  q: string;
  topic: TopicKey | null;
  period: SpeakingPeriod;
}

/** The speakers directory (`/speakers`): search, topic and period live in the URL (directory/browse-speakers). */
@Component({
  selector: 'sx-speakers-page',
  imports: [Alert, Button, DirectoryCard, EmptyState, Input, RouterLink, SearchField, Skeleton],
  templateUrl: './speakers-page.html',
  styleUrl: './speakers-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpeakersPage {
  private readonly api = inject(SPEAKERS_API);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly topics = TOPICS;
  protected readonly topicLabels = TOPIC_LABELS;
  protected readonly periods = PERIODS;
  protected readonly skeletons = [0, 1, 2, 3, 4, 5];

  /** Filters from the URL; unknown values are ignored. */
  protected readonly filters = toSignal(
    this.route.queryParamMap.pipe(
      map((p): SpeakerFilters => {
        const topic = p.get('topic');
        const period = p.get('period') as SpeakingPeriod | null;
        return {
          q: (p.get('q') ?? '').slice(0, 100),
          topic: topic && isTopic(topic) ? topic : null,
          period: period && PERIODS.some((x) => x.value === period) ? period : 'any',
        };
      }),
    ),
    { requireSync: true },
  );

  private readonly attempt = signal(0);
  protected readonly state = signal<LoadState<SpeakerDirectory>>(loading());
  protected readonly slow = signal(false);
  protected readonly loadingMore = signal(false);
  private page = 1;

  protected readonly data = computed(() => (this.state().status === 'loaded' ? this.state().data : null));

  protected readonly lead = computed(() => {
    if (this.state().status === 'failed') return 'Speaker list unavailable right now.';
    const d = this.data();
    if (!d) return '';
    if (d.matchCount === 0)
      return this.filters().q ? `0 of ${d.listedTotal} speakers match.` : '0 speakers match.';
    return `${d.listedTotal} people who have spoken at GTA meetups and conferences this year.`;
  });

  /** "No AWS talks this month", "No talks this year". */
  protected readonly emptyTitle = computed(() => {
    const f = this.filters();
    const topic = f.topic ? `${TOPIC_LABELS[f.topic]} ` : '';
    return `No ${topic}talks ${f.period === 'year' ? 'this year' : 'this month'}`;
  });

  protected readonly errorActions: AlertAction[] = [
    { label: 'Try again', run: () => this.attempt.update((n) => n + 1) },
  ];

  constructor() {
    toObservable(computed(() => ({ f: this.filters(), attempt: this.attempt() })))
      .pipe(
        switchMap(({ f }) => {
          this.page = 1;
          this.state.update((s) => loading(s.status === 'loaded' ? s.data : null));
          this.slow.set(false);
          const timer = setTimeout(() => this.slow.set(true), SKELETON_DELAY_MS);
          return this.api.list({ ...f }).pipe(
            map((d) => loaded(d)),
            catchError((error: unknown) => of(failed<SpeakerDirectory>(error))),
            finalize(() => clearTimeout(timer)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((s) => {
        this.slow.set(false);
        this.state.set(s);
      });
  }

  protected card(s: SpeakerCard) {
    return {
      meta: s.nextTalk ? `Next: ${s.nextTalk.title} · ${s.nextTalk.dateLabel}` : null,
      topics: s.topics.filter(isTopic),
    };
  }

  protected setFilter(change: Partial<SpeakerFilters>): void {
    const next = { ...this.filters(), ...change };
    void this.router.navigate([], {
      relativeTo: this.route,
      replaceUrl: true,
      queryParams: {
        q: next.q || null,
        topic: next.topic,
        period: next.period === 'any' ? null : next.period,
      },
    });
  }

  protected onTopic(value: string): void {
    this.setFilter({ topic: isTopic(value) ? value : null });
  }

  protected onPeriod(value: string): void {
    this.setFilter({ period: value as SpeakingPeriod });
  }

  protected showMore(): void {
    const current = this.data();
    if (!current || this.loadingMore()) return;
    this.loadingMore.set(true);
    this.api
      .list({ ...this.filters(), page: this.page + 1 })
      .pipe(finalize(() => this.loadingMore.set(false)))
      .subscribe((next) => {
        this.page++;
        this.state.set(loaded({ ...next, items: [...current.items, ...next.items] }));
      });
  }
}
