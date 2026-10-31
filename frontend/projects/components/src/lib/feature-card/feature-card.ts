import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from '../button/button';
import { DateTile } from '../date-tile/date-tile';
import { Icon } from '../icon/icon';
import { Skeleton } from '../skeleton/skeleton';

/** What the featured card shows; every label arrives formatted. */
export interface FeatureCardData {
  slug: string;
  title: string;
  organizer: string;
  description: string;
  monthLabel: string;
  dayOfMonth: string;
  locationLabel: string;
  hasLivestream: boolean;
  whenLabel: string;
  primaryAction: { label: string; url: string };
}

/**
 * "Featured this week" beside the events hero (design system: feature card, L2-006): the event with its date tile,
 * meta and a primary action, the invitation to submit when nothing is featured, or a skeleton frame while loading.
 */
@Component({
  selector: 'sx-feature-card',
  imports: [Button, DateTile, Icon, RouterLink, Skeleton],
  templateUrl: './feature-card.html',
  styleUrl: './feature-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureCard {
  /** The featured event; null shows the invitation. */
  readonly event = input<FeatureCardData | null>(null);
  readonly loading = input(false);
}
