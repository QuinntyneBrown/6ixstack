import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type BadgeKind = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'brand' | 'count';

/** A short status label ("Waitlist open", "Cancelled", "In review"), or a count on an icon button. */
@Component({
  selector: 'sx-badge',
  template: `<span [class]="classes()"><ng-content /></span>`,
  styleUrl: './badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Badge {
  readonly kind = input<BadgeKind>('neutral');
  protected readonly classes = computed(() =>
    this.kind() === 'neutral' ? 'badge' : `badge badge--${this.kind()}`,
  );
}
