import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiError, SpeakerDetail, SPEAKERS_API } from 'api';
import {
  Avatar,
  BackLink,
  Button,
  EmptyState,
  EventRow,
  EventRowData,
  FactItem,
  Icon,
  isTopic,
  List,
  ListItem,
  Skeleton,
  TopicKey,
  TopicTag,
} from 'components';
import { SKELETON_DELAY_MS } from '../../shared/load-state';
import { NotFoundPage } from '../status/not-found-page';

type PageState =
  | { status: 'loading' }
  | { status: 'loaded'; data: SpeakerDetail }
  | { status: 'failed' }
  | { status: 'notFound' };

/** A speaker's page (`/speakers/:slug`): profile, talks, facts and invite (directory/view-speaker). */
@Component({
  selector: 'sx-speaker-detail-page',
  imports: [
    Avatar,
    BackLink,
    Button,
    EmptyState,
    EventRow,
    FactItem,
    Icon,
    List,
    ListItem,
    NotFoundPage,
    RouterLink,
    Skeleton,
    TopicTag,
  ],
  templateUrl: './speaker-detail-page.html',
  styleUrl: './speaker-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpeakerDetailPage {
  private readonly api = inject(SPEAKERS_API);

  readonly slug = input.required<string>();
  private readonly attempt = signal(0);
  protected readonly state = signal<PageState>({ status: 'loading' });
  protected readonly slow = signal(false);

  protected readonly data = computed(() => {
    const s = this.state();
    return s.status === 'loaded' ? s.data : null;
  });

  protected readonly topics = computed<TopicKey[]>(() => (this.data()?.topics ?? []).filter(isTopic));
  protected readonly firstName = computed(() => this.data()?.name.split(' ')[0] ?? '');

  /** Upcoming talks as event rows: the talk title, linked to its event. */
  protected readonly rows = computed<{ date: string; row: EventRowData }[]>(() =>
    (this.data()?.upcoming ?? []).map((t) => ({
      date: t.date,
      row: {
        slug: t.slug,
        title: t.title,
        organizer: t.organizer,
        format: t.format,
        topics: t.topics,
        startTimeEt: t.startTimeEt,
        sourceTime: null,
        locationLabel: t.locationLabel,
        priceLabel: t.priceLabel,
        goingCount: t.goingCount,
        isSoldOut: false,
        isCancelled: false,
      },
    })),
  );

  constructor() {
    effect((onCleanup) => {
      const slug = this.slug();
      this.attempt();
      untracked(() => {
        this.state.set({ status: 'loading' });
        this.slow.set(false);
      });
      const timer = setTimeout(() => this.slow.set(true), SKELETON_DELAY_MS);
      const sub = this.api.get(slug).subscribe({
        next: (data) => {
          clearTimeout(timer);
          this.state.set({ status: 'loaded', data });
        },
        error: (error: unknown) => {
          clearTimeout(timer);
          this.state.set(
            error instanceof ApiError && error.kind === 'NotFound'
              ? { status: 'notFound' }
              : { status: 'failed' },
          );
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
}
