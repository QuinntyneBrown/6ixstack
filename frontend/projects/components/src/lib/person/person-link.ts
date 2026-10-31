import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Avatar } from '../avatar/avatar';

/** A person's avatar, name and role, linking to their page (speakers, organizers). */
@Component({
  selector: 'sx-person-link',
  imports: [Avatar, RouterLink],
  template: `
    <a class="person" [routerLink]="link()">
      <sx-avatar [initials]="initials()" [size]="size()" />
      <span
        ><span class="person__name">{{ name() }}</span
        ><br /><span class="person__role">{{ role() }}</span></span
      >
    </a>
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
  readonly link = input.required<string>();
  readonly size = input<'sm' | 'md' | 'lg'>('md');
}
