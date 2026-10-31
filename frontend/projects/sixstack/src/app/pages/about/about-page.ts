import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { SITE_API, SiteStats } from 'api';
import { Stat, StatsRow } from 'components';
import { catchError, of } from 'rxjs';

/** About 6ixstack (`/about`, L2-072): static prose with a row of live stats, omitted when they cannot load. */
@Component({
  selector: 'sx-about-page',
  imports: [RouterLink, Stat, StatsRow],
  template: `
    <div class="page-title">
      <h1>About 6ixstack</h1>
      <p class="lead">Made in Toronto, for the people building in the 6ix.</p>
    </div>
    @if (stats(); as s) {
      <sx-stats-row class="about-stats">
        <sx-stat label="Communities" [value]="n(s.communities)" />
        <sx-stat [label]="'Events listed in ' + s.year" [value]="n(s.eventsListedThisYear)" />
        <sx-stat label="Feed subscribers" [value]="n(s.feedSubscribers)" />
        <sx-stat label="Volunteer moderators" [value]="n(s.volunteerModerators)" />
      </sx-stats-row>
    }
    <div class="prose">
      <p>
        6ixstack is one calendar for every developer event in Toronto and the GTA, plus the global talks you
        can stream. It started in 2025 because finding a good meetup meant checking a dozen Meetup groups,
        LinkedIn posts and Discord servers.
      </p>
      <h2>How listings work</h2>
      <p>
        Anyone can submit an event for free. A volunteer moderator checks each one within a day: is it a real
        event, is it for developers, and are the date, time and venue right? Organizers can then edit their
        own listings.
      </p>
      <h2>What we don’t do</h2>
      <ul>
        <li>We never sell tickets or charge attendees.</li>
        <li>We don’t track you across sites; there are no ad cookies.</li>
        <li>We don’t rank events by who pays.</li>
      </ul>
      <h2>Who runs it</h2>
      <p>
        A small group of volunteers from the GTA developer community, led by Jordan Lee. Questions or ideas?
        <a routerLink="/contact">Get in touch</a>.
      </p>
    </div>
  `,
  styleUrl: './about-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutPage {
  /** Null until the stats arrive, and when they fail: the row is simply not drawn. */
  protected readonly stats = toSignal(
    inject(SITE_API)
      .stats()
      .pipe(catchError(() => of(null as SiteStats | null))),
    { initialValue: null },
  );

  protected n(value: number): string {
    return value.toLocaleString('en-CA');
  }
}
