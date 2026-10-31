import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Button, DialogShell, Divider, Icon } from 'components';
import { MORE_ITEMS, NAV_ITEMS } from '../../shell/nav-items';

export const MOBILE_MENU_TITLE_ID = 'mobile-menu-title';

/** The phone menu (L2-096): primary destinations, Calendar feeds, Organizer sign in and Submit event. */
@Component({
  selector: 'sx-mobile-menu-dialog',
  imports: [RouterLink, RouterLinkActive, Button, DialogShell, Divider, Icon],
  template: `
    <sx-dialog-shell title="Menu" [titleId]="titleId" variant="sheet">
      <div class="stack">
        <nav class="mobile-nav" aria-label="Menu">
          @for (item of navItems; track item.path) {
            <a
              class="nav-link"
              [routerLink]="item.path"
              routerLinkActive="nav-link--active"
              [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
              ariaCurrentWhenActive="page"
              (click)="close()"
              >{{ item.label }}</a
            >
          }
        </nav>
        <sx-divider class="mobile-nav__divider" />
        <nav class="mobile-nav" aria-label="More">
          @for (item of moreItems; track item.path) {
            <a
              class="nav-link"
              [routerLink]="item.path"
              routerLinkActive="nav-link--active"
              ariaCurrentWhenActive="page"
              (click)="close()"
            >
              @if (item.icon) {
                <sx-icon [name]="item.icon" />
              }
              {{ item.label }}
            </a>
          }
        </nav>
      </div>
      <a slot="footer" sx-button appearance="primary" size="lg" block routerLink="/submit" (click)="close()">
        <sx-icon name="plus" />Submit event
      </a>
    </sx-dialog-shell>
  `,
  styles: `
    .mobile-nav {
      display: flex;
      flex-direction: column;
      gap: var(--spacingHorizontalXS);
    }
    .mobile-nav__divider {
      --sx-divider-margin: var(--spacingHorizontalS) 0;
    }
    .nav-link {
      display: flex;
      align-items: center;
      gap: var(--spacingHorizontalS);
      min-height: 3rem;
      padding: 0 var(--spacingHorizontalM);
      border-radius: var(--borderRadiusXLarge);
      color: var(--colorNeutralForeground2);
      text-decoration: none;
      font: var(--sx-text-label);
      font-size: var(--sx-font-size-lead);
    }
    .nav-link:hover,
    .nav-link[aria-current='page'] {
      background: var(--colorSubtleBackgroundHover);
      color: var(--colorNeutralForeground1);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileMenuDialog {
  private readonly dialogRef = inject(DialogRef);

  protected readonly titleId = MOBILE_MENU_TITLE_ID;
  protected readonly navItems = NAV_ITEMS;
  protected readonly moreItems = MORE_ITEMS;

  protected close(): void {
    this.dialogRef.close();
  }
}
