import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ApiError, EventDetail, EVENTS_API } from 'api';
import {
  Button,
  DateTile,
  Description,
  FactItem,
  Icon,
  isTopic,
  PersonLink,
  TopicKey,
  TopicTag,
} from 'components';
import { catchError, map, of, switchMap } from 'rxjs';
import { failed, loaded, loading, LoadState } from '../../shared/load-state';
import { NotFoundPage } from '../status/not-found-page';

/** The event detail page (`/events/:slug`): the API decides state, facts, actions and alerts (L2-017 to L2-024). */
@Component({
  selector: 'sx-event-detail-page',
  imports: [Button, DateTile, Description, FactItem, Icon, NotFoundPage, PersonLink, RouterLink, TopicTag],
  templateUrl: './event-detail-page.html',
  styleUrl: './event-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventDetailPage {
  private readonly api = inject(EVENTS_API);

  readonly slug = input.required<string>();
  protected readonly state = signal<LoadState<EventDetail>>(loading());

  constructor() {
    toObservable(this.slug)
      .pipe(
        switchMap((slug) => {
          this.state.set(loading());
          return this.api.detail(slug).pipe(
            map((detail) => loaded(detail)),
            catchError((error: unknown) => of(failed<EventDetail>(error))),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((state) => this.state.set(state));
  }

  protected isNotFound(state: LoadState<EventDetail>): boolean {
    return state.status === 'failed' && state.error instanceof ApiError && state.error.kind === 'NotFound';
  }

  protected topics(detail: EventDetail): TopicKey[] {
    return detail.topics.filter(isTopic);
  }
}
