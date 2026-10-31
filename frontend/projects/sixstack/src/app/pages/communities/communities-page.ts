import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { COMMUNITIES_API, CommunityCard, CommunityDirectory, CommunitySort } from 'api';
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

export const CITIES = ['Toronto', 'Mississauga', 'Brampton', 'Markham', 'Oakville', 'Streaming'] as const;
const SORTS: { value: CommunitySort; label: string }[] = [
  { value: 'members', label: 'Most members' },
  { value: 'next', label: 'Next event soonest' },
  { value: 'name', label: 'A–Z' },
];

interface DirectoryFilters {
  q: string;
  topic: TopicKey | null;
  city: string | null;
  sort: CommunitySort;
}

/** The communities directory (`/communities`): search, filters and sort live in the URL (directory/browse-communities). */
@Component({
  selector: 'sx-communities-page',
  imports: [Alert, Button, DirectoryCard, EmptyState, Input, RouterLink, SearchField, Skeleton],
  templateUrl: './communities-page.html',
  styleUrl: './communities-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunitiesPage {
  private readonly api = inject(COMMUNITIES_API);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly topics = TOPICS;
  protected readonly topicLabels = TOPIC_LABELS;
  protected readonly cities = CITIES;
  protected readonly sorts = SORTS;
  protected readonly skeletons = [0, 1, 2, 3, 4, 5];

  /** Filters from the URL; unknown values are ignored. */
  protected readonly filters = toSignal(
    this.route.queryParamMap.pipe(
      map((p): DirectoryFilters => {
        const topic = p.get('topic');
        const city = p.get('city');
        const sort = p.get('sort') as CommunitySort | null;
        return {
          q: (p.get('q') ?? '').slice(0, 100),
          topic: topic && isTopic(topic) ? topic : null,
          city: city && (CITIES as readonly string[]).includes(city) ? city : null,
          sort: sort && SORTS.some((s) => s.value === sort) ? sort : 'members',
        };
      }),
    ),
    { requireSync: true },
  );

  private readonly attempt = signal(0);
  protected readonly state = signal<LoadState<CommunityDirectory>>(loading());
  protected readonly slow = signal(false);
  protected readonly loadingMore = signal(false);
  private page = 1;

  protected readonly data = computed(() => (this.state().status === 'loaded' ? this.state().data : null));

  protected readonly lead = computed(() => {
    const s = this.state();
    if (s.status === 'failed') return 'Community list unavailable right now.';
    const d = this.data();
    if (!d) return '';
    const f = this.filters();
    if (d.matchCount === 0 && f.q) return `0 of ${d.listedTotal} communities match.`;
    if (d.matchCount === 0 && f.city) return `0 communities in ${f.city}.`;
    return `${d.listedTotal} meetups and conferences across Toronto and the GTA, plus the global streams we list.`;
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
            catchError((error: unknown) => of(failed<CommunityDirectory>(error))),
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

  protected card(c: CommunityCard) {
    return {
      sub: `${c.city} · ${c.audienceLabel}`,
      meta: c.nextEvent ? `Next: ${c.nextEvent.title} · ${c.nextEvent.dateLabel}` : null,
      topics: c.topics.filter(isTopic),
    };
  }

  protected setFilter(change: Partial<DirectoryFilters>): void {
    const next = { ...this.filters(), ...change };
    void this.router.navigate([], {
      relativeTo: this.route,
      replaceUrl: true,
      queryParams: {
        q: next.q || null,
        topic: next.topic,
        city: next.city,
        sort: next.sort === 'members' ? null : next.sort,
      },
    });
  }

  protected onTopic(value: string): void {
    this.setFilter({ topic: isTopic(value) ? value : null });
  }

  protected onCity(value: string): void {
    this.setFilter({ city: value || null });
  }

  protected onSort(value: string): void {
    this.setFilter({ sort: value as CommunitySort });
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
