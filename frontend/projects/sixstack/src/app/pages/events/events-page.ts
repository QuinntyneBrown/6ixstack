import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EVENTS_API, UpcomingEvents } from 'api';
import { DayGroup } from 'components';

/** The events page (`/`): upcoming events grouped by day (discovery/browse-events). */
@Component({
  selector: 'sx-events-page',
  imports: [DayGroup],
  templateUrl: './events-page.html',
  styleUrl: './events-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventsPage {
  private readonly api = inject(EVENTS_API);

  protected readonly result = signal<UpcomingEvents | null>(null);

  constructor() {
    this.api
      .upcoming({})
      .pipe(takeUntilDestroyed())
      .subscribe((result) => this.result.set(result));
  }
}
