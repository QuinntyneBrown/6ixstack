import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { EventRow, EventRowData } from '../event-row/event-row';

/** One day's events under a heading such as "Thursday November 5", in start order. */
@Component({
  selector: 'sx-day-group',
  imports: [EventRow],
  template: `
    <section
      class="day-group"
      [class.day-group--dim]="dimmed()"
      [id]="'group-' + date()"
      [attr.aria-labelledby]="'d-' + date()"
    >
      <h2 class="day-group__heading" [id]="'d-' + date()">
        @if (focused()) {
          <span class="day-group__focus" aria-hidden="true"></span>
        }
        {{ weekday() }} <span>{{ dateLabel() }}</span>
      </h2>
      <ul class="event-list">
        @for (event of events(); track event.slug) {
          <li
            [attr.data-slug]="event.slug"
            (mouseenter)="rowHovered.emit(event.slug)"
            (mouseleave)="rowHovered.emit(null)"
            (focusin)="rowHovered.emit(event.slug)"
            (focusout)="rowHovered.emit(null)"
          >
            <sx-event-row [event]="event" [date]="date()" [linkPrefix]="linkPrefix()" />
          </li>
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
  /** Dimmed while another day is focused on the map (L2-013). */
  readonly dimmed = input(false);
  /** Marks the focused day with a dot. */
  readonly focused = input(false);
  /** The slug of the row under the pointer or holding focus, or null when it leaves (L2-012). */
  readonly rowHovered = output<string | null>();
}
