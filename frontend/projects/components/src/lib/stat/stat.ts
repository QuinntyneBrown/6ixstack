import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Skeleton } from '../skeleton/skeleton';

/** One figure with its label (design system: stat). A null value while `loading` shows a skeleton. */
@Component({
  selector: 'sx-stat',
  imports: [Skeleton],
  template: `
    <span class="stat__label">{{ label() }}</span>
    @if (loading()) {
      <sx-skeleton class="stat__value" variant="title" width="4rem" />
    } @else {
      <span class="stat__value">{{ value() }}</span>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--spacingHorizontalXS);
      padding: var(--spacingHorizontalL);
      border: 1px solid var(--colorNeutralStroke2);
      border-radius: var(--borderRadiusXLarge);
      background: var(--colorNeutralBackground1);
    }
    .stat__label {
      font: var(--sx-text-label);
      color: var(--colorNeutralForeground2);
    }
    .stat__value {
      font: var(--sx-text-h2);
      font-size: var(--fontSizeBase600);
      font-variant-numeric: tabular-nums;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Stat {
  readonly label = input.required<string>();
  readonly value = input<string | number | null>(null);
  readonly loading = input(false);
}

/** A row of stats: two columns on phones, four from 768 px (design system: stats row). */
@Component({
  selector: 'sx-stats-row',
  template: '<ng-content />',
  styles: `
    :host {
      display: grid;
      gap: var(--spacingHorizontalL);
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    @media (min-width: 48rem) {
      :host {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsRow {}
