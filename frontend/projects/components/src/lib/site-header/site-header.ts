import { booleanAttribute, ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Button } from '../button/button';
import { Icon } from '../icon/icon';
import { NavItem } from '../navigation/nav-item';

/**
 * The site header: brand, Primary navigation with the current page marked, a slot for signed-in actions
 * (`[slot=actions]`), Submit event and the menu button. CSS shows the navigation from 992 px and the
 * menu button below it (L2-095, L2-096).
 */
@Component({
  selector: 'sx-site-header',
  imports: [RouterLink, RouterLinkActive, Button, Icon],
  templateUrl: './site-header.html',
  styleUrl: './site-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteHeader {
  readonly items = input.required<NavItem[]>();
  readonly homePath = input('/');
  readonly submitPath = input('/submit');
  readonly showSubmit = input(true, { transform: booleanAttribute });
  readonly submitDisabled = input(false, { transform: booleanAttribute });
  readonly menuExpanded = input(false, { transform: booleanAttribute });

  /** Emits the menu button so the opener can return focus to it. */
  readonly menuRequested = output<HTMLButtonElement>();
}
