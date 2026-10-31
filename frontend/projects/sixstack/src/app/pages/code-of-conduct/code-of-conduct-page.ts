import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Code of conduct (`/code-of-conduct`, L2-072): static prose with how to report and what happens next. */
@Component({
  selector: 'sx-code-of-conduct-page',
  template: `
    <div class="page-title">
      <h1>Code of conduct</h1>
      <p class="lead">Applies to every event listed on 6ixstack, in person and online.</p>
    </div>
    <div class="prose">
      <p>
        Every event listed on 6ixstack agrees to provide a harassment-free experience for everyone, regardless
        of gender, gender identity, sexual orientation, disability, appearance, body size, race, ethnicity,
        age, religion or nationality.
      </p>
      <h2>Expected behaviour</h2>
      <ul>
        <li>Be welcoming to people who are new to the community or to tech.</li>
        <li>Respect the speaker and the audience; heckling is not debate.</li>
        <li>Ask before photographing or recording people.</li>
      </ul>
      <h2>Not acceptable</h2>
      <ul>
        <li>Harassment, intimidation or discrimination in any form.</li>
        <li>Sexual language or imagery in talks, slides or chat.</li>
        <li>Sustained disruption of talks or events.</li>
      </ul>
      <h2>Reporting</h2>
      <p>
        Email <a href="mailto:conduct@6ixstack.dev">conduct&#64;6ixstack.dev</a> or choose “Code of conduct
        concern” under Report a problem on any event page. Reports go to two moderators, never to the event
        organizer, and we reply within 24 hours.
      </p>
      <h2>What happens next</h2>
      <p>
        We talk to the people involved, decide on a response — from a warning to removing a group’s listings —
        and tell you what we did. Organizers who ignore this code lose the ability to list events.
      </p>
      <p class="text-muted">Last updated September 1, 2026.</p>
    </div>
  `,
  styleUrl: './code-of-conduct-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodeOfConductPage {}
