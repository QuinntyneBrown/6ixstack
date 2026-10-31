import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Skeleton } from '../skeleton/skeleton';
import { TopicKey } from '../topics/topics';
import { monthCells } from './month-grid-layout';

/** One event in a day cell. */
export interface MonthGridEvent {
  title: string;
  /** Router path, e.g. `/events/azure-data-ai-day-gta`. */
  link: string;
  topic: TopicKey | null;
}

/** Events keyed by `YYYY-MM-DD`, in start order. */
export type MonthGridDays = Record<string, MonthGridEvent[]>;

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MAX_SHOWN = 3;

/**
 * A Sunday-first month grid (design system: calendar; BEM block `cal`). Each day of the month shows up to three
 * event links and "+N more"; adjacent days are greyed. Below 768 px a day shows topic dots and becomes a button that
 * emits `dayPicked`. While `loading`, each day shows a skeleton chip and the grid is busy (L2-025, L2-027, L2-028).
 */
@Component({
  selector: 'sx-month-grid',
  imports: [RouterLink, Skeleton],
  templateUrl: './month-grid.html',
  styleUrl: './month-grid.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonthGrid {
  /** `YYYY-MM`. */
  readonly month = input.required<string>();
  /** "November 2026", the grid's accessible name. */
  readonly label = input.required<string>();
  /** Today in Toronto, `YYYY-MM-DD`. */
  readonly today = input.required<string>();
  readonly days = input<MonthGridDays>({});
  readonly loading = input(false);
  readonly dayPicked = output<string>();

  protected readonly weekdays = WEEKDAYS;
  protected readonly max = MAX_SHOWN;
  protected readonly cells = computed(() => monthCells(this.month(), this.today()));

  protected eventsOf(date: string): MonthGridEvent[] {
    return this.days()[date] ?? [];
  }

  /** "November 2, today, 3 events" (L2-025 criterion 3). */
  protected cellLabel(date: string, today: boolean): string {
    const [year, month, day] = date.split('-').map(Number);
    const name = new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    });
    if (this.loading()) return `${name}${today ? ', today' : ''}`;
    const count = this.eventsOf(date).length;
    return `${name}${today ? ', today' : ''}, ${count ? `${count} event${count === 1 ? '' : 's'}` : 'no events'}`;
  }
}
