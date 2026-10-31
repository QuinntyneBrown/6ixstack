import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Avatar } from '../avatar/avatar';
import { Icon } from '../icon/icon';
import { IconName } from '../icon/icons';
import { LogoTile } from '../logo-tile/logo-tile';
import { TopicTag } from '../topics/topic-tag';
import { TopicKey } from '../topics/topics';

/**
 * A directory card for a community or a speaker (design system: card, directory; L2-029): logo tile, the name as the
 * card's only link (a stretched link makes the whole card open it), a sub line, description, a meta line and topics.
 */
@Component({
  selector: 'sx-directory-card',
  imports: [Avatar, Icon, LogoTile, RouterLink, TopicTag],
  template: `
    <article class="dir-card">
      <div class="dir-card__head">
        @if (variant() === 'person') {
          <sx-avatar [initials]="initials()" />
        } @else {
          <sx-logo-tile [initials]="initials()" />
        }
        <div>
          <h2 class="dir-card__title">
            <a [routerLink]="link()">{{ name() }}</a>
          </h2>
          <p class="dir-card__sub">{{ sub() }}</p>
        </div>
      </div>
      @if (description()) {
        <p class="dir-card__desc">{{ description() }}</p>
      }
      @if (variant() === 'person') {
        <div class="dir-card__topics">
          @for (topic of topics(); track topic) {
            <sx-topic-tag [topic]="topic" />
          }
        </div>
      }
      @if (meta() || variant() === 'community') {
        <div class="dir-card__foot">
          @if (meta()) {
            <span class="meta-item"><sx-icon [name]="metaIcon()" size="sm" />{{ meta() }}</span>
          }
          @if (variant() === 'community') {
            @for (topic of topics(); track topic) {
              <sx-topic-tag [topic]="topic" />
            }
          }
        </div>
      }
    </article>
  `,
  styleUrl: './directory-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DirectoryCard {
  readonly initials = input.required<string>();
  readonly name = input.required<string>();
  readonly link = input.required<string>();
  readonly sub = input('');
  readonly description = input('');
  readonly meta = input<string | null>(null);
  readonly metaIcon = input<IconName>('calendar');
  readonly topics = input<TopicKey[]>([]);
  /** `person` (speakers): an avatar, topics under the name and the meta line alone in the foot. */
  readonly variant = input<'community' | 'person'>('community');
}
