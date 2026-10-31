import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * A full-page status message (404, 403, 500, offline): a large decorative code hidden from assistive
 * technology, the heading, a message (`[slot=message]`) and actions (`[slot=actions]`).
 */
@Component({
  selector: 'sx-status-page',
  template: `
    <div class="status-page">
      <div>
        <div class="status-page__code" aria-hidden="true">{{ code() }}<span>.</span></div>
        <h1>{{ heading() }}</h1>
        <div class="status-page__message"><ng-content select="[slot=message]" /></div>
        <div class="empty__actions"><ng-content select="[slot=actions]" /></div>
      </div>
    </div>
  `,
  styleUrl: './status-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusPage {
  readonly code = input.required<string>();
  readonly heading = input.required<string>();
}
