import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button, StatusPage } from 'components';

/** Not found (404): unknown routes, and detail pages whose item does not exist (L2-076). */
@Component({
  selector: 'sx-not-found-page',
  imports: [RouterLink, Button, StatusPage],
  template: `
    <sx-status-page code="404" heading="We can't find that page">
      <p slot="message">
        The event may have been removed by its organizer, or the link has a typo. Search for it or browse
        what's on.
      </p>
      <ng-container slot="actions">
        <a sx-button appearance="primary" routerLink="/">Browse events</a>
        <a sx-button routerLink="/calendar">Open the calendar</a>
      </ng-container>
    </sx-status-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {}
