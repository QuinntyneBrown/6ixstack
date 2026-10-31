import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SessionStore } from '../../shell/session/session-store';

/**
 * Where an organizer lands after signing in. Only the page title for now: the dashboard itself arrives with
 * journey 15 (ADR 0009).
 */
@Component({
  selector: 'sx-organize-page',
  template: `
    <div class="page-title">
      <h1>Your events</h1>
      <p class="lead">Signed in as {{ session.user()?.email }}</p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizePage {
  protected readonly session = inject(SessionStore);
}
