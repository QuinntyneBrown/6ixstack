import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { EventRow, EventRowData } from '../event-row/event-row';

/** One day's events under a heading such as "Thursday November 5", in start order. */
@Component({
  selector: 'sx-day-group',
  imports: [EventRow],
  template: `
    <section class="day-group" [id]="'group-' + date()" [attr.aria-labelledby]="'d-' + date()">
      <h2 class="day-group__heading" [id]="'d-' + date()">
        {{ weekday() }} <span>{{ dateLabel() }}</span>
      </h2>
      <ul class="event-list">
        @for (event of events(); track event.slug) {
          <li><sx-event-row [event]="event" [date]="date()" [linkPrefix]="linkPrefix()" /></li>
        }
      </ul>
    </section>
  `,
  styleUrl: './day-group.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DayGroup {
  /** ISO date, e.g. 2026-11-05. */
  readonly date = input.required<string>();
  readonly weekday = input.required<string>();
  readonly dateLabel = input.required<string>();
  readonly events = input.required<EventRowData[]>();
  readonly linkPrefix = input('/events/');
}
