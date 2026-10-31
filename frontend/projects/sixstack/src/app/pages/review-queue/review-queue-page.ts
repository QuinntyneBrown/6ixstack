import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Where a moderator lands after signing in. Only the page title for now: the queue itself arrives with
 * journey 06 (ADR 0009).
 */
@Component({
  selector: 'sx-review-queue-page',
  template: `
    <div class="page-title">
      <h1>Review queue</h1>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewQueuePage {}
