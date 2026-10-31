import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ReviewCard } from 'components';
import { Scenario } from './scenario';

@Component({
  selector: 'sx-review-card-scenario',
  imports: [ReviewCard],
  template: `@for (i of items(); track i) {
    <li
      sx-review-card
      title="Rust in production"
      organizer="Toronto Rust Meetup"
      when="Tue, Nov 17 · 6:30 PM"
      where="Shopify, 620 King St W, Toronto"
      [checks]="checks"
      submitted="2 hours ago · organizers@torontorust.ca"
    ></li>
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ReviewCardScenario {
  readonly items = input.required<number[]>();
  readonly checks = [{ outcome: 'passed' as const, message: 'Link reachable' }];
}

export const scenario: Scenario = { name: 'ReviewCard', component: ReviewCardScenario };
