import { ChangeDetectionStrategy, Component } from '@angular/core';

/** The events page (`/`). The scaffold shows its title; journey 01 adds the list, filters and map. */
@Component({
  selector: 'sx-events-page',
  template: `
    <div class="page-title">
      <h1>Every dev event in the 6ix<span class="dot">.</span></h1>
      <p class="lead">
        Meetups and conferences across Toronto and the GTA, plus global talks you can stream. All in one
        calendar, in Toronto time.
      </p>
    </div>
  `,
  styles: `
    .dot {
      color: var(--sx-color-brand);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventsPage {}
