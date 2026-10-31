import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Avatar } from '../avatar/avatar';

/** A person's avatar, name and role, linking to their page (speakers, organizers). */
@Component({
  selector: 'sx-person-link',
  imports: [Avatar, NgTemplateOutlet, RouterLink],
  template: `
    <ng-template #body>
      <sx-avatar [initials]="initials()" [size]="size()" />
      <span
        ><span class="person__name">{{ name() }}</span
        ><br /><span class="person__role">{{ role() }}</span></span
      >
    </ng-template>
    @if (link(); as href) {
      <a class="person" [routerLink]="href"><ng-container [ngTemplateOutlet]="body" /></a>
    } @else {
      <span class="person"><ng-container [ngTemplateOutlet]="body" /></span>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .person {
      display: flex;
      align-items: center;
      gap: var(--spacingHorizontalM);
      color: inherit;
      text-decoration: none;
    }
    .person__name {
      font: var(--sx-text-label);
    }
    .person__role {
      font: var(--sx-text-body-sm);
      color: var(--colorNeutralForeground2);
    }
    .person:hover {
      color: inherit;
    }
    .person:hover .person__name {
      text-decoration: underline;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonLink {
  readonly name = input.required<string>();
  readonly role = input('');
  readonly initials = input.required<string>();
  /** The person's page; null shows the name without a link (an organizer with no speaker profile). */
  readonly link = input.required<string | null>();
  readonly size = input<'sm' | 'md' | 'lg'>('md');
}
