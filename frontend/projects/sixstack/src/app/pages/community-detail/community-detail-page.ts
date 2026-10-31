import { Dialog } from '@angular/cdk/dialog';
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
import { ApiError, COMMUNITIES_API, CommunityDetail } from 'api';
import {
  BackLink,
  Button,
  DayGroup,
  EmptyState,
  FactItem,
  Icon,
  isTopic,
  List,
  ListItem,
  LogoTile,
  modalDialogConfig,
  PersonLink,
  Skeleton,
  TopicKey,
  TopicTag,
} from 'components';
import {
  SUBSCRIBE_FEED_TITLE_ID,
  SubscribeFeedDialog,
  SubscribeFeedDialogData,
} from '../../dialogs/subscribe-feed/subscribe-feed-dialog';
import { SKELETON_DELAY_MS } from '../../shared/load-state';
import { NotFoundPage } from '../status/not-found-page';

type PageState =
  | { status: 'loading' }
  | { status: 'loaded'; data: CommunityDetail }
  | { status: 'failed' }
  | { status: 'notFound' };

/** A community's page (`/communities/:slug`): profile, events, facts and organizers (directory/view-community). */
@Component({
  selector: 'sx-community-detail-page',
  imports: [
    BackLink,
    Button,
    DayGroup,
    EmptyState,
    FactItem,
    Icon,
    List,
    ListItem,
    LogoTile,
    NotFoundPage,
    PersonLink,
    RouterLink,
    Skeleton,
    TopicTag,
  ],
  templateUrl: './community-detail-page.html',
  styleUrl: './community-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunityDetailPage {
  private readonly api = inject(COMMUNITIES_API);
  private readonly dialog = inject(Dialog);

  readonly slug = input.required<string>();
  private readonly attempt = signal(0);
  protected readonly state = signal<PageState>({ status: 'loading' });
  protected readonly slow = signal(false);

  protected readonly data = computed(() => {
    const s = this.state();
    return s.status === 'loaded' ? s.data : null;
  });

  protected readonly topics = computed<TopicKey[]>(() => (this.data()?.topics ?? []).filter(isTopic));

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

  /** Subscribe to this group: the subscribe dialog with the community preset (L2-031 criterion 2). */
  protected subscribe(trigger: EventTarget | null): void {
    const c = this.data();
    if (!c) return;
    this.dialog.open<unknown, SubscribeFeedDialogData>(
      SubscribeFeedDialog,
      modalDialogConfig({
        data: { communitySlug: c.slug, communityName: c.name },
        ariaLabelledBy: SUBSCRIBE_FEED_TITLE_ID,
        ariaDescribedBy: 'subscribe-feed-description',
        restoreFocus: (trigger as HTMLElement | null) ?? true,
      }),
    );
  }
}
