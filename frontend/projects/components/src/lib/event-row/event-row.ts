import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Badge } from '../badge/badge';
import { Icon } from '../icon/icon';
import { TopicTag } from '../topics/topic-tag';
import { isTopic, TopicKey } from '../topics/topics';

/** What an event row shows. Every label arrives formatted from the API. */
export interface EventRowData {
  slug: string;
  title: string;
  organizer: string;
  format: 'inPerson' | 'streaming' | 'hybrid' | string;
  topics: string[];
  startTimeEt: string;
  sourceTime?: string | null;
  locationLabel: string;
  priceLabel: string;
  goingCount: number;
  isSoldOut: boolean;
  isCancelled: boolean;
}

const numberFormat = new Intl.NumberFormat('en-US');

/**
 * One event in a list (L2-001, L2-010): time (and the stream's source time), linked title, organizer, location,
 * topics, status badges, price and going count. The whole row is clickable through the title link.
 */
@Component({
  selector: 'sx-event-row',
  imports: [RouterLink, Badge, Icon, TopicTag],
  templateUrl: './event-row.html',
  styleUrl: './event-row.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventRow {
  readonly event = input.required<EventRowData>();
  /** ISO date of the row's day, for the `<time>` element. */
  readonly date = input<string>('');
  readonly linkPrefix = input('/events/');

  protected readonly topics = computed(() => this.event().topics.filter(isTopic) as TopicKey[]);
  protected readonly going = computed(() => numberFormat.format(this.event().goingCount));
}
