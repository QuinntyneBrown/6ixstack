import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TopicKey } from '../topics/topics';

export interface CalendarDayListEvent {
  title: string;
  link: string;
  time: string;
  topic: TopicKey | null;
}

/** One day's events as a list of links, shown under the month grid on small screens (L2-028). */
@Component({
  selector: 'sx-calendar-day-list',
  imports: [RouterLink],
  template: `
    <section class="day-list" [attr.aria-label]="heading()">
      <h3>{{ heading() }}</h3>
      <ul>
        @for (event of events(); track $index) {
          <li>
            <a [routerLink]="event.link"
              ><span class="day-list__time">{{ event.time }}</span
              ><span [class]="'topic-dot topic-dot--' + (event.topic ?? 'none')" aria-hidden="true"></span
              ><span>{{ event.title }}</span></a
            >
          </li>
        }
      </ul>
    </section>
  `,
  styles: `
    @use '../topics/topic-dot';

    :host {
      display: block;
      margin-top: var(--spacingHorizontalL);
    }
    .day-list {
      border: 1px solid var(--colorNeutralStroke2);
      border-radius: var(--borderRadiusXLarge);
      background: var(--colorNeutralBackground1);
      padding: var(--spacingHorizontalL);
    }
    h3 {
      font: var(--sx-text-h4);
    }
    ul {
      list-style: none;
      margin: var(--spacingHorizontalS) 0 0;
      padding: 0;
    }
    a {
      display: flex;
      align-items: center;
      gap: var(--spacingHorizontalS);
      min-height: var(--sx-target-min);
      color: var(--colorNeutralForeground1);
      text-decoration: none;
    }
    a:hover span:last-child {
      text-decoration: underline;
    }
    .day-list__time {
      font: var(--sx-text-code);
      color: var(--colorNeutralForeground2);
      min-width: 4.5rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarDayList {
  /** "Thursday, November 5". */
  readonly heading = input.required<string>();
  readonly events = input.required<CalendarDayListEvent[]>();
}
