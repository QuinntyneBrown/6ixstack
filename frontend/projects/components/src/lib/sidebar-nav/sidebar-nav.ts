import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface SidebarNavItem {
  label: string;
  /** The id of the section on the page. */
  fragment: string;
}

/**
 * Links to the sections of a long page (design system: sidebar navigation): a row on phones, a sticky column from
 * 1024 px. The current section carries `aria-current`.
 */
@Component({
  selector: 'sx-sidebar-nav',
  imports: [RouterLink],
  template: `
    <nav class="sidebar-nav" [attr.aria-label]="label()">
      @for (item of items(); track item.fragment) {
        <a
          class="sidebar-nav__link"
          [routerLink]="[]"
          [fragment]="item.fragment"
          [attr.aria-current]="item.fragment === current() ? 'page' : null"
          (click)="go($event, item.fragment)"
          >{{ item.label }}</a
        >
      }
    </nav>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }
    .sidebar-nav {
      display: flex;
      gap: var(--spacingHorizontalXS);
      overflow-x: auto;
    }
    @media (min-width: 64rem) {
      :host {
        position: sticky;
        top: 5rem;
        align-self: start;
      }
      .sidebar-nav {
        flex-direction: column;
      }
    }
    .sidebar-nav__link {
      display: block;
      padding: var(--spacingHorizontalS) var(--spacingHorizontalM);
      border-radius: var(--borderRadiusLarge);
      color: var(--colorNeutralForeground2);
      font: var(--sx-text-label);
      text-decoration: none;
      white-space: nowrap;
    }
    .sidebar-nav__link:hover {
      background: var(--colorSubtleBackgroundHover);
      color: var(--colorNeutralForeground1);
    }
    .sidebar-nav__link[aria-current='page'] {
      background: var(--colorSubtleBackgroundHover);
      color: var(--colorNeutralForeground1);
    }
    .sidebar-nav__link:focus-visible {
      outline: var(--sx-focus-ring-width) solid var(--colorStrokeFocus2);
      outline-offset: 2px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarNav {
  readonly label = input.required<string>();
  readonly items = input.required<SidebarNavItem[]>();
  readonly current = input<string | null>(null);
  readonly selected = output<string>();

  /** Scrolls to the section and moves focus there, as anchor links would. */
  protected go(event: MouseEvent, fragment: string): void {
    const target = document.getElementById(fragment);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ block: 'start' });
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    this.selected.emit(fragment);
  }
}
