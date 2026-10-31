import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon } from '../icon/icon';
import { IconName } from '../icon/icons';
import { TopicTag } from '../topics/topic-tag';
import { TopicKey } from '../topics/topics';

export type ReviewCheckOutcome = 'passed' | 'warning' | 'pending';

export interface ReviewCheck {
  outcome: ReviewCheckOutcome;
  message: string;
}

const CHECK_ICONS: Record<ReviewCheckOutcome, IconName> = {
  passed: 'check-circle',
  warning: 'warning',
  pending: 'clock',
};

/**
 * A submission waiting for review (design system: card, review card): title, organizer, when and where, topics, the
 * automatic checks and who sent it, with the moderator's actions in `[slot=actions]`. The card itself is not a
 * target, but it takes programmatic focus so keyboard shortcuts can act on it.
 */
@Component({
  selector: 'li[sx-review-card]',
  imports: [Icon, TopicTag],
  template: `
    <div class="review-card__body">
      <h2>{{ title() }}</h2>
      <p class="review-card__organizer">{{ organizer() }}</p>
      <div class="event-row__meta">
        <span class="meta-item"><sx-icon name="calendar" size="sm" />{{ when() }}</span>
        <span class="meta-item"><sx-icon name="pin" size="sm" />{{ where() }}</span>
        @for (topic of topics(); track topic) {
          <sx-topic-tag [topic]="topic" />
        } @empty {
          <span class="no-topic">No topic picked</span>
        }
      </div>
      <ul class="check-list" aria-label="Automatic checks">
        @for (check of checks(); track $index) {
          <li [attr.data-outcome]="check.outcome">
            <sx-icon
              [name]="icons[check.outcome]"
              size="sm"
              [class]="'check-icon check-icon--' + check.outcome"
            />{{ check.message }}
          </li>
        }
      </ul>
      <p class="review-card__submitted">Submitted {{ submitted() }}</p>
    </div>
    <div class="review-card__actions"><ng-content select="[slot=actions]" /></div>
  `,
  styleUrl: './review-card.scss',
  host: { class: 'review-card', tabindex: '-1' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewCard {
  readonly title = input.required<string>();
  readonly organizer = input.required<string>();
  readonly when = input.required<string>();
  readonly where = input.required<string>();
  readonly topics = input<TopicKey[]>([]);
  readonly checks = input<ReviewCheck[]>([]);
  /** "5 hours ago · hello@cloudnativeto.ca", shown after "Submitted". */
  readonly submitted = input.required<string>();

  protected readonly icons = CHECK_ICONS;
}
