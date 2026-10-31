import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { EventFormatFilter, EVENTS_API, UpcomingEvents } from 'api';
import { DayGroup, SegmentedControl, SegmentedOption } from 'components';
import { switchMap } from 'rxjs';
import { EventFilters, FORMAT_LABELS, NO_FILTERS } from './event-filters';

/** The events page (`/`): upcoming events grouped by day, with filters (discovery/browse-events). */
@Component({
  selector: 'sx-events-page',
  imports: [DayGroup, SegmentedControl],
  templateUrl: './events-page.html',
  styleUrl: './events-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventsPage {
  private readonly api = inject(EVENTS_API);

  protected readonly filters = signal<EventFilters>(NO_FILTERS);
  protected readonly result = signal<UpcomingEvents | null>(null);

  protected readonly formatOptions = computed<SegmentedOption[]>(() => {
    const counts = this.result()?.formatCounts;
    return (['all', 'gta', 'streaming'] as const).map((value) => ({
      value,
      label: FORMAT_LABELS[value],
      count: counts ? counts[value] : '–',
    }));
  });

  constructor() {
    toObservable(this.filters)
      .pipe(
        switchMap((f) => this.api.upcoming({ format: f.format, topics: f.topics, q: f.q })),
        takeUntilDestroyed(),
      )
      .subscribe((result) => this.result.set(result));
  }

  protected chooseFormat(format: string): void {
    this.filters.update((f) => ({ ...f, format: format as EventFormatFilter }));
  }
}
